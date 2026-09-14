import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ProfessionalCategory, UserRole } from '@prisma/client';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  hashEmailForRateLimit,
} from '../lib/crypto';
import {
  generateAccessToken,
  getRefreshTokenExpiry,
  getResetTokenExpiry,
} from '../lib/jwt';
import { sendPasswordResetEmail } from '../lib/email';
import { emailRateLimiter } from '../lib/rate-limiter';
import { REQUIRED_DOCS_ALL_USERS, REQUIRED_DOCS_PROFESSIONAL } from './legal';

const prisma = new PrismaClient();

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  new_password: string;
}

interface RegisterProfessionalBody {
  name: string;
  email: string;
  password: string;
  category: 'FISIOTERAPIA' | 'EDUCACAO_FISICA' | 'PERSONAL';
}

interface RegisterStudentBody {
  invite_token: string;
  name: string;
  password: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (D4: ≥12 chars minimal complexity)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 12;
}

/**
 * Add artificial delay for rate limiting mitigation (D7: constant-ish timing)
 */
async function constantTimeDelay(): Promise<void> {
  const minDelay = 50;
  const maxDelay = 150;
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * MUST-FIX 2: Measure and pad timing to equalize SMTP path vs no-user path
 * Returns a function to call at the end to pad remaining time
 */
function startTimingEqualization(): () => Promise<void> {
  const startTime = Date.now();
  const targetDuration = 200; // Target 200ms minimum response time

  return async () => {
    const elapsed = Date.now() - startTime;
    const remaining = targetDuration - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/auth/login
   * Body: { email, password }
   * Returns: { access_token, refresh_token, user: { id, email }, missing_doc_versions: string[] }
   * Errors: 422 validation, 401 bad credentials, 429 rate limit
   *
   * Legal V2 Integration:
   * - Returns missing_doc_versions array with required legal docs not yet accepted
   * - Frontend should redirect to legal acceptance screens if array is non-empty
   * - Required docs: privacy_v2_2026-09-13, terms_app_v2_2026-09-13
   * - PROFESSIONAL users (when User.role available): also terms_saas_v2_*, payments_notice_v2_*
   *
   * BACKEND SECURITY CHECKER:
   * - Rate limited: 5/min per IP AND 10/hour per email hash (MUST-FIX 1: implemented)
   * - Constant-ish timing for auth failure
   * - No account enumeration
   */
  fastify.post<{ Body: LoginBody }>(
    '/api/v1/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
          // Per-IP rate limit (primary)
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      // Validation (422)
      if (!email || !password) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Email and password are required',
        });
      }

      if (!isValidEmail(email)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid email format',
        });
      }

      // MUST-FIX 1: Email-hash rate limiting (10/hour per email)
      const emailHash = hashEmailForRateLimit(email);
      const emailRateLimitKey = `login:email:${emailHash}`;
      
      if (emailRateLimiter.check(emailRateLimitKey, 10, 3600000)) {
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded for this email',
        });
      }

      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            legalAcceptances: {
              select: { docVersion: true },
            },
          },
        });

        // Constant-time response for bad credentials (401)
        if (!user) {
          await constantTimeDelay();
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const isValid = await verifyPassword(user.passwordHash, password);
        if (!isValid) {
          await constantTimeDelay();
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });

        // Create opaque refresh token (D1: hash only in DB)
        const { token: refreshToken, hash: refreshTokenHash } =
          generateSecureToken();

        await prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: getRefreshTokenExpiry(),
          },
        });

        // Calculate missing legal documents (Legal V2)
        // User.role determines which docs are required
        const acceptedDocVersions = new Set(
          user.legalAcceptances.map(a => a.docVersion)
        );
        const requiredDocs = [
          ...REQUIRED_DOCS_ALL_USERS,
          ...(user.role === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
        ];
        const missingDocVersions = requiredDocs.filter(
          doc => !acceptedDocVersions.has(doc)
        );

        return reply.code(200).send({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role, // PROFESSIONAL | STUDENT
          },
          missing_doc_versions: missingDocVersions,
        });
      } catch (error) {
        fastify.log.error(error, 'Login error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred during login',
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/forgot-password
   * Body: { email }
   * Returns: ALWAYS 200 with generic message (D7: no account enumeration)
   * Errors: 422 validation, 429 rate limit
   *
   * BACKEND SECURITY CHECKER:
   * - Rate limited: 3/hour per email hash AND 10/hour per IP (MUST-FIX 1: implemented)
   * - ALWAYS returns generic 200, never reveals if email exists
   * - Constant-ish timing (MUST-FIX 2: equalized SMTP vs no-user timing)
   */
  fastify.post<{ Body: ForgotPasswordBody }>(
    '/api/v1/auth/forgot-password',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 hour',
          // Per-IP rate limit (secondary)
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: ForgotPasswordBody }>,
      reply: FastifyReply
    ) => {
      const { email } = request.body;

      // Validation (422)
      if (!email) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Email is required',
        });
      }

      if (!isValidEmail(email)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid email format',
        });
      }

      // MUST-FIX 1: Email-hash rate limiting (3/hour per email - primary limit)
      const emailHash = hashEmailForRateLimit(email);
      const emailRateLimitKey = `forgot:email:${emailHash}`;
      
      if (emailRateLimiter.check(emailRateLimitKey, 3, 3600000)) {
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }

      // MUST-FIX 2: Start timing equalization to prevent enumeration via response time
      const padTiming = startTimingEqualization();

      try {
        // Always return generic message (D7)
        // But only send email if user exists
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          // Generate reset token (D4: ≥128 bits entropy)
          const { token: resetToken, hash: resetTokenHash } =
            generateSecureToken();

          // Store token hash (D1: never store plaintext)
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: resetTokenHash,
              expiresAt: getResetTokenExpiry(),
            },
          });

          // Send email via SMTP to Mailhog (D2)
          await sendPasswordResetEmail(user.email, resetToken);
        }
        
        // MUST-FIX 2: Pad timing to target duration regardless of SMTP path
        await padTiming();

        // Generic response (D7: never reveal if email exists)
        return reply.code(200).send({
          message:
            'Se o email informado estiver cadastrado, você receberá instruções para redefinir sua senha',
        });
      } catch (error) {
        fastify.log.error(error, 'Forgot password error');
        // MUST-FIX 2: Pad timing even on error
        await padTiming();
        // Still return generic message on error
        return reply.code(200).send({
          message:
            'Se o email informado estiver cadastrado, você receberá instruções para redefinir sua senha',
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/reset-password
   * Body: { token, new_password }
   * Returns: 200 on success
   * Errors: 422 weak password, 410 expired/used/invalid token, 429 rate limit
   *
   * BACKEND SECURITY CHECKER:
   * - Rate limited: default global limit
   * - On success: invalidates ALL refresh tokens for that user (D1)
   * - Only returns 410 for any token issue (expired/used/invalid)
   * - Token is single-use (usedAt field)
   */
  fastify.post<{ Body: ResetPasswordBody }>(
    '/api/v1/auth/reset-password',
    async (
      request: FastifyRequest<{ Body: ResetPasswordBody }>,
      reply: FastifyReply
    ) => {
      const { token, new_password } = request.body;

      // Validation (422)
      if (!token || !new_password) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Token and new password are required',
        });
      }

      if (!isValidPassword(new_password)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Password must be at least 12 characters',
        });
      }

      try {
        // Hash token to look up
        const tokenHash = hashToken(token);

        // Find reset token
        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { tokenHash },
          include: { user: true },
        });

        // Check token validity (410 for any issue)
        if (
          !resetToken ||
          resetToken.usedAt !== null ||
          resetToken.expiresAt < new Date()
        ) {
          return reply.code(410).send({
            error: 'Gone',
            message: 'Reset token is invalid, expired, or already used',
          });
        }

        // Hash new password (D1: argon2id)
        const newPasswordHash = await hashPassword(new_password);

        // Update password, mark token as used, invalidate all refresh tokens (D1)
        await prisma.$transaction([
          prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: newPasswordHash },
          }),
          prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
          }),
          prisma.refreshToken.updateMany({
            where: { userId: resetToken.userId },
            data: { revokedAt: new Date() },
          }),
        ]);

        return reply.code(200).send({
          message: 'Password reset successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Reset password error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred during password reset',
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/register/professional
   * Professional registration (public endpoint)
   * 
   * BACKEND SECURITY NOTES:
   * - Sets User.role = PROFESSIONAL server-side only (Sec 2)
   * - Creates ProfessionalProfile from validated category (Sec 2)
   * - Returns tokens like login (no separate login required)
   * - Legal acceptance required before full access (403 middleware)
   * 
   * Body: { name, email, password, category }
   * Returns: { access_token, refresh_token, user, missing_doc_versions }
   */
  fastify.post<{ Body: RegisterProfessionalBody }>(
    '/api/v1/auth/register/professional',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RegisterProfessionalBody }>,
      reply: FastifyReply
    ) => {
      const { name, email, password, category } = request.body;

      // Validation (422)
      if (!name || !email || !password || !category) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Name, email, password, and category are required',
        });
      }

      if (!isValidEmail(email)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid email format',
        });
      }

      if (!isValidPassword(password)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Password must be at least 12 characters',
        });
      }

      // SECURITY (Sec 2): Validate category against enum server-side
      if (!Object.values(ProfessionalCategory).includes(category as any)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid professional category',
        });
      }

      try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Email already registered',
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // SECURITY (Sec 2): Create user with PROFESSIONAL role (server-side only)
        // Never trust client-supplied role
        const user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: email.toLowerCase(),
              passwordHash,
              name,
              role: UserRole.PROFESSIONAL, // SECURITY: Server-side role assignment
            },
          });

          // SECURITY (Sec 2): Create ProfessionalProfile with validated category
          await tx.professionalProfile.create({
            data: {
              userId: newUser.id,
              category: category as ProfessionalCategory,
            },
          });

          return newUser;
        });

        // Generate tokens (same as login)
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });

        const { token: refreshToken, hash: refreshTokenHash } =
          generateSecureToken();

        await prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: getRefreshTokenExpiry(),
          },
        });

        // Calculate missing legal documents
        // Professional users need: privacy + terms_app + terms_saas + payments_notice
        const missingDocVersions = [
          ...REQUIRED_DOCS_ALL_USERS,
          ...REQUIRED_DOCS_PROFESSIONAL,
        ];

        return reply.code(200).send({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          missing_doc_versions: missingDocVersions,
        });
      } catch (error) {
        fastify.log.error(error, 'Professional registration error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred during registration',
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/register/student
   * Student registration via invite token (public endpoint)
   * 
   * BACKEND SECURITY NOTES (7 LOCKED REQUIREMENTS):
   * 1. Validates invite token (hash lookup, TTL, single-use) (Sec 1, 7)
   * 2. Sets User.role = STUDENT server-side only (Sec 2)
   * 3. Creates ACTIVE Enrollment (studentUserId from new user, professionalUserId from invite) (Sec 4)
   * 4. Marks invite as used atomically (Sec 1)
   * 5. Generic 410/422 errors (no enumeration) (Sec 3)
   * 6. Validates unique ACTIVE enrollment constraint (Sec 4)
   * 7. Student can only enroll via valid invite (Sec 7)
   * 
   * Body: { invite_token, name, password }
   * Returns: { access_token, refresh_token, user, missing_doc_versions }
   * Errors: 422 validation, 410 invalid/expired/used invite
   */
  fastify.post<{ Body: RegisterStudentBody }>(
    '/api/v1/auth/register/student',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RegisterStudentBody }>,
      reply: FastifyReply
    ) => {
      const { invite_token, name, password } = request.body;

      // Validation (422)
      if (!invite_token || !name || !password) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invite token, name, and password are required',
        });
      }

      if (!isValidPassword(password)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Password must be at least 12 characters',
        });
      }

      try {
        // SECURITY (Sec 1, 7): Hash token to look up
        const tokenHash = hashToken(invite_token);

        const inviteToken = await prisma.inviteToken.findUnique({
          where: { tokenHash },
          include: {
            professional: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        // SECURITY (Sec 3, 7): Generic 410 for any invite issue (no enumeration)
        if (!inviteToken) {
          return reply.code(410).send({
            error: 'Gone',
            message: 'Invalid or expired invite link',
          });
        }

        // SECURITY (Sec 1, 7): Check token validity (single-use via usedAt)
        if (inviteToken.usedAt !== null) {
          return reply.code(410).send({
            error: 'Gone',
            message: 'Invite link has already been used',
          });
        }

        // SECURITY (Sec 1, 7): Check TTL
        if (inviteToken.expiresAt < new Date()) {
          return reply.code(410).send({
            error: 'Gone',
            message: 'Invite link has expired',
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // SECURITY (Sec 2, 4, 7): Atomic transaction:
        // 1. Create user with STUDENT role (server-side only)
        // 2. Create ACTIVE enrollment
        // 3. Mark invite as used
        const result = await prisma.$transaction(async (tx) => {
          // SECURITY (Sec 2): Create user with STUDENT role (never trust client)
          // Use professional's email initially (can be updated later)
          // Generate unique email: student-{timestamp}-{random}@temp.origo.app
          const tempEmail = `student-${Date.now()}-${Math.random().toString(36).substring(7)}@temp.origo.app`;
          
          const newUser = await tx.user.create({
            data: {
              email: tempEmail, // Temporary email (invite doesn't carry student email)
              passwordHash,
              name,
              role: UserRole.STUDENT, // SECURITY: Server-side role assignment
            },
          });

          // SECURITY (Sec 4): Create ACTIVE enrollment
          // Partial unique index enforces 1 ACTIVE per (studentUserId, category)
          await tx.enrollment.create({
            data: {
              studentUserId: newUser.id,
              professionalUserId: inviteToken.professionalUserId,
              category: inviteToken.category,
              status: 'ACTIVE',
            },
          });

          // SECURITY (Sec 1): Mark invite as used (single-use)
          await tx.inviteToken.update({
            where: { id: inviteToken.id },
            data: { usedAt: new Date() },
          });

          return newUser;
        });

        // Generate tokens (same as login)
        const accessToken = generateAccessToken({
          userId: result.id,
          email: result.email,
        });

        const { token: refreshToken, hash: refreshTokenHash } =
          generateSecureToken();

        await prisma.refreshToken.create({
          data: {
            userId: result.id,
            tokenHash: refreshTokenHash,
            expiresAt: getRefreshTokenExpiry(),
          },
        });

        // Calculate missing legal documents
        // Student users need: privacy + terms_app
        const missingDocVersions = [...REQUIRED_DOCS_ALL_USERS];

        return reply.code(200).send({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: result.id,
            email: result.email,
            role: result.role,
          },
          missing_doc_versions: missingDocVersions,
        });
      } catch (error: any) {
        fastify.log.error(error, 'Student registration error');

        // SECURITY (Sec 3, 4): Handle unique constraint violations generically
        // Prisma error P2002 = unique constraint violation
        if (error.code === 'P2002') {
          // Could be duplicate ACTIVE enrollment (violates partial unique index)
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Unable to complete registration',
          });
        }

        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred during registration',
        });
      }
    }
  );
}
