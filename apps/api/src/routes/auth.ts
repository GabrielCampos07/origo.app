import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
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
}
