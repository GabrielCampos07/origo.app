import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ReferralStatus } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

/**
 * Referral MVP Routes
 * 
 * BACKEND SECURITY NOTES:
 * - PROFESSIONAL-only enforcement (403 otherwise) for GET /code and GET /status
 * - Codes are citext unique; one active code per user enforced by DB schema
 * - Payouts are append-only; no client-writable amounts
 * - Referral codes are exactly 8 characters: uppercase alphanumeric (base32-like)
 * - Validate endpoint is public (or authenticated) - validates code without leaking PII
 * - All authenticated endpoints extract userId from JWT (server-side, signature-verified)
 */

/**
 * Extract userId from request
 * SECURITY FIX: Prefer middleware-verified user to avoid redundant JWT verification
 * Falls back to manual extraction if middleware didn't run (exempt routes)
 */
function extractUserId(request: FastifyRequest): string | null {
  // SECURITY FIX: Check if middleware already verified the user
  // @ts-ignore - Custom property added by middleware
  if (request.authenticatedUser?.userId) {
    // @ts-ignore
    return request.authenticatedUser.userId;
  }

  // Fallback: Manual extraction for routes where middleware didn't run
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    console.warn('[REFERRAL AUTH] No Authorization header present');
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.warn('[REFERRAL AUTH] Authorization header does not start with "Bearer "');
    return null;
  }

  try {
    const token = authHeader.substring(7);
    if (!token || token.trim() === '') {
      console.warn('[REFERRAL AUTH] Empty token after "Bearer " prefix');
      return null;
    }
    
    const payload = verifyAccessToken(token);
    
    if (!payload || !payload.userId) {
      console.warn('[REFERRAL AUTH] JWT payload missing userId:', payload);
      return null;
    }
    
    return payload.userId;
  } catch (error) {
    console.error('[REFERRAL AUTH] JWT verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Generate a unique referral code (8 chars uppercase alphanumeric)
 * Format: [A-Z0-9]{8} (excludes ambiguous chars like 0/O, 1/I)
 * Example: XYZA1234
 */
function generateReferralCode(): string {
  // Base32-like charset (excluding 0, 1, I, O for clarity)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += charset[bytes[i] % charset.length];
  }
  
  return code;
}

/**
 * Check if user has PROFESSIONAL role
 */
async function isProfessionalUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  return user?.role === 'PROFESSIONAL';
}

interface ValidateReferralCodeBody {
  code?: string;
  referral_code?: string;
}

interface ValidateReferralCodeResponse {
  valid: boolean;
  referrer_hint?: string;
}

interface ReferralCodeResponse {
  code: string;
  created_at: string;
}

interface ReferralStatusResponse {
  referral_code: {
    code: string;
    created_at: string;
  };
  referrals: Array<{
    referred_user_id: string;
    status: string;
    created_at: string;
    free_month_ends_at: string | null;
  }>;
  payouts: Array<{
    referral_id: string;
    amount_cents: number;
    currency: string;
    commission_rate_bps: number;
    created_at: string;
  }>;
  total_payouts_cents: number;
}

export async function referralRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/referrals/code
   * 
   * Returns existing referral code or creates one if none exists.
   * 
   * BACKEND SECURITY:
   * - PROFESSIONAL-only (403 otherwise)
   * - Returns existing code if already created (no duplicate codes)
   * - userId from JWT (server-side verification)
   * 
   * Errors: 401 unauthorized, 403 forbidden (non-PROFESSIONAL)
   */
  fastify.get(
    '/api/v1/referrals/code',
    async (request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.info('[REFERRAL] GET /api/v1/referrals/code - Start');
      
      // SECURITY: Authentication required
      const userId = extractUserId(request);
      if (!userId) {
        fastify.log.warn('[REFERRAL] GET /api/v1/referrals/code - Auth failed, returning 401');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      fastify.log.info(`[REFERRAL] GET /api/v1/referrals/code - User authenticated: ${userId}`);

      // SECURITY: PROFESSIONAL-only enforcement
      const isPro = await isProfessionalUser(userId);
      if (!isPro) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only PROFESSIONAL users can access referral codes',
        });
      }

      try {
        // Check if user already has a referral code
        let referralCode = await prisma.referralCode.findUnique({
          where: { userId },
        });

        // Create new code if none exists
        if (!referralCode) {
          // Generate unique code (retry on collision, though unlikely)
          let code = generateReferralCode();
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            try {
              referralCode = await prisma.referralCode.create({
                data: {
                  userId,
                  code,
                },
              });
              break;
            } catch (error: any) {
              // Collision on unique code constraint - retry
              if (error.code === 'P2002' && attempts < maxAttempts - 1) {
                code = generateReferralCode();
                attempts++;
                continue;
              }
              throw error;
            }
          }

          if (!referralCode) {
            throw new Error('Failed to generate unique referral code after retries');
          }
        }

        const response: ReferralCodeResponse = {
          code: referralCode.code,
          created_at: referralCode.createdAt.toISOString(),
        };

        return reply.code(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Get/create referral code error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while accessing referral code',
        });
      }
    }
  );

  /**
   * GET /api/v1/referrals/status
   * 
   * Returns referrals attributed to this user's code + payout summary.
   * 
   * BACKEND SECURITY:
   * - PROFESSIONAL-only (403 otherwise)
   * - Returns referrals + payouts for authenticated user only
   * - Payouts are append-only ledger (read-only here)
   * - referred_user_id is anonymized (only returns the ID, not email/name)
   * 
   * Errors: 401 unauthorized, 403 forbidden (non-PROFESSIONAL), 404 no code exists
   */
  fastify.get(
    '/api/v1/referrals/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.info('[REFERRAL] GET /api/v1/referrals/status - Start');
      
      // SECURITY: Authentication required
      const userId = extractUserId(request);
      if (!userId) {
        fastify.log.warn('[REFERRAL] GET /api/v1/referrals/status - Auth failed, returning 401');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      fastify.log.info(`[REFERRAL] GET /api/v1/referrals/status - User authenticated: ${userId}`);

      // SECURITY: PROFESSIONAL-only enforcement
      const isPro = await isProfessionalUser(userId);
      if (!isPro) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only PROFESSIONAL users can access referral status',
        });
      }

      try {
        // Get referral code
        const referralCode = await prisma.referralCode.findUnique({
          where: { userId },
          include: {
            referrals: {
              orderBy: { createdAt: 'desc' },
              include: {
                payouts: {
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        });

        if (!referralCode) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'No referral code exists for this user',
          });
        }

        // Build response with referrals and payouts
        const referrals = referralCode.referrals.map(ref => ({
          referred_user_id: ref.referredUserId,
          status: ref.status,
          created_at: ref.createdAt.toISOString(),
          free_month_ends_at: ref.freeMonthEndsAt?.toISOString() || null,
        }));

        // Flatten all payouts across all referrals
        const allPayouts = referralCode.referrals.flatMap(ref =>
          ref.payouts.map(payout => ({
            referral_id: ref.id,
            amount_cents: payout.amountCents,
            currency: payout.currency,
            commission_rate_bps: payout.commissionRateBps,
            created_at: payout.createdAt.toISOString(),
          }))
        );

        // Calculate total payouts
        const totalPayoutsCents = allPayouts.reduce((sum, p) => sum + p.amount_cents, 0);

        const response: ReferralStatusResponse = {
          referral_code: {
            code: referralCode.code,
            created_at: referralCode.createdAt.toISOString(),
          },
          referrals,
          payouts: allPayouts,
          total_payouts_cents: totalPayoutsCents,
        };

        return reply.code(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Get referral status error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while fetching referral status',
        });
      }
    }
  );

  /**
   * POST /api/v1/referrals/validate
   * Body: { code: string } OR { referral_code: string }
   * 
   * Validates a referral code without leaking PII.
   * Public endpoint (no auth required) OR authenticated.
   * 
   * BACKEND SECURITY:
   * - Does NOT return referrer's email, name, or other PII
   * - Only returns: valid/invalid + minimal referrer hint (e.g., "user exists")
   * - Case-insensitive code lookup (citext in DB)
   * - Does NOT reveal if code is inactive/expired (schema has no expiry yet)
   * 
   * FRONTEND ALIGNMENT:
   * - Accepts both "code" (primary) and "referral_code" (alias) in request body
   * - OpenAPI documents "code" as primary field
   * 
   * Returns: { valid: true/false, referrer_hint?: string }
   * Errors: 422 validation
   */
  fastify.post<{ Body: ValidateReferralCodeBody }>(
    '/api/v1/referrals/validate',
    async (request: FastifyRequest<{ Body: ValidateReferralCodeBody }>, reply: FastifyReply) => {
      // FRONTEND ALIGNMENT: Accept both "code" and "referral_code" (alias)
      const code = request.body.code || request.body.referral_code;

      // Validation
      if (!code || typeof code !== 'string') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'code or referral_code is required and must be a string',
        });
      }

      if (code.length < 1 || code.length > 50) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'code must be between 1 and 50 characters',
        });
      }

      try {
        // Look up referral code (case-insensitive due to citext)
        const referralCode = await prisma.referralCode.findUnique({
          where: { code: code.toUpperCase() },
          include: {
            user: {
              select: { id: true, role: true },
            },
          },
        });

        if (!referralCode) {
          // Invalid code
          const response: ValidateReferralCodeResponse = {
            valid: false,
          };
          return reply.code(200).send(response);
        }

        // SECURITY: Valid code - return minimal hint without PII
        // Don't leak email, name, or other sensitive data
        const response: ValidateReferralCodeResponse = {
          valid: true,
          referrer_hint: 'PROFESSIONAL user',
        };

        return reply.code(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Validate referral code error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while validating referral code',
        });
      }
    }
  );
}
