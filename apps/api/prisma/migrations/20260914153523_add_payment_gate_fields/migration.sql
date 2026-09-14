-- PAYMENT GATE (P0 LOCK - Gabriel)
-- Add fields to track subscription status for PROFESSIONAL users
-- stripeCustomerId: Links user to Stripe customer (nullable, set on first checkout)
-- subscriptionActive: Enforces payment gate for PROFESSIONAL users (default false)

-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "subscriptionActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
