# P0 TRIAL SECURITY LOCK - Implementation Notes

## Context
Owner P0 lock for Origo API: Ensure 14-day trial is **ONLY** available via valid indication (referral) coupon, with NO default trial_period_days on normal checkout.

## Implementation Summary

### Changes Made

1. **`apps/api/src/lib/checkout.ts`** - Core logic:
   - Added `trial_period_days: 14` to `subscription_data` **ONLY** when `referralApplied === true`
   - Uses conditional spread: `...(referralApplied && { trial_period_days: 14 })`
   - Fail-closed: Invalid/missing referral = no trial

2. **`apps/api/src/routes/checkout.ts`** - Documentation:
   - Updated BUSINESS RULES comment to reflect P0 lock
   - Added P0 TRIAL SECURITY LOCK section to security notes
   - Clarified that regular paid signup has NO trial_period_days

3. **`libs/api-contract/openapi.yaml`** - API contract:
   - Updated checkout endpoint documentation
   - Added P0 TRIAL SECURITY LOCK section
   - Clarified business rules for trial behavior

## Security Model

### Fail-Closed Design
- **Default behavior**: NO trial_period_days set → user pays from day 1
- **Referral flow**: Valid referral code → 14-day trial + 100% discount first month
- **Client cannot force trial**: Trial only set server-side after validating referral code

### Server-Side Validation Chain
1. Client sends optional `referral_code` in checkout request
2. Server validates referral code via `createCheckoutSession` helper:
   - Checks code exists in database
   - Prevents self-referral (user can't use their own code)
   - Verifies user hasn't been referred before (one referral per user)
3. Only if validation passes:
   - `referralApplied = true`
   - Stripe coupon applied (100% off first month)
   - `trial_period_days: 14` added to subscription_data
4. If validation fails or no code provided:
   - `referralApplied = false`
   - No coupon, no trial_period_days
   - User pays from day 1

### Attack Surface Mitigation
- ✅ Client cannot send `trial_period_days` directly (not accepted in API)
- ✅ Client cannot manipulate `referralApplied` flag (server-side only)
- ✅ Referral code validation is server-side (DB lookup)
- ✅ Stripe session created server-side with tamper-proof parameters
- ✅ No client-controlled trial flags or parameters

## Testing Considerations

### Test Cases to Verify

1. **Normal checkout (no referral code)**:
   - POST `/api/v1/checkout/session` without `referral_code`
   - Expected: Stripe session with NO `trial_period_days`
   - User should be charged immediately

2. **Checkout with valid referral code**:
   - POST `/api/v1/checkout/session` with valid `referral_code`
   - Expected: Stripe session with `trial_period_days: 14`
   - User should have 14-day free trial + 100% off first month

3. **Checkout with invalid referral code**:
   - POST `/api/v1/checkout/session` with non-existent `referral_code`
   - Expected: 422 error "Código de indicação inválido"
   - No checkout session created

4. **Checkout with self-referral attempt**:
   - POST `/api/v1/checkout/session` with own `referral_code`
   - Expected: 422 error "Você não pode usar seu próprio código de indicação"
   - No checkout session created

5. **Checkout when already referred**:
   - User already has referral attribution
   - POST `/api/v1/checkout/session` with another `referral_code`
   - Expected: 422 error "Você já foi indicado por outro usuário"
   - No checkout session created

## Production Verification

### How to Verify in Production (Stripe Dashboard)

1. **Regular checkout** (no referral):
   - Check Stripe Checkout Session in Dashboard
   - Verify `subscription_data.trial_period_days` is **NOT** set
   - Subscription should start billing immediately

2. **Referral checkout**:
   - Check Stripe Checkout Session in Dashboard
   - Verify `subscription_data.trial_period_days: 14`
   - Verify discount coupon is applied
   - Subscription should have 14-day trial period

## Compliance Notes

- **Fail-closed**: Default is secure (no trial) → errors fall on the side of user paying
- **Server-side only**: All trial logic is server-side; client cannot manipulate
- **Audit trail**: Referral attribution stored in DB before Stripe session created
- **No bypass**: No other code path sets `trial_period_days` outside referral flow

## Change Log

**2026-09-14** - P0 TRIAL SECURITY LOCK implementation:
- Added conditional `trial_period_days: 14` only when valid referral code applied
- Updated documentation in code and OpenAPI spec
- Verified fail-closed security model
