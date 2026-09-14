/**
 * BACKFILL SCRIPT: Reconcile subscriptionActive from Stripe
 * 
 * CONTEXT:
 * After payment-gate migration (#53), existing paid professionals may have
 * subscriptionActive=false in the database. This script reconciles the field
 * using Stripe subscriptions as the source of truth.
 * 
 * OWNER GO: Reconcile via Stripe (not manual email list).
 * Note: prof@origo.dev was handled separately via SQL; script still checks.
 * 
 * USAGE:
 * 
 * Local (with DATABASE_URL + STRIPE_SECRET_KEY):
 *   export DATABASE_URL="postgresql://..."
 *   export STRIPE_SECRET_KEY="sk_..."
 *   npx tsx scripts/backfill-subscription-active.ts
 * 
 * Fly SSH:
 *   fly ssh console -a origo-api-staging
 *   cd /app
 *   APPLY=1 node dist/scripts/backfill-subscription-active.js
 * 
 * MODES:
 * - DRY_RUN=1 (default): Log actions without writing to database
 * - APPLY=1: Write to database
 * 
 * SAFETY:
 * - Never logs full emails or tokens
 * - Logs only: user ID + customer ID prefix (first 12 chars)
 * - Idempotent: safe to run multiple times
 * 
 * LOGIC:
 * 1. Find users with stripeCustomerId set
 * 2. For each, check Stripe subscription status (active/trialing)
 * 3. If active/trialing → set subscriptionActive=true
 * 4. Also search Stripe customers with metadata.origo_user_id (fallback)
 * 
 * EXIT CODES:
 * 0: Success
 * 1: Missing env vars or Stripe error
 */

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

const DRY_RUN = process.env.APPLY !== '1';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ FATAL: STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});

interface ReconcileStats {
  usersChecked: number;
  usersWithActiveSubscription: number;
  usersUpdated: number;
  errors: number;
}

/**
 * Mask sensitive IDs for logging
 */
function maskId(id: string, prefixLength = 12): string {
  if (id.length <= prefixLength) {
    return id;
  }
  return `${id.slice(0, prefixLength)}...`;
}

/**
 * Check if user has active subscription in Stripe
 */
async function hasActiveSubscription(stripeCustomerId: string): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 100,
      status: 'all',
    });

    const activeStatuses = ['active', 'trialing'];
    const activeSubscriptions = subscriptions.data.filter(sub =>
      activeStatuses.includes(sub.status)
    );

    return activeSubscriptions.length > 0;
  } catch (error: any) {
    console.error(`❌ Error checking subscriptions for customer ${maskId(stripeCustomerId)}: ${error.message}`);
    throw error;
  }
}

/**
 * Reconcile users with stripeCustomerId set
 */
async function reconcileUsersWithCustomerId(stats: ReconcileStats): Promise<void> {
  console.log('\n📋 Phase 1: Reconcile users with stripeCustomerId set');
  console.log('═'.repeat(60));

  const users = await prisma.user.findMany({
    where: {
      stripeCustomerId: { not: null },
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      subscriptionActive: true,
      role: true,
    },
  });

  console.log(`Found ${users.length} users with stripeCustomerId set\n`);

  for (const user of users) {
    stats.usersChecked++;

    try {
      const hasActive = await hasActiveSubscription(user.stripeCustomerId!);

      if (hasActive) {
        stats.usersWithActiveSubscription++;

        const emailMasked = user.email.replace(/(?<=.{3}).(?=.*@)/g, '*');
        console.log(
          `✓ User ${user.id} (${emailMasked}) | Customer ${maskId(user.stripeCustomerId!)} | Role: ${user.role}`
        );
        console.log(`  └─ Has active/trialing subscription`);

        if (user.subscriptionActive) {
          console.log(`  └─ ✓ subscriptionActive already true (no change)\n`);
        } else {
          if (DRY_RUN) {
            console.log(`  └─ [DRY RUN] Would set subscriptionActive=true\n`);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionActive: true },
            });
            stats.usersUpdated++;
            console.log(`  └─ ✅ Set subscriptionActive=true\n`);
          }
        }
      } else {
        const emailMasked = user.email.replace(/(?<=.{3}).(?=.*@)/g, '*');
        console.log(
          `✗ User ${user.id} (${emailMasked}) | Customer ${maskId(user.stripeCustomerId!)} | Role: ${user.role}`
        );
        console.log(`  └─ No active/trialing subscription`);
        
        if (user.subscriptionActive) {
          console.log(`  └─ ⚠️  subscriptionActive is true but no active subscription (not changing)\n`);
        } else {
          console.log(`  └─ ✓ subscriptionActive already false (no change)\n`);
        }
      }
    } catch (error: any) {
      stats.errors++;
      console.error(`❌ Error processing user ${user.id}: ${error.message}\n`);
    }
  }
}

/**
 * Reconcile users via Stripe customer metadata (fallback for users without stripeCustomerId)
 */
async function reconcileViaStripeMetadata(stats: ReconcileStats): Promise<void> {
  console.log('\n📋 Phase 2: Search Stripe customers with metadata.origo_user_id');
  console.log('═'.repeat(60));

  let hasMore = true;
  let startingAfter: string | undefined;
  let customersScanned = 0;

  while (hasMore) {
    try {
      const customers = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const customer of customers.data) {
        customersScanned++;

        const origoUserId = customer.metadata?.origo_user_id;
        if (!origoUserId) {
          continue;
        }

        const user = await prisma.user.findUnique({
          where: { id: origoUserId },
          select: {
            id: true,
            email: true,
            stripeCustomerId: true,
            subscriptionActive: true,
            role: true,
          },
        });

        if (!user) {
          console.log(`⚠️  Customer ${maskId(customer.id)} has metadata.origo_user_id=${origoUserId} but user not found in DB`);
          continue;
        }

        if (user.stripeCustomerId) {
          continue;
        }

        stats.usersChecked++;

        const hasActive = await hasActiveSubscription(customer.id);

        if (hasActive) {
          stats.usersWithActiveSubscription++;

          const emailMasked = user.email.replace(/(?<=.{3}).(?=.*@)/g, '*');
          console.log(
            `✓ User ${user.id} (${emailMasked}) | Customer ${maskId(customer.id)} (via metadata) | Role: ${user.role}`
          );
          console.log(`  └─ Has active/trialing subscription`);

          if (DRY_RUN) {
            console.log(`  └─ [DRY RUN] Would set stripeCustomerId=${maskId(customer.id)} and subscriptionActive=true\n`);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stripeCustomerId: customer.id,
                subscriptionActive: true,
              },
            });
            stats.usersUpdated++;
            console.log(`  └─ ✅ Set stripeCustomerId and subscriptionActive=true\n`);
          }
        }
      }

      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    } catch (error: any) {
      stats.errors++;
      console.error(`❌ Error fetching Stripe customers: ${error.message}`);
      break;
    }
  }

  console.log(`\nScanned ${customersScanned} Stripe customers`);
}

/**
 * Main reconciliation logic
 */
async function main() {
  console.log('🔄 BACKFILL: Reconcile subscriptionActive from Stripe');
  console.log('═'.repeat(60));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '✍️  APPLY (will write to DB)'}`);
  console.log('═'.repeat(60));

  const stats: ReconcileStats = {
    usersChecked: 0,
    usersWithActiveSubscription: 0,
    usersUpdated: 0,
    errors: 0,
  };

  await reconcileUsersWithCustomerId(stats);

  await reconcileViaStripeMetadata(stats);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Users checked:                ${stats.usersChecked}`);
  console.log(`Users with active subscription: ${stats.usersWithActiveSubscription}`);
  console.log(`Users updated:                ${DRY_RUN ? 0 : stats.usersUpdated} ${DRY_RUN ? '(DRY RUN - no writes)' : ''}`);
  console.log(`Errors:                       ${stats.errors}`);
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('\n💡 To apply changes, run with: APPLY=1 npx tsx scripts/backfill-subscription-active.ts');
  } else {
    console.log('\n✅ Backfill complete!');
  }
}

main()
  .catch((error) => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
