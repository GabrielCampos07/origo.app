import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ReferralStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// BACKEND SECURITY: Stripe lazy-init (no fail-fast at module load in production)
// Allows /health to boot successfully without Stripe secrets
// Stripe required for paid flows; checkout/webhook return 503 if not configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Lazy-initialized Stripe client (null until first use)
let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    return null;
  }
  
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2026-08-26.dahlia',
    });
  }
  
  return stripe;
}

/**
 * Stripe Webhook Handler
 * 
 * BACKEND SECURITY NOTES:
 * - Uses Stripe signature verification (NOT JWT) for webhook authentication
 * - Webhook secret must be configured in Stripe dashboard
 * - Payouts are append-only ledger (INSERT only, never UPDATE)
 * - Commission rate: 15% (1500 bps) hardcoded here
 * - Zero commission during free month (freeMonthEndsAt check)
 * - Idempotent: stripeInvoiceId is unique constraint (prevents duplicate payouts)
 * - Only processes invoice.paid events
 */

interface StripeWebhookRequest {
  Body: string;
}

/**
 * Calculate commission payout amount
 * 
 * @param amountCents - Invoice amount in cents
 * @param commissionRateBps - Commission rate in basis points (1500 = 15%)
 * @returns Commission amount in cents
 */
function calculateCommission(amountCents: number, commissionRateBps: number): number {
  return Math.floor((amountCents * commissionRateBps) / 10000);
}

export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/webhooks/stripe
   * 
   * Handles Stripe webhook events (invoice.paid).
   * 
   * BACKEND SECURITY:
   * - Webhook signature verification via STRIPE_WEBHOOK_SECRET (NOT JWT)
   * - Raw body preserved via custom content type parser in index.ts
   * - Append-only payout ledger (no updates allowed)
   * - Idempotent: unique constraint on stripeInvoiceId prevents duplicates
   * - Zero commission during free month (checks freeMonthEndsAt)
   * 
   * Business Rules:
   * - Only invoice.paid events processed
   * - 15% commission (1500 bps) on paid amount after free month
   * - Free month = no commission ledger entry
   * - Referral must exist and be linked to invoice customer
   * 
   * Errors: 400 bad signature, 200 for unhandled events (webhook ack)
   */
  fastify.post(
    '/api/v1/webhooks/stripe',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const stripe = getStripe();
      
      if (!stripe) {
        fastify.log.error('Stripe not initialized (missing STRIPE_SECRET_KEY)');
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Stripe integration not configured',
        });
      }

      // SECURITY: Verify Stripe webhook signature
      const signature = request.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Missing stripe-signature header',
        });
      }

      let event: Stripe.Event;

      try {
        // SECURITY: Get raw body bytes for signature verification
        // The custom content type parser in index.ts preserves the exact request bytes
        // We MUST use the original bytes - re-serializing JSON breaks signature verification
        const rawBody = (request as any).rawBody;
        if (!rawBody || !Buffer.isBuffer(rawBody)) {
          throw new Error('Raw body not available - content type parser may not be configured correctly');
        }

        // BACKEND SECURITY: ZERO webhook signature skip in production
        // Even if STRIPE_WEBHOOK_SECRET missing in prod, do NOT constructEvent with unverified body
        // Reject 503/500 rather than skip signature verification
        if (!STRIPE_WEBHOOK_SECRET) {
          if (process.env.NODE_ENV === 'production') {
            fastify.log.error('FATAL: STRIPE_WEBHOOK_SECRET missing in production - rejecting webhook');
            return reply.code(503).send({
              error: 'Service Unavailable',
              message: 'Webhook signature verification not configured',
            });
          } else {
            // DEV ONLY: Skip signature verification with warning
            fastify.log.warn('Stripe webhook signature verification DISABLED (dev mode only)');
            event = JSON.parse(rawBody.toString());
          }
        } else {
          // PRODUCTION: Always verify signature
          event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            STRIPE_WEBHOOK_SECRET
          );
        }
      } catch (error: any) {
        fastify.log.error(error, 'Stripe webhook signature verification failed');
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid webhook signature',
        });
      }

      // Handle invoice.paid event
      if (event.type === 'invoice.paid') {
        try {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Skip if no customer or amount
          if (!invoice.customer || !invoice.amount_paid) {
            fastify.log.info({ invoice: invoice.id }, 'Skipping invoice with no customer or amount');
            return reply.code(200).send({ received: true, skipped: 'no_customer_or_amount' });
          }

          // Get customer metadata to find referred user
          // ASSUMPTION: Stripe Customer has metadata.origo_user_id or similar
          // This links the Stripe customer to our User model
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if (!customer || customer.deleted) {
            fastify.log.warn({ customer_id: invoice.customer }, 'Customer not found or deleted');
            return reply.code(200).send({ received: true, skipped: 'customer_not_found' });
          }

          // Extract origo_user_id from customer metadata
          const origoUserId = (customer as Stripe.Customer).metadata?.origo_user_id;
          
          if (!origoUserId) {
            fastify.log.info({ customer_id: customer.id }, 'Customer has no origo_user_id metadata');
            return reply.code(200).send({ received: true, skipped: 'no_origo_user_id' });
          }

          // Look up referral for this user (as referred)
          const referral = await prisma.referral.findUnique({
            where: { referredUserId: origoUserId },
            include: { referrer: true },
          });

          if (!referral) {
            // User wasn't referred - no commission to record
            fastify.log.info({ user_id: origoUserId }, 'User was not referred');
            return reply.code(200).send({ received: true, skipped: 'not_referred' });
          }

          // BUSINESS RULE: Zero commission during free month
          const now = new Date();
          if (referral.freeMonthEndsAt && now < referral.freeMonthEndsAt) {
            fastify.log.info(
              { referral_id: referral.id, free_month_ends_at: referral.freeMonthEndsAt },
              'Skipping commission during free month'
            );
            return reply.code(200).send({ received: true, skipped: 'free_month_active' });
          }

          // Calculate commission (15% = 1500 bps)
          const commissionRateBps = 1500;
          const amountCents = invoice.amount_paid;
          const commissionCents = calculateCommission(amountCents, commissionRateBps);

          // SECURITY: Append-only payout ledger
          // stripeInvoiceId is unique - prevents duplicate payouts (idempotent)
          try {
            const payout = await prisma.referralPayout.create({
              data: {
                referralId: referral.id,
                stripeInvoiceId: invoice.id,
                amountCents: commissionCents,
                currency: invoice.currency || 'brl',
                commissionRateBps,
              },
            });

            fastify.log.info(
              {
                payout_id: payout.id,
                referral_id: referral.id,
                invoice_id: invoice.id,
                commission_cents: commissionCents,
              },
              'Referral payout recorded'
            );

            return reply.code(200).send({ received: true, payout_id: payout.id });
          } catch (error: any) {
            // Handle duplicate invoice (idempotent - already processed)
            if (error.code === 'P2002' && error.meta?.target?.includes('stripeInvoiceId')) {
              fastify.log.info(
                { invoice_id: invoice.id },
                'Payout already recorded (idempotent skip)'
              );
              return reply.code(200).send({ received: true, skipped: 'already_recorded' });
            }
            throw error;
          }
        } catch (error) {
          fastify.log.error(error, 'Error processing invoice.paid webhook');
          // Return 500 so Stripe retries
          return reply.code(500).send({
            error: 'Internal Server Error',
            message: 'Failed to process webhook',
          });
        }
      }

      // Acknowledge other event types
      fastify.log.info({ event_type: event.type }, 'Unhandled webhook event type');
      return reply.code(200).send({ received: true, unhandled: event.type });
    }
  );
}
