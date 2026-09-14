# P0 Trial Lock - Quick Reference

## 🎯 What is this?

The P0 Trial Lock ensures that **14-day free trials are ONLY available through valid referral codes**. Regular checkouts have NO trial period - users pay from day 1.

## 🔒 Security Model: Fail-Closed

**Default behavior**: NO trial → user pays immediately  
**With valid referral**: 14-day trial + 100% discount on first month

## 📍 Where to look

### Core Implementation
**File**: `apps/api/src/lib/checkout.ts` (lines 217-224)
```typescript
subscription_data: {
  metadata: { origo_user_id: userId },
  ...(referralApplied && { trial_period_days: 14 }),
}
```

### Key Points
- `referralApplied` is set ONLY after server-side validation
- Client cannot manipulate this flag
- No trial is set if `referralApplied === false`

## 🧪 How to test

### 1. Normal Checkout (NO trial expected)
```bash
curl -X POST http://localhost:3001/api/v1/checkout/session \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","billing_cycle":"monthly"}'
```
**Expected**: Stripe session with NO `trial_period_days`

### 2. With Referral (14-day trial expected)
```bash
curl -X POST http://localhost:3001/api/v1/checkout/session \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","billing_cycle":"monthly","referral_code":"VALID123"}'
```
**Expected**: Stripe session with `trial_period_days: 14`

### 3. Verification Script
```bash
node verify-trial-lock.js
```
Displays all test cases with expected behavior.

## ✅ What got changed

1. **`apps/api/src/lib/checkout.ts`** - Added conditional `trial_period_days: 14`
2. **`apps/api/src/routes/checkout.ts`** - Updated documentation
3. **`libs/api-contract/openapi.yaml`** - Updated API contract
4. **`SECURITY_NOTES_TRIAL_LOCK.md`** - Comprehensive security notes
5. **`verify-trial-lock.js`** - Manual verification script
6. **`P0_TRIAL_LOCK_FLOWS.md`** - Visual flow diagrams

## 🔐 Security Guarantees

| Attack Vector | Mitigation |
|--------------|------------|
| Client sends `trial_period_days` | ❌ Not accepted in API schema |
| Client manipulates `referralApplied` | ❌ Server-side only variable |
| Invalid referral code | ❌ DB validation, 422 error |
| Self-referral | ❌ Blocked, 422 error |
| Multiple referrals | ❌ One per user, 422 error |
| Bypass JWT | ❌ 401 unauthorized |
| STUDENT checkout | ❌ 403 forbidden |

## 🎓 Quick Answers

**Q: Why fail-closed?**  
A: Errors favor the business (user pays) rather than giving away free trials.

**Q: Can clients set trial_period_days?**  
A: No. It's set server-side only after validating referral codes.

**Q: What if referral code is invalid?**  
A: 422 error, no checkout session created, no trial.

**Q: Can a user be referred multiple times?**  
A: No. One referral per user enforced at database level.

**Q: How do I verify in production?**  
A: Check Stripe Dashboard → Checkout Sessions → subscription_data.trial_period_days

**Q: What about existing users?**  
A: No impact. They already have subscriptions. This only affects NEW checkouts.

**Q: Is there a database migration?**  
A: No. Uses existing referral tables and Stripe fields.

**Q: Can this be bypassed?**  
A: No. All paths go through the same server-side validation.

## 📝 Code Review Checklist

When reviewing this PR, verify:

- [ ] `trial_period_days` ONLY set when `referralApplied === true`
- [ ] Regular checkout has NO `trial_period_days` in Stripe session
- [ ] Referral validation is server-side (DB lookup)
- [ ] No client-controlled trial parameters
- [ ] Error cases return 422 (invalid code, self-referral, etc.)
- [ ] Documentation updated (code comments, OpenAPI, security notes)
- [ ] No breaking changes to API contract

## 🚀 Deployment

### Pre-deployment
- No migrations to run
- No env vars to add
- No Stripe configuration changes

### Post-deployment
1. Test normal checkout → verify NO trial in Stripe
2. Test with referral → verify 14-day trial in Stripe
3. Monitor error logs for 422 responses (invalid codes)
4. Check Stripe webhooks still working (invoice.paid)

### Rollback
Simple git revert - no data changes to undo.

## 📞 Need Help?

- **Security questions**: See `SECURITY_NOTES_TRIAL_LOCK.md`
- **Flow diagrams**: See `P0_TRIAL_LOCK_FLOWS.md`
- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **Testing**: Run `node verify-trial-lock.js`

---

**tl;dr**: Normal checkout = no trial. Valid referral code = 14-day trial. Everything else = blocked.
