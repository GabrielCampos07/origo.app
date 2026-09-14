# 📚 P0 Trial Lock Documentation Index

This directory contains comprehensive documentation for the P0 Trial Lock security implementation.

## 🚀 Quick Start

**New to this feature?** Start here:
1. Read [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) - 5-minute overview
2. Run `node verify-trial-lock.js` - See test cases
3. Review [`P0_TRIAL_LOCK_FLOWS.md`](P0_TRIAL_LOCK_FLOWS.md) - Visual diagrams

## 📖 Documentation

### For Developers
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick answers, testing commands, code locations
- **[verify-trial-lock.js](verify-trial-lock.js)** - Executable verification script with test cases
- **[P0_TRIAL_LOCK_FLOWS.md](P0_TRIAL_LOCK_FLOWS.md)** - Flow diagrams, security checkpoints, attack analysis

### For Security Review
- **[SECURITY_NOTES_TRIAL_LOCK.md](SECURITY_NOTES_TRIAL_LOCK.md)** - Comprehensive security documentation
  - Implementation details
  - Security model
  - Attack surface mitigation
  - Testing considerations
  - Production verification

### For Project Management
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation summary
  - Requirements checklist
  - Code changes
  - Success criteria
  - Deployment readiness

## 🎯 What is the P0 Trial Lock?

The P0 Trial Lock is a security feature that ensures **14-day free trials are ONLY available through valid referral codes**. Regular checkout flows have NO trial period - users pay from day 1.

### Security Model: Fail-Closed
- **Default**: NO trial → user pays immediately
- **With valid referral**: 14-day trial + 100% discount first month
- **Invalid referral**: 422 error, no trial, no session

## 🔍 Key Implementation

**File**: `apps/api/src/lib/checkout.ts`

```typescript
subscription_data: {
  metadata: { origo_user_id: userId },
  // P0 SECURITY LOCK: 14-day trial ONLY via valid referral code
  // Regular paid signup has NO trial_period_days
  // Fail-closed: invalid/missing referral = no trial
  ...(referralApplied && { trial_period_days: 14 }),
}
```

## ✅ Files Changed

1. **Code**:
   - `apps/api/src/lib/checkout.ts` - Core implementation
   - `apps/api/src/routes/checkout.ts` - Documentation
   
2. **API Contract**:
   - `libs/api-contract/openapi.yaml` - OpenAPI spec updates

3. **Documentation** (NEW):
   - `QUICK_REFERENCE.md` - Quick developer reference
   - `SECURITY_NOTES_TRIAL_LOCK.md` - Security documentation
   - `P0_TRIAL_LOCK_FLOWS.md` - Visual flow diagrams
   - `IMPLEMENTATION_SUMMARY.md` - Implementation summary
   - `verify-trial-lock.js` - Verification script
   - `P0_DOCUMENTATION_INDEX.md` - This file

## 🧪 Testing

### Quick Test
```bash
# Normal checkout (NO trial expected)
curl -X POST http://localhost:3001/api/v1/checkout/session \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"plan":"pro","billing_cycle":"monthly"}'

# With referral (14-day trial expected)
curl -X POST http://localhost:3001/api/v1/checkout/session \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"plan":"pro","billing_cycle":"monthly","referral_code":"VALID123"}'
```

### Full Test Suite
```bash
node verify-trial-lock.js
```

## 🔐 Security Guarantees

| What | How |
|------|-----|
| ✅ Client cannot force trial | Server-side only logic |
| ✅ Invalid codes rejected | DB validation |
| ✅ Self-referral blocked | Server-side check |
| ✅ One referral per user | Database constraint |
| ✅ Fail-closed design | Default = no trial |

## 🚢 Deployment

### Pre-deployment
- ✅ No migrations required
- ✅ No env var changes
- ✅ No Stripe config changes

### Post-deployment
1. Test normal checkout → NO trial
2. Test with referral → 14-day trial
3. Monitor error logs
4. Verify Stripe webhooks

## 📝 Code Review Checklist

When reviewing [PR #57](https://github.com/GabrielCampos07/origo.app/pull/57):

- [ ] `trial_period_days` only set when `referralApplied === true`
- [ ] Regular checkout has NO trial in Stripe session
- [ ] Referral validation is server-side
- [ ] No client-controlled trial parameters
- [ ] Error cases return 422
- [ ] Documentation complete
- [ ] No breaking API changes

## 🔗 Related Links

- **PR**: https://github.com/GabrielCampos07/origo.app/pull/57
- **Branch**: `cursor/p0-trial-referral-only-f9a9`
- **Base**: `main`

## 🆘 Need Help?

1. **Quick questions**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. **Security concerns**: See [SECURITY_NOTES_TRIAL_LOCK.md](SECURITY_NOTES_TRIAL_LOCK.md)
3. **Visual understanding**: See [P0_TRIAL_LOCK_FLOWS.md](P0_TRIAL_LOCK_FLOWS.md)
4. **Implementation details**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

**Status**: ✅ Implementation Complete - Ready for Review  
**Security Level**: P0 (Owner Lock)  
**Date**: 2026-09-14
