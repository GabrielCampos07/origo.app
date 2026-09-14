# Payment Gate Implementation (P0 Lock - Gabriel)

## Product Requirements

**Flow:** `register → legal → checkout/payment → account active`

**Fail-closed:** Professional users without confirmed payment cannot access paid/protected routes.

**Enforcement:** Backend authorization gate (not UI-only).

---

## Implementation Overview

### 1. Database Schema (Soft Fields)

Added minimal fields to `User` model to track subscription status:

```sql
-- Migration: 20260914153523_add_payment_gate_fields
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "subscriptionActive" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
```

**Fields:**
- `stripeCustomerId` (nullable): Links user to Stripe customer ID
- `subscriptionActive` (boolean, default false): Payment gate flag

**Design rationale:**
- NO new tables (uses existing User table)
- NO new Stripe/Subscription model (uses Stripe API as source of truth)
- Minimal schema footprint (2 soft fields)
- Derived from Stripe webhook events (fail-closed by default)

---

### 2. Checkout Flow

**File:** `apps/api/src/lib/checkout.ts`

When creating a checkout session:
1. Create or retrieve Stripe customer
2. Store `stripeCustomerId` in User table
3. Create checkout session with customer ID

**Code:**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { stripeCustomerId: customer.id },
});
```

---

### 3. Stripe Webhook Handler

**File:** `apps/api/src/routes/stripe-webhook.ts`

Handles three subscription events:

#### a) `checkout.session.completed`
- Triggered when payment succeeds
- Sets `subscriptionActive = true`
- User account becomes active

#### b) `customer.subscription.deleted`
- Triggered when subscription is cancelled
- Sets `subscriptionActive = false`
- User loses access to paid routes

#### c) `customer.subscription.updated`
- Triggered on subscription status changes
- Sets `subscriptionActive` based on Stripe status:
  - **Active:** `active`, `trialing`
  - **Inactive:** `incomplete`, `incomplete_expired`, `past_due`, `canceled`, `unpaid`, `paused`

---

### 4. Backend Authorization Middleware

**File:** `apps/api/src/index.ts`

**Payment gate runs BEFORE legal acceptance middleware** (fail fast).

**Logic:**
1. Extract JWT and fetch user from database
2. Check if user is `PROFESSIONAL` with `subscriptionActive = false`
3. Block with `403 payment_required` if unpaid
4. Allow access if:
   - User is `STUDENT` (not subject to payment gate)
   - User is `PROFESSIONAL` with `subscriptionActive = true`
   - Route is exempt (see below)

**Exempt routes (no payment gate):**
- `/health`
- `/api/v1` (API info)
- `/api/v1/auth/*` (login, register, password reset)
- `/api/v1/legal/*` (legal acceptance)
- `/api/v1/checkout/session` (create checkout)
- `/api/v1/webhooks/stripe` (Stripe webhooks)
- `/api/v1/referrals/validate` (public referral validation)
- `/api/v1/invites/validate` (public invite validation)

**Protected routes (payment gate enforced):**
- `/api/v1/invites` (POST - create invite, PROFESSIONAL only)
- All future paid features (dashboard, analytics, etc.)

---

## API Contract

### Error Response Format

When a PROFESSIONAL user without active subscription attempts to access a protected route:

**HTTP Status:** `403 Forbidden`

**Response Body:**
```json
{
  "error": "payment_required",
  "message": "Pagamento pendente. Complete o checkout para ativar sua conta."
}
```

**Error code:** `payment_required` (stable, frontend can match on this)

---

## Testing with curl

### Scenario 1: Unpaid professional user (403 payment_required)

```bash
# 1. Register professional user
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. João Silva",
    "email": "joao@example.com",
    "password": "SecurePassword123!",
    "category": "FISIOTERAPIA"
  }'

# Response: { access_token: "...", ... }
# Note: subscriptionActive = false (default)

# 2. Accept legal docs (required before accessing routes)
curl -X POST http://localhost:3001/api/v1/legal/accept \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_versions": [
      "privacy_v2_2026-09-13",
      "terms_app_v2_2026-09-13",
      "terms_saas_v2_2026-09-13",
      "payments_notice_v2_2026-09-13"
    ]
  }'

# Response: 200 OK

# 3. Try to create invite (protected route)
curl -X POST http://localhost:3001/api/v1/invites \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_email": "student@example.com"
  }'

# Response: 403 Forbidden
# {
#   "error": "payment_required",
#   "message": "Pagamento pendente. Complete o checkout para ativar sua conta."
# }
```

---

### Scenario 2: After checkout and webhook (200 OK)

```bash
# 1. Create checkout session (still allowed for unpaid user)
curl -X POST http://localhost:3001/api/v1/checkout/session \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "start",
    "billing_cycle": "monthly"
  }'

# Response: { checkout_url: "https://checkout.stripe.com/...", ... }

# 2. User completes payment on Stripe
# Stripe sends checkout.session.completed webhook
# Webhook sets subscriptionActive = true

# 3. Now try to create invite (protected route)
curl -X POST http://localhost:3001/api/v1/invites \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_email": "student@example.com"
  }'

# Response: 200 OK
# {
#   "invite_url": "abc123...",
#   "expires_at": "2026-10-14T15:35:23.000Z"
# }
```

---

### Scenario 3: Student user (bypass payment gate)

```bash
# 1. Register student via invite (requires valid invite token)
curl -X POST http://localhost:3001/api/v1/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "invite_token": "valid_invite_token_here",
    "name": "Maria Santos",
    "email": "maria@example.com",
    "password": "SecurePassword123!"
  }'

# Response: { access_token: "...", ... }
# Note: role = STUDENT, subscriptionActive = false (ignored for students)

# 2. Student can access routes without payment
# (Students are not subject to payment gate)
```

---

## Backend Security Notes

### Fail-Closed Design
- **Default:** `subscriptionActive = false` (user blocked until payment confirmed)
- **Activation:** Only via Stripe webhook `checkout.session.completed`
- **No bypass:** Backend enforcement, not UI-only gate
- **No client control:** User cannot set `subscriptionActive` via API

### Authorization Enforcement
- **Middleware level:** Runs on every request before route handler
- **Server-side:** Uses database `subscriptionActive` flag (not client-supplied)
- **Role-based:** Only `PROFESSIONAL` users subject to gate
- **Stable error:** Always returns `403 payment_required` (frontend contract)

### Idempotency
- **Webhook handler:** Stripe webhook events are idempotent
- **Database updates:** `subscriptionActive` can be set multiple times (safe)
- **No race conditions:** Single atomic update per webhook event

### OpenAPI Integration
- **Error schema:** `403 payment_required` documented for all paid routes
- **Security scheme:** JWT bearer token + payment gate enforcement
- **Exemptions:** Clearly documented in middleware and OpenAPI spec

### Subscription Status Sources
1. **Primary:** Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated`, etc.)
2. **Backup:** Manual admin query (if needed in future)
3. **NO client input:** User cannot activate their own subscription

### Edge Cases
1. **Webhook delay:** User blocked until webhook arrives (fail-closed)
2. **Webhook failure:** User remains blocked (manual intervention required)
3. **Subscription lapse:** `customer.subscription.deleted` webhook revokes access immediately
4. **Trial period:** `trialing` status counts as active (allows access)

---

## Frontend Integration

### Expected Behavior

1. **Registration flow:**
   - User registers → gets tokens immediately
   - User accepts legal docs
   - **Redirect to checkout** (required before accessing paid features)

2. **Checkout redirect:**
   - Frontend detects `subscriptionActive = false` on user profile
   - Redirects to `/checkout` page
   - User completes payment on Stripe
   - Stripe redirects back to success page
   - Webhook activates account (async, ~1-2 seconds)

3. **Error handling:**
   - Frontend catches `403 payment_required` error
   - Shows microcopy: "Pagamento pendente. Complete o checkout para ativar sua conta."
   - Provides button/link to checkout page

4. **Polling after checkout:**
   - After successful payment, frontend can poll user profile
   - Check if `subscriptionActive = true`
   - Redirect to dashboard when active

### Example Frontend Code

```typescript
// Check subscription status
async function checkSubscriptionStatus(token: string): Promise<boolean> {
  const response = await fetch('/api/v1/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (response.status === 403) {
    const error = await response.json();
    if (error.error === 'payment_required') {
      // Redirect to checkout
      window.location.href = '/checkout';
      return false;
    }
  }
  
  const user = await response.json();
  return user.subscriptionActive;
}

// Handle payment_required error
async function createInvite(token: string, data: any) {
  try {
    const response = await fetch('/api/v1/invites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'payment_required') {
        // Show gate UI
        showPaymentRequiredModal();
        return;
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create invite:', error);
  }
}
```

---

## Migration Notes

### Rollout Strategy

1. **Deploy migration:** Add `stripeCustomerId` and `subscriptionActive` fields
2. **Backfill existing users:**
   - Query Stripe API for existing customers
   - Match by email to Origo users
   - Set `stripeCustomerId` and `subscriptionActive` for paid users
3. **Deploy code:** Payment gate middleware + webhook handlers
4. **Test:** Verify gate blocks unpaid users, allows paid users
5. **Monitor:** Check Stripe webhook logs for event processing

### Backfill Script

**File:** `apps/api/scripts/backfill-subscription-active.ts`

A production-ready script to reconcile `subscriptionActive` from Stripe as the source of truth.

**Context:** After payment-gate migration (#53), existing paid professionals may have `subscriptionActive=false`. This script reconciles the field using Stripe subscriptions as the source of truth.

**Usage:**

```bash
# Local (with DATABASE_URL + STRIPE_SECRET_KEY)
export DATABASE_URL="postgresql://..."
export STRIPE_SECRET_KEY="sk_..."
npx tsx scripts/backfill-subscription-active.ts

# Dry run (default - logs only, no writes)
DRY_RUN=1 npx tsx scripts/backfill-subscription-active.ts

# Apply changes
APPLY=1 npx tsx scripts/backfill-subscription-active.ts

# Fly SSH
fly ssh console -a origo-api-staging
cd /app
APPLY=1 node dist/scripts/backfill-subscription-active.js
```

**Logic:**
1. Find users with `stripeCustomerId` set
2. Check Stripe subscription status (active/trialing)
3. Set `subscriptionActive=true` when subscription is active
4. Also search Stripe customers with `metadata.origo_user_id` (fallback for users without `stripeCustomerId`)

**Safety:**
- DRY_RUN=1 by default (log only, no writes)
- Never logs full emails or tokens
- Logs only user ID + customer ID prefix (first 12 chars)
- Idempotent: safe to run multiple times

---

## Monitoring & Observability

### Logs to Monitor

1. **Webhook events:**
   - `checkout.session.completed` → user activated
   - `customer.subscription.deleted` → user deactivated
   - `customer.subscription.updated` → status change

2. **Payment gate blocks:**
   - `403 payment_required` responses
   - User ID + route path

3. **Checkout sessions:**
   - `stripeCustomerId` stored
   - Session created

### Metrics to Track

1. **Conversion rate:** Register → Checkout → Payment
2. **Gate blocks:** How many requests blocked by payment gate
3. **Webhook latency:** Time from Stripe event to DB update
4. **Failed webhooks:** Stripe webhook errors (500 responses)

### Alerts

1. **Webhook failures:** More than X failed webhooks per hour
2. **High gate block rate:** More than Y% of requests blocked
3. **Missing customer IDs:** Users with checkout sessions but no `stripeCustomerId`

---

## Summary

**What changed:**
- Added 2 soft fields to User model (`stripeCustomerId`, `subscriptionActive`)
- Checkout flow stores customer ID
- Stripe webhooks activate/deactivate subscriptions
- Middleware blocks unpaid PROFESSIONAL users (403 payment_required)

**What's protected:**
- All paid routes (e.g., `/api/v1/invites`)
- Future dashboard/analytics endpoints

**What's exempt:**
- Auth routes (login, register, password reset)
- Legal acceptance
- Checkout creation (need to create session to pay!)
- Webhooks
- Public endpoints (health, referral/invite validation)

**Contract:**
- Unpaid user → `403 payment_required`
- Paid user → `200 OK` (access granted)
- Student user → bypass gate (not subject to payment)

**Testing:**
- Curl examples demonstrate gate in action
- Webhook events activate/deactivate users
- Fail-closed by default (safe)
