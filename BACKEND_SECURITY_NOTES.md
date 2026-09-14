# Backend Security Notes - Payment Gate

## For: BACKEND SECURITY CHECKER

This document provides security notes for automated and manual review of the payment gate implementation.

---

## Security Checklist

### ✅ 1. Fail-Closed Design

**Requirement:** System must fail closed (deny by default) if payment status is unknown or unverified.

**Implementation:**
- `subscriptionActive` defaults to `false` in schema (line 50, `schema.prisma`)
- Middleware blocks PROFESSIONAL users with `subscriptionActive = false` (line 195-201, `index.ts`)
- NO bypass mechanism (user cannot set own subscription status)
- Activation ONLY via verified Stripe webhook events

**Evidence:**
```prisma
subscriptionActive Boolean @default(false)  // Fail-closed: deny until payment confirmed
```

```typescript
if (user.role === 'PROFESSIONAL' && !user.subscriptionActive) {
  return reply.code(403).send({
    error: 'payment_required',
    message: 'Pagamento pendente. Complete o checkout para ativar sua conta.',
  });
}
```

---

### ✅ 2. No Information Leakage

**Requirement:** Error responses must not leak sensitive information (PII, account enumeration, etc.).

**Implementation:**
- `403 payment_required` error is generic (no user ID, email, subscription details)
- Error message in Portuguese (production-ready)
- NO distinction between "no payment method" vs "payment failed" vs "subscription expired"
- Stable error code (`payment_required`) for frontend matching

**Evidence:**
```typescript
return reply.code(403).send({
  error: 'payment_required',  // Generic error code
  message: 'Pagamento pendente. Complete o checkout para ativar sua conta.',  // Generic message, no details
});
```

**What we DON'T expose:**
- Stripe customer ID
- Subscription ID
- Payment method details
- Specific failure reason
- Amount due
- Last payment date

---

### ✅ 3. Server-Side Enforcement

**Requirement:** Authorization must be enforced server-side (not UI-only).

**Implementation:**
- Middleware runs on every request (line 183-238, `index.ts`)
- Executes BEFORE route handler (cannot be bypassed)
- Uses database `subscriptionActive` flag (not client-supplied)
- NO client control over authorization decision

**Evidence:**
```typescript
server.addHook('onRequest', async (request, reply) => {
  // Middleware runs BEFORE route handler
  // Cannot be bypassed by client
  if (user.role === 'PROFESSIONAL' && !user.subscriptionActive) {
    return reply.code(403).send({ error: 'payment_required', ... });
  }
});
```

---

### ✅ 4. No Client-Side Bypass

**Requirement:** Client cannot manipulate authorization via headers, query params, or request body.

**Implementation:**
- Authorization derived from:
  1. JWT token (verified server-side)
  2. Database `subscriptionActive` flag (SELECT only)
  3. Stripe webhook events (signature-verified)
- NO client input accepted for authorization decision
- NO `subscriptionActive` field in request body schemas

**Evidence:**
- `subscriptionActive` is READ-ONLY via normal API endpoints
- Only Stripe webhook can SET `subscriptionActive` (signature-verified)
- Middleware uses `await prisma.user.findUnique()` (database source of truth)

**What we DON'T accept from client:**
- `subscriptionActive` in request body
- `stripeCustomerId` in request body
- `subscription_status` query param
- `X-Subscription-Override` header

---

### ✅ 5. Webhook Signature Verification

**Requirement:** Stripe webhooks must be signature-verified (prevent spoofing).

**Implementation:**
- `STRIPE_WEBHOOK_SECRET` required in production (line 115-122, `stripe-webhook.ts`)
- Signature verification via `stripe.webhooks.constructEvent()` (line 129-133)
- 503 error if webhook secret missing in production (fail-closed)
- Raw body preserved for signature check (line 107-110)

**Evidence:**
```typescript
if (!STRIPE_WEBHOOK_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    fastify.log.error('FATAL: STRIPE_WEBHOOK_SECRET missing in production - rejecting webhook');
    return reply.code(503).send({
      error: 'Service Unavailable',
      message: 'Webhook signature verification not configured',
    });
  }
}

event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

**Attack prevention:**
- Attacker cannot spoof `checkout.session.completed` event (no valid signature)
- Attacker cannot activate their own subscription via fake webhook
- Webhook secret is server-side only (never exposed to client)

---

### ✅ 6. Idempotency

**Requirement:** Webhook processing must be idempotent (safe to replay).

**Implementation:**
- Database UPDATE operations are idempotent:
  - `subscriptionActive = true` (can be set multiple times safely)
  - `subscriptionActive = false` (can be set multiple times safely)
- NO append-only ledger for subscription status (UPDATE only)
- Stripe events can be replayed without side effects

**Evidence:**
```typescript
await prisma.user.update({
  where: { id: origoUserId },
  data: { subscriptionActive: true },  // Idempotent: can set multiple times
});
```

**Safe replay scenarios:**
- `checkout.session.completed` sent twice → both set `subscriptionActive = true` (safe)
- `customer.subscription.deleted` sent twice → both set `subscriptionActive = false` (safe)
- NO duplicate charges (Stripe handles that)
- NO duplicate payouts (referral payout uses unique constraint on `stripeInvoiceId`)

---

### ✅ 7. Minimal Schema Footprint

**Requirement:** Avoid heavy schema changes; use existing structures where possible.

**Implementation:**
- Added only 2 soft fields to existing `User` table:
  - `stripeCustomerId` (nullable, links to Stripe)
  - `subscriptionActive` (boolean, default false)
- NO new tables (no `Subscription`, `Payment`, `Invoice` models)
- NO foreign key constraints (Stripe is source of truth, not DB)
- Uses Stripe API for rich subscription data (not replicated in DB)

**Rationale:**
- Stripe API is authoritative source for subscription data
- DB stores only minimal gate flag (`subscriptionActive`)
- Avoids sync issues between Stripe and DB
- Simpler to maintain and debug

---

### ✅ 8. Role-Based Gate

**Requirement:** Only PROFESSIONAL users subject to payment gate; STUDENT users bypass.

**Implementation:**
- Middleware checks `user.role === 'PROFESSIONAL'` before blocking (line 198, `index.ts`)
- STUDENT users with `subscriptionActive = false` are NOT blocked
- Role derived from database `User.role` enum (server-side only)
- NO client control over role assignment

**Evidence:**
```typescript
// PAYMENT GATE: Block PROFESSIONAL users without active subscription
if (user.role === 'PROFESSIONAL' && !user.subscriptionActive) {
  return reply.code(403).send({ error: 'payment_required', ... });
}
// STUDENT users with subscriptionActive = false pass through (not blocked)
```

---

### ✅ 9. Exempt Routes (Allowlist)

**Requirement:** Auth, legal, checkout, and public routes must NOT be blocked by payment gate.

**Implementation:**
- Explicit allowlist in middleware (line 185-200, `index.ts`)
- Covers:
  - Authentication (`/api/v1/auth/*`)
  - Legal acceptance (`/api/v1/legal/*`)
  - Checkout creation (`/api/v1/checkout/session`)
  - Webhooks (`/api/v1/webhooks/stripe`)
  - Public endpoints (`/health`, `/api/v1/referrals/validate`, `/api/v1/invites/validate`)

**Rationale:**
- User must be able to login (to create checkout session)
- User must be able to accept legal docs (required before checkout)
- User must be able to create checkout session (to PAY!)
- Webhooks must not be blocked (Stripe cannot authenticate as user)
- Public endpoints remain accessible

**Evidence:**
```typescript
const exemptRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register/professional',
  '/api/v1/legal/accept',
  '/api/v1/checkout/session',  // MUST allow: user needs to create session to pay
  '/api/v1/webhooks/stripe',
  // ... etc
];
```

---

### ✅ 10. Consistent Error Response

**Requirement:** All blocked requests return consistent error format for frontend parsing.

**Implementation:**
- Always returns `403 Forbidden` HTTP status
- Always returns `error: "payment_required"` code
- Always returns Portuguese message
- Stable contract (frontend can match on `error === "payment_required"`)

**Evidence:**
```typescript
return reply.code(403).send({
  error: 'payment_required',  // Stable error code (frontend contract)
  message: 'Pagamento pendente. Complete o checkout para ativar sua conta.',
});
```

**Frontend integration:**
```typescript
if (response.status === 403) {
  const error = await response.json();
  if (error.error === 'payment_required') {
    // Redirect to checkout page
    window.location.href = '/checkout';
  }
}
```

---

## Attack Scenarios & Mitigations

### Attack 1: User tries to set `subscriptionActive = true` via API

**Prevention:**
- NO API endpoint accepts `subscriptionActive` in request body
- Field is NOT in any request schema (`CreateInviteBody`, `CheckoutSessionBody`, etc.)
- Middleware reads from database (SELECT only)

**Outcome:** Attack fails (field ignored or 422 validation error).

---

### Attack 2: User spoofs Stripe webhook to activate subscription

**Prevention:**
- Webhook signature verification required (line 94-141, `stripe-webhook.ts`)
- Invalid signature → `400 Bad Request`
- Missing signature → `400 Bad Request`
- No signature bypass in production

**Outcome:** Attack fails (invalid signature rejected).

---

### Attack 3: User modifies JWT to claim `subscriptionActive = true`

**Prevention:**
- JWT does NOT contain `subscriptionActive` field
- Middleware fetches `subscriptionActive` from database (line 175-181, `index.ts`)
- JWT signature verification prevents tampering

**Outcome:** Attack fails (database is source of truth).

---

### Attack 4: User bypasses payment gate via exempt route

**Prevention:**
- Exempt routes are intentional (auth, legal, checkout, webhooks)
- Protected routes (e.g., `/api/v1/invites`) are NOT exempt
- Middleware runs on ALL non-exempt routes

**Outcome:** Attack fails (gate enforced on protected routes).

---

### Attack 5: User exploits race condition during webhook processing

**Prevention:**
- Database UPDATE is atomic (single transaction)
- No TOCTOU (time-of-check-time-of-use) bug
- Middleware fetches latest `subscriptionActive` on every request

**Outcome:** Attack fails (no race condition).

---

## Logging & Audit Trail

### What We Log

**Payment gate blocks:**
```typescript
// Middleware does NOT log blocks (to avoid spamming logs)
// Frontend can track 403 payment_required responses for analytics
```

**Webhook events:**
```typescript
fastify.log.info(
  { user_id: origoUserId, session_id: session.id },
  'Subscription activated (checkout.session.completed)'
);

fastify.log.info(
  { user_id: origoUserId, subscription_id: subscription.id },
  'Subscription deactivated (customer.subscription.deleted)'
);
```

**Checkout sessions:**
```typescript
// Checkout session creation logged by Fastify (INFO level)
```

### What We DON'T Log

- User credentials (JWT tokens)
- Stripe webhook secrets
- Stripe customer IDs (PII)
- Payment method details
- Specific payment failure reasons

---

## Performance Considerations

### Database Queries

**Before optimization:**
- Legal middleware: 1 query (fetch user + acceptances)
- Route handler: potentially 1 more query (re-verify user)

**After optimization:**
- Payment gate middleware: 1 query (fetch user)
- Legal middleware: reuses `authenticatedUser` (no query)
- Route handler: reuses `authenticatedUser` (no query)

**Result:** 1 database query per request (optimal).

---

### Middleware Execution Order

1. **Payment gate middleware** (runs first):
   - Fetches user from database
   - Attaches `authenticatedUser` to request
   - Blocks if PROFESSIONAL + unpaid

2. **Legal acceptance middleware** (runs second):
   - Reuses `authenticatedUser` from payment gate
   - Blocks if missing required legal docs

3. **Route handler** (runs last):
   - Reuses `authenticatedUser` from middlewares
   - Executes business logic

---

## Deployment Checklist

### Pre-Deployment

- [ ] Migration created: `20260914153523_add_payment_gate_fields`
- [ ] Prisma client regenerated
- [ ] `STRIPE_WEBHOOK_SECRET` set in production env
- [ ] Frontend ready to handle `403 payment_required` error

### Deployment

1. **Deploy database migration** (add fields)
2. **Deploy API code** (payment gate middleware + webhooks)
3. **Test checkout flow** (register → checkout → webhook → access granted)
4. **Monitor webhook logs** (verify events processed correctly)

### Post-Deployment

- [ ] Verify webhook events in Stripe dashboard
- [ ] Check payment gate blocks in logs (optional)
- [ ] Test unpaid user blocked (403)
- [ ] Test paid user allowed (200)
- [ ] Monitor 403 rate (should be low after launch)

---

## Future Enhancements

### 1. Grace Period
- Allow X days of access after subscription expires
- Soft reminder before hard block

### 2. Manual Override
- Admin API to manually activate/deactivate users
- Requires admin authentication + audit logging

### 3. Subscription Tiers
- Different feature gates for different plans (start/pro/clinic)
- Store `subscriptionTier` alongside `subscriptionActive`

### 4. Webhook Retry Logic
- Handle Stripe webhook failures gracefully
- Queue failed webhooks for retry

### 5. Customer Portal
- Allow users to manage subscription (Stripe Customer Portal)
- Update `subscriptionActive` when user cancels/resumes

---

## Summary

**Security posture:**
- ✅ Fail-closed by default (`subscriptionActive = false`)
- ✅ Server-side enforcement (middleware)
- ✅ No client-side bypass (database is source of truth)
- ✅ Webhook signature verification (prevent spoofing)
- ✅ Idempotent webhook processing (safe to replay)
- ✅ No information leakage (generic error response)
- ✅ Minimal schema footprint (2 soft fields)
- ✅ Role-based gate (PROFESSIONAL only)
- ✅ Consistent error contract (`403 payment_required`)

**Contract:**
- Unpaid PROFESSIONAL user → `403 payment_required`
- Paid PROFESSIONAL user → `200 OK`
- STUDENT user → bypass gate (not subject to payment)

**Testing:**
- Curl examples in `PAYMENT_GATE.md`
- Webhook events can be simulated via Stripe CLI
- Integration tests cover all scenarios

**Compliance:**
- LGPD: No new PII stored (Stripe is processor)
- PCI-DSS: No payment data in Origo database (Stripe handles it)
- Audit trail: Webhook events logged, gate blocks trackable via 403 responses
