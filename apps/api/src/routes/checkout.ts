import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';
import { createCheckoutSession, type CreateCheckoutSessionOptions } from '../lib/checkout';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checkout Session API (P0)
 * 
 * BACKEND SECURITY NOTES:
 * - PROFESSIONAL-only enforcement (403 for STUDENT)
 * - userId ONLY from JWT; never accept userId/customer from client (IDOR protection)
 * - Stripe Price IDs resolved server-side from env (never sent to client)
 * - referral_code validated server-side via existing checkout helper
 * - Stripe Customer metadata origo_user_id set for invoice.paid webhook
 * - Legal 403 middleware already enforced by index.ts (PROFESSIONAL docs required)
 * - No Stripe secret keys exposed to client
 * - success/cancel URLs use FRONTEND_URL env (tamper-proof)
 */

/**
 * Extract userId from Authorization header
 * 
 * SECURITY NOTE:
 * - MUST bind operations to authenticated userId from JWT
 * - NEVER allow operations on behalf of another user
 * - Token tampering prevention via JWT signature verification
 */
function extractUserId(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    return payload.userId;
  } catch (error) {
    return null;
  }
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

/**
 * Resolve Stripe Price ID from plan and billing cycle
 * 
 * BACKEND SECURITY:
 * - Price IDs are server-side only (env vars)
 * - Client cannot manipulate pricing
 * - Validation of plan + billing_cycle before resolution
 */
function resolveStripePriceId(plan: string, billingCycle: 'monthly' | 'annual'): string | null {
  // SECURITY: Whitelist valid plan names
  const validPlans = ['start', 'pro', 'clinic'];
  if (!validPlans.includes(plan)) {
    return null;
  }

  // Map plan + billing_cycle to env var
  // Format: STRIPE_PRICE_<PLAN>_<CYCLE>
  // Example: STRIPE_PRICE_START_MONTHLY, STRIPE_PRICE_PRO_ANNUAL
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${billingCycle.toUpperCase()}`;
  const priceId = process.env[envKey];

  if (!priceId) {
    console.error(`Missing Stripe price ID for ${plan}/${billingCycle}: ${envKey} not found in env`);
    return null;
  }

  return priceId;
}

interface CreateCheckoutSessionBody {
  plan: string;
  billing_cycle: 'monthly' | 'annual';
  referral_code?: string;
}

interface CreateCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export async function checkoutRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/checkout/session
   * 
   * Creates a Stripe Checkout Session for subscription with optional referral code.
   * 
   * BACKEND SECURITY:
   * - PROFESSIONAL-only (403 for STUDENT)
   * - userId extracted from JWT (server-side verification)
   * - Price IDs resolved server-side from env (client cannot manipulate)
   * - referral_code validated server-side via checkout helper
   * - Stripe Customer metadata origo_user_id set for webhook
   * - success/cancel URLs constructed server-side from FRONTEND_URL env
   * 
   * BUSINESS RULES:
   * - 14 day trial included in subscription
   * - referral_code applies 100% off first month (via Stripe coupon)
   * - Referral attribution recorded in DB before checkout
   * 
   * Errors: 401 unauthorized, 403 forbidden (non-PROFESSIONAL), 422 validation, 500 server error
   */
  fastify.post<{ Body: CreateCheckoutSessionBody }>(
    '/api/v1/checkout/session',
    async (request: FastifyRequest<{ Body: CreateCheckoutSessionBody }>, reply: FastifyReply) => {
      // SECURITY: Authentication required
      const userId = extractUserId(request);
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Token de autenticação válido é obrigatório',
        });
      }

      // SECURITY: PROFESSIONAL-only enforcement
      const isPro = await isProfessionalUser(userId);
      if (!isPro) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Apenas usuários PROFESSIONAL podem criar sessões de checkout',
        });
      }

      const { plan, billing_cycle, referral_code } = request.body;

      // Validation: plan required
      if (!plan || typeof plan !== 'string') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'plan é obrigatório e deve ser uma string',
        });
      }

      // Validation: billing_cycle required and whitelist
      if (!billing_cycle || !['monthly', 'annual'].includes(billing_cycle)) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'billing_cycle é obrigatório e deve ser "monthly" ou "annual"',
        });
      }

      // Validation: referral_code optional string
      if (referral_code !== undefined && typeof referral_code !== 'string') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'referral_code deve ser uma string',
        });
      }

      // SECURITY: Resolve Stripe Price ID server-side
      const priceId = resolveStripePriceId(plan, billing_cycle);
      if (!priceId) {
        fastify.log.error({ plan, billing_cycle }, 'Invalid plan or missing Stripe price ID');
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Plano inválido ou não configurado',
        });
      }

      try {
        // Get user email for Stripe checkout
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (!user) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Usuário não encontrado',
          });
        }

        // SECURITY: Construct success/cancel URLs server-side
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3456';
        const successUrl = `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${frontendUrl}/checkout`;

        // Create checkout session via helper
        // SECURITY: checkout helper validates referral code and prevents self-referral
        const sessionOptions: CreateCheckoutSessionOptions = {
          userId,
          email: user.email,
          priceId,
          referralCode: referral_code,
          successUrl,
          cancelUrl,
        };

        const result = await createCheckoutSession(sessionOptions);

        const response: CreateCheckoutSessionResponse = {
          checkout_url: result.sessionUrl,
          session_id: result.sessionId,
        };

        return reply.code(200).send(response);
      } catch (error: any) {
        // Handle specific errors from checkout helper
        if (error.message === 'Invalid referral code') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Código de indicação inválido',
          });
        }

        if (error.message === 'Cannot use your own referral code') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Você não pode usar seu próprio código de indicação',
          });
        }

        if (error.message === 'User has already been referred') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Você já foi indicado por outro usuário',
          });
        }

        if (error.message?.includes('Stripe not initialized')) {
          fastify.log.error(error, 'Stripe not configured');
          return reply.code(503).send({
            error: 'Service Unavailable',
            message: 'Serviço de pagamento não disponível',
          });
        }

        fastify.log.error(error, 'Create checkout session error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Ocorreu um erro ao criar a sessão de checkout',
        });
      }
    }
  );
}
