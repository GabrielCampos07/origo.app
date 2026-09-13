import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, ReferralStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// MUST-FIX: Fail fast if Stripe credentials are missing in production
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: STRIPE_SECRET_KEY environment variable is required in production.'
    );
  } else {
    console.warn(
      'WARNING: STRIPE_SECRET_KEY not set. Stripe webhook will not work.'
    );
  }
}

if (!STRIPE_WEBHOOK_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: STRIPE_WEBHOOK_SECRET environment variable is required in production.'
    );
  } else {
    console.warn(
      'WARNING: STRIPE_WEBHOOK_SECRET not set. Stripe webhook signature verification disabled in dev.'
    );
  }
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
}) : null;

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
   * - Raw body required for signature verification (registered with rawBody: true)
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
        // Get raw body for signature verification
        // Fastify doesn't natively support rawBody - we need to read from request.body
        const body = request.body;
        let rawBody: Buffer;
        
        if (Buffer.isBuffer(body)) {
          rawBody = body;
        } else if (typeof body === 'string') {
          rawBody = Buffer.from(body);
        } else {
          rawBody = Buffer.from(JSON.stringify(body));
        }

        // SECURITY: Verify webhook signature (prevents spoofing)
        if (STRIPE_WEBHOOK_SECRET) {
          event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            STRIPE_WEBHOOK_SECRET
          );
        } else {
          // DEV ONLY: Skip signature verification if secret not set
          fastify.log.warn('Stripe webhook signature verification DISABLED (dev mode)');
          event = JSON.parse(rawBody.toString());
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
