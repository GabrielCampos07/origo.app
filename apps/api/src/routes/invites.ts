import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ProfessionalCategory } from '@prisma/client';
import { generateSecureToken, hashToken } from '../lib/crypto';
import { verifyAccessToken } from '../lib/jwt';
import { sendInviteEmail } from '../lib/email';

const prisma = new PrismaClient();

/**
 * BACKEND SECURITY NOTES (7 LOCKED REQUIREMENTS):
 * 
 * 1. TOKEN HASH ONLY AT REST · TTL · SINGLE-USE
 *    - InviteToken.tokenHash stores SHA-256 hash only (never plaintext)
 *    - expiresAt enforces TTL (30 days default)
 *    - usedAt marks token as consumed (single-use)
 * 
 * 2. ZERO CLIENT-SUPPLIED userIds/professionalIds/CATEGORY
 *    - professionalUserId derived from JWT sub claim only
 *    - studentUserId assigned server-side on registration
 *    - category DERIVED FROM ProfessionalProfile (JWT user) - NEVER from request body
 *    - OWNER LOCK (Gabriel): category removed from POST /invites request body
 *    - Legacy clients that send category in body: field is IGNORED (not validated)
 * 
 * 3. GENERIC INVITE STATES (NO ENUMERATION)
 *    - GET /invites/:token returns only: valid | expired | used | invalid
 *    - No PII exposed (no professional name/email beyond generic category hint)
 *    - No distinction between "not found" and "invalid"
 * 
 * 4. ENROLLMENT UNIQUE ACTIVE (STUDENT, CATEGORY)
 *    - Partial unique index enforces 1 ACTIVE per (studentUserId, category)
 *    - Switch enrollment: REVOKE old + create new (future slice)
 * 
 * 5. IDOR FAIL-CLOSED
 *    - Professional can only create invites for themselves (JWT userId)
 *    - Student can only enroll themselves (JWT userId on register)
 *    - No list/enumerate endpoints (no GET /invites without :token)
 * 
 * 6. PROFESSIONAL-ONLY CREATE INVITE
 *    - POST /invites requires PROFESSIONAL role (checked via JWT + DB)
 *    - Returns 403 for STUDENT users
 * 
 * 7. STUDENT REDEEM VIA VALID INVITE ONLY
 *    - POST /auth/register/student requires valid invite token
 *    - Token validated: exists, not expired, not used
 *    - Token marked as used atomically with enrollment creation
 * 
 * BACKEND SECURITY CHECKER (Sec light) - REVIEW NOTES:
 * - Category field REMOVED from POST /invites request body (OWNER lock: Gabriel)
 * - Category now derived EXCLUSIVELY from authenticated professional's ProfessionalProfile
 * - This eliminates client-side category manipulation vector
 * - student_email field ADDED to request body (OWNER: Front #37 merged)
 * - student_email validated (required, email format) but NOT stored (no InviteToken.studentEmail column)
 * - OWNER: no migration. student_email validation only for frontend UX consistency.
 * - InviteToken.category and Enrollment.category still stored (from profile, not client)
 * - No DB schema changes in this commit (category columns remain, no student email column added)
 * - OpenAPI contract updated: CreateInviteRequest requires student_email, omits category
 * 
 * P0 500 ERROR FIX (LIVE):
 * - Added request.body validation before destructuring (prevents 500 on missing/malformed body)
 * - Separated JWT verification with dedicated try-catch (returns 401 instead of 500 on invalid JWT)
 * - Added Prisma error handling for specific error codes (P2025, P2002, P2003)
 * - Returns proper 401/403/404/422 status codes instead of generic 500 where applicable
 */

// OWNER lock (Gabriel) for Origo.app invite student flow:
// - Category REMOVED from request body (derived from ProfessionalProfile)
// - student_email REQUIRED in request body (validated, NOT stored - no migration)
// Front #37 MERGED: invite UI sends ONLY `student_email` (no category).
interface CreateInviteBody {
  student_email: string; // Required: validated for email format, NOT stored (no InviteToken.studentEmail column)
}

interface ValidateInviteBody {
  token: string;
}

interface RegisterProfessionalBody {
  name: string;
  email: string;
  password: string;
  category: ProfessionalCategory;
}

interface RegisterStudentBody {
  invite_token: string;
  name: string;
  password: string;
  email?: string; // Optional: some flows might include it, but we derive from invite
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (≥12 chars)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 12;
}

/**
 * Get invite token expiry (30 days TTL)
 */
function getInviteTokenExpiry(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export async function inviteRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/invites
   * Create invite token (PROFESSIONAL only)
   * 
   * SECURITY:
   * - Requires valid JWT with PROFESSIONAL role (Sec 2, 6)
   * - professionalUserId from JWT sub claim only (Sec 2)
   * - category derived from ProfessionalProfile only (Sec 2) - NEVER client-supplied
   * - Returns opaque token once; stores hash only (Sec 1)
   * 
   * OWNER LOCK (Gabriel) - Front #37 MERGED:
   * - Category REMOVED from request body (derived from ProfessionalProfile)
   * - student_email REQUIRED in request body (validated, NOT stored - no migration)
   * - Front sends ONLY `student_email` (no category)
   * 
   * Body: { student_email: string }
   * Returns: { invite_url: string (token), expires_at: Date }
   */
  fastify.post<{ Body: CreateInviteBody }>(
    '/api/v1/invites',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateInviteBody }>, reply: FastifyReply) => {
      // OWNER LOCK (Gabriel) - Front #37 MERGED:
      // - student_email REQUIRED in body (validated, NOT stored - no migration)
      // - category NO LONGER in body (derived from ProfessionalProfile)
      
      // BACKEND SECURITY CHECKER: Validate request body exists before destructuring
      // Prevents 500 if body is undefined/null (malformed JSON or missing Content-Type)
      if (!request.body || typeof request.body !== 'object') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Request body is required',
        });
      }

      const { student_email } = request.body;

      // Validate student_email (required, email format)
      if (!student_email || typeof student_email !== 'string') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'student_email is required',
        });
      }

      if (!isValidEmail(student_email)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid email format',
        });
      }

      // NOTE: student_email validated but NOT stored (InviteToken has no studentEmail column)
      // OWNER: no migration. Email validation only for frontend UX consistency.

      // Authentication check
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      // BACKEND SECURITY CHECKER: Extract and verify JWT
      // Catch JWT errors separately to return 401 instead of 500
      let professionalUserId: string;
      try {
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        professionalUserId = payload.userId;
      } catch (jwtError) {
        // JWT verification failed (invalid, expired, malformed, or signature mismatch)
        fastify.log.warn(jwtError, 'JWT verification failed in POST /invites');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token',
        });
      }

      try {
        // SECURITY (Sec 2): Extract userId from JWT (server-side, signature-verified)

        // SECURITY (Sec 6): Verify PROFESSIONAL role and profile
        const user = await prisma.user.findUnique({
          where: { id: professionalUserId },
          include: {
            professionalProfile: true,
          },
        });

        if (!user) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        // SECURITY (Sec 6): Enforce PROFESSIONAL-only
        if (user.role !== 'PROFESSIONAL') {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Only PROFESSIONAL users can create invites',
          });
        }

        // SECURITY (Sec 2): Derive category from ProfessionalProfile (NEVER client-supplied)
        // OWNER LOCK (Gabriel): This is the ONLY source of category for invite creation.
        if (!user.professionalProfile) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Professional profile not found',
          });
        }

        const category = user.professionalProfile.category;

        // SECURITY (Sec 1): Generate secure token (≥128 bits entropy)
        // Returns plaintext token + SHA-256 hash
        const { token: inviteToken, hash: tokenHash } = generateSecureToken();
        const expiresAt = getInviteTokenExpiry();

        // SECURITY (Sec 1): Store hash only (never plaintext)
        // Category stored in InviteToken from professional's profile (for enrollment)
        await prisma.inviteToken.create({
          data: {
            professionalUserId,
            category, // Derived from ProfessionalProfile.category (server-side only)
            tokenHash,
            expiresAt,
          },
        });

        // INFRA (best-effort email): Send invite email to student
        // IMPORTANT: Email send failures do NOT fail the invite creation (soft-fail)
        // - Resend domain (beorigo.app) may be unverified in production
        // - SMTP errors logged but invite still returns 200 with invite_url
        // - Invite token creation ALWAYS succeeds (professional can share link manually)
        // SECURITY: student_email logged only on error (not success), never log inviteToken
        try {
          await sendInviteEmail(student_email, inviteToken);
        } catch (emailError) {
          // Log SMTP error (soft-fail - do NOT fail invite creation)
          // SECURITY: Log minimal details (no token, email address partially redacted)
          const emailDomain = student_email.split('@')[1];
          fastify.log.warn(
            { error: emailError, emailDomain },
            'Invite email send failed (soft-fail, invite still created)'
          );
        }

        // SECURITY (Sec 1): Return opaque token once (never logged, never stored plaintext)
        // Frontend constructs: {origin}/convite#token={inviteToken}
        return reply.code(200).send({
          invite_url: inviteToken, // Opaque token (returned once)
          expires_at: expiresAt.toISOString(),
        });
      } catch (error) {
        // BACKEND SECURITY CHECKER: Handle Prisma-specific errors with proper status codes
        // Prevents leaking internal error details while providing actionable feedback
        
        if (error && typeof error === 'object' && 'code' in error) {
          const prismaError = error as { code: string; meta?: any };
          
          // Prisma P2025: Record not found (foreign key constraint)
          if (prismaError.code === 'P2025') {
            fastify.log.warn(prismaError, 'Professional user not found during invite creation');
            return reply.code(404).send({
              error: 'Not Found',
              message: 'Professional user not found',
            });
          }
          
          // Prisma P2002: Unique constraint violation
          if (prismaError.code === 'P2002') {
            fastify.log.warn(prismaError, 'Unique constraint violation during invite creation');
            return reply.code(422).send({
              error: 'Validation Error',
              message: 'Unable to create invite due to data conflict',
            });
          }
          
          // Prisma P2003: Foreign key constraint failed
          if (prismaError.code === 'P2003') {
            fastify.log.warn(prismaError, 'Foreign key constraint failed during invite creation');
            return reply.code(422).send({
              error: 'Validation Error',
              message: 'Invalid reference data provided',
            });
          }
        }
        
        // Generic database or unexpected error
        fastify.log.error(error, 'Create invite error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating invite',
        });
      }
    }
  );

  /**
   * POST /api/v1/invites/validate
   * Validate invite token (public endpoint)
   * 
   * SECURITY (BACKEND SECURITY P1):
   * - Token in request body (NOT URL path/query) - prevents logging in:
   *   · Server access logs
   *   · Browser history
   *   · Referer headers
   *   · Proxy logs
   * - Public endpoint (no auth required) (Sec 7)
   * - Returns only generic states: valid | expired | used | invalid (Sec 3)
   * - PROFESSIONAL NAME EXPOSURE (VALID STATE ONLY):
   *   · professional_name (User.name) included ONLY when state is valid
   *   · No professional email, id, or other PII exposed
   *   · No name on expired/used/invalid states (no enumeration)
   * - No distinction between "not found" and "invalid" (Sec 3)
   * 
   * Body: { token: string }
   * Returns: { valid: boolean, state: 'valid' | 'expired' | 'used' | 'invalid', category?: string, professional_name?: string }
   */
  fastify.post<{ Body: ValidateInviteBody }>(
    '/api/v1/invites/validate',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (request: FastifyRequest<{ Body: ValidateInviteBody }>, reply: FastifyReply) => {
      const { token } = request.body;

      // SECURITY (Sec 3): Generic error for missing token
      if (!token || typeof token !== 'string') {
        return reply.code(200).send({
          valid: false,
          state: 'invalid',
        });
      }

      try {
        // SECURITY (Sec 1): Hash token to look up
        const tokenHash = hashToken(token);

        const inviteToken = await prisma.inviteToken.findUnique({
          where: { tokenHash },
          select: {
            expiresAt: true,
            usedAt: true,
            category: true,
            professional: {
              select: {
                name: true,
              },
            },
          },
        });

        // SECURITY (Sec 3): Generic "invalid" for not found (no enumeration)
        if (!inviteToken) {
          return reply.code(200).send({
            valid: false,
            state: 'invalid',
          });
        }

        // SECURITY (Sec 3): Return specific states only for found tokens
        if (inviteToken.usedAt !== null) {
          return reply.code(200).send({
            valid: false,
            state: 'used',
          });
        }

        if (inviteToken.expiresAt < new Date()) {
          return reply.code(200).send({
            valid: false,
            state: 'expired',
          });
        }

        // SECURITY (Sec 3): Valid token - return minimal context (category hint + professional name only)
        return reply.code(200).send({
          valid: true,
          state: 'valid',
          category: inviteToken.category,
          professional_name: inviteToken.professional.name || undefined,
        });
      } catch (error) {
        fastify.log.error(error, 'Validate invite error');
        // SECURITY (Sec 3): Generic error (no enumeration)
        return reply.code(200).send({
          valid: false,
          state: 'invalid',
        });
      }
    }
  );
}
