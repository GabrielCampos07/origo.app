# P0 Trial Lock - Flow Diagram

## Checkout Flow Decision Tree

```
┌─────────────────────────────────────┐
│  Client: POST /checkout/session     │
│  Body: plan, billing_cycle          │
│  Optional: referral_code            │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Server: Extract & Validate JWT                  │
│  • Extract userId from JWT                       │
│  • Verify PROFESSIONAL role (403 if STUDENT)     │
└──────────────┬───────────────────────────────────┘
               │
               ▼
         ┌─────────────┐
         │ referral_   │
         │ code        │
         │ present?    │
         └──────┬──────┘
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        ▼               ▼
┌──────────────────┐   ┌─────────────────────────┐
│ Validate         │   │ Skip referral           │
│ Referral Code:   │   │ validation              │
│                  │   │                         │
│ 1. Code exists?  │   │ referralApplied = false │
│ 2. Not self?     │   └──────────┬──────────────┘
│ 3. Not used?     │              │
└────┬────────┬────┘              │
     │        │                   │
   VALID   INVALID                │
     │        │                   │
     │        ▼                   │
     │   ┌──────────────┐         │
     │   │ Return 422   │         │
     │   │ Error:       │         │
     │   │ - Invalid    │         │
     │   │ - Self-ref   │         │
     │   │ - Already    │         │
     │   │   referred   │         │
     │   └──────────────┘         │
     │                            │
     ▼                            │
┌────────────────────────┐        │
│ Apply Referral:        │        │
│                        │        │
│ 1. Create attribution  │        │
│ 2. Get Stripe coupon   │        │
│ 3. Set referralApplied │        │
│    = true              │        │
└──────────┬─────────────┘        │
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ Create Stripe Checkout Session             │
│                                             │
│ subscription_data: {                        │
│   metadata: { origo_user_id },              │
│   ...(referralApplied && {                  │
│     trial_period_days: 14    ◄── P0 LOCK   │
│   })                                        │
│ }                                           │
│                                             │
│ IF referralApplied:                         │
│   discounts: [{ coupon: ... }]              │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   WITH REFERRAL    WITHOUT REFERRAL
       │                │
       ▼                ▼
┌─────────────────┐  ┌──────────────────┐
│ Result:         │  │ Result:          │
│ • trial: 14d    │  │ • trial: NONE    │
│ • discount:     │  │ • discount: NONE │
│   100% 1st mo   │  │ • immediate      │
│ • free start    │  │   billing        │
└─────────────────┘  └──────────────────┘
```

## Security Checkpoints

```
┌────────────────────────────────────────────────────┐
│                SECURITY CHECKPOINTS                │
└────────────────────────────────────────────────────┘

1. JWT Validation
   ├─ ✅ userId from JWT only (never from request body)
   ├─ ✅ PROFESSIONAL role enforced (403 for STUDENT)
   └─ ✅ Token signature verified

2. Referral Code Validation (Server-Side)
   ├─ ✅ DB lookup (code exists?)
   ├─ ✅ Self-referral blocked (code.userId != requestUserId)
   ├─ ✅ Already referred check (one referral per user)
   └─ ✅ Attribution recorded atomically

3. Trial Period Application
   ├─ ✅ ONLY set when referralApplied === true
   ├─ ✅ Client cannot send trial_period_days
   ├─ ✅ Client cannot manipulate referralApplied flag
   └─ ✅ Fail-closed: default = no trial

4. Stripe Session Creation
   ├─ ✅ Price IDs from env (server-side)
   ├─ ✅ Customer metadata set (origo_user_id)
   ├─ ✅ URLs from FRONTEND_URL env
   └─ ✅ All parameters tamper-proof
```

## Attack Surface Analysis

```
┌─────────────────────────────────────────────────────┐
│            ATTACK VECTORS MITIGATED                 │
└─────────────────────────────────────────────────────┘

❌ Client tries to send trial_period_days in request
   └─ ✅ BLOCKED: Not accepted in API schema
           
❌ Client tries to manipulate referralApplied flag
   └─ ✅ BLOCKED: Server-side only variable
           
❌ Client tries to use invalid referral code
   └─ ✅ BLOCKED: DB validation, returns 422
           
❌ Client tries to use their own referral code
   └─ ✅ BLOCKED: Self-referral check, returns 422
           
❌ Client tries to be referred multiple times
   └─ ✅ BLOCKED: Already-referred check, returns 422
           
❌ Client tries to bypass JWT validation
   └─ ✅ BLOCKED: 401 if no/invalid token
           
❌ STUDENT user tries to checkout
   └─ ✅ BLOCKED: 403 (PROFESSIONAL only)
```

## Data Flow

```
┌──────────┐      ┌──────────┐      ┌─────────────┐
│  Client  │─────▶│   API    │─────▶│  Database   │
│ (Untrust)│      │ (Server) │      │  (Source    │
└──────────┘      └────┬─────┘      │   of Truth) │
                       │             └─────────────┘
                       │                    ▲
                       │                    │
                       ▼                    │
                 ┌──────────┐               │
                 │  Stripe  │───────────────┘
                 │   API    │  Validates referral
                 └──────────┘  code before
                               creating session
                               
SECURITY PRINCIPLE: Trust only server-side data
- JWT verified on server
- Referral code validated against DB
- Trial decision made server-side
- Stripe session created with validated data
```

## Testing Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST MATRIX                              │
├─────────────┬──────────────┬─────────────┬─────────────────────┤
│ Test Case   │ Input        │ Expected    │ Security Property   │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ 1. Normal   │ No referral  │ NO trial    │ Fail-closed default │
│             │              │ Immediate   │                     │
│             │              │ billing     │                     │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ 2. Valid    │ Valid code   │ 14d trial   │ Server-side         │
│    Referral │              │ + discount  │ validation          │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ 3. Invalid  │ Fake code    │ 422 error   │ DB validation       │
│    Code     │              │ No session  │                     │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ 4. Self-    │ Own code     │ 422 error   │ Self-referral block │
│    Referral │              │ No session  │                     │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ 5. Already  │ 2nd referral │ 422 error   │ One referral limit  │
│    Referred │              │ No session  │                     │
└─────────────┴──────────────┴─────────────┴─────────────────────┘
```

---

**Key Insight**: The P0 lock ensures that trial periods are a **privilege earned through valid referrals**, not a default right. This fail-closed design means errors always favor the business (user pays) rather than giving away free trials.
