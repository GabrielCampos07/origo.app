import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ProfessionalCategory } from '@prisma/client';
import { generateSecureToken, hashToken } from '../lib/crypto';
import { verifyAccessToken } from '../lib/jwt';

const prisma = new PrismaClient();

/**
 * BACKEND SECURITY NOTES (7 LOCKED REQUIREMENTS):
 * 
 * 1. TOKEN HASH ONLY AT REST · TTL · SINGLE-USE
 *    - InviteToken.tokenHash stores SHA-256 hash only (never plaintext)
 *    - expiresAt enforces TTL (30 days default)
 *    - usedAt marks token as consumed (single-use)
 * 
 * 2. ZERO CLIENT-SUPPLIED userIds/professionalIds
 *    - professionalUserId derived from JWT sub claim only
 *    - studentUserId assigned server-side on registration
 *    - category validated against enum server-side
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
 */

interface CreateInviteBody {
  category: ProfessionalCategory;
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
   * - category validated against ProfessionalProfile (Sec 2)
   * - Returns opaque token once; stores hash only (Sec 1)
   * 
   * Body: { category: ProfessionalCategory }
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
      const { category } = request.body;

      // Authentication check
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      try {
        // SECURITY (Sec 2): Extract userId from JWT (server-side, signature-verified)
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        const professionalUserId = payload.userId;

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

        // Validate category against enum
        if (!Object.values(ProfessionalCategory).includes(category)) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Invalid category',
          });
        }

        // SECURITY (Sec 2): Validate category matches professional profile
        if (!user.professionalProfile) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Professional profile not found',
          });
        }

        if (user.professionalProfile.category !== category) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Category must match your professional profile',
          });
        }

        // SECURITY (Sec 1): Generate secure token (≥128 bits entropy)
        // Returns plaintext token + SHA-256 hash
        const { token: inviteToken, hash: tokenHash } = generateSecureToken();
        const expiresAt = getInviteTokenExpiry();

        // SECURITY (Sec 1): Store hash only (never plaintext)
        await prisma.inviteToken.create({
          data: {
            professionalUserId,
            category,
            tokenHash,
            expiresAt,
          },
        });

        // SECURITY (Sec 1): Return opaque token once (never logged, never stored plaintext)
        // Frontend constructs: {origin}/convite#token={inviteToken}
        return reply.code(200).send({
          invite_url: inviteToken, // Opaque token (returned once)
          expires_at: expiresAt.toISOString(),
        });
      } catch (error) {
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
