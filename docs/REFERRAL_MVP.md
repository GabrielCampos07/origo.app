# Referral MVP Schema

## Overview

MVP referral system tracking:
- **Referrer benefit**: 15% commission payout on referred user's paid subscriptions
- **Referred user benefit**: 1-month free coupon on signup

## Database Schema

### `referral_codes`
Stores unique referral codes (1 per user, typically PROFESSIONAL role).

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `userId` | String (UNIQUE) | Owner of the referral code (FK → users) |
| `code` | String (UNIQUE, CITEXT) | Case-insensitive referral code |
| `createdAt` | DateTime | Code creation timestamp |

**Relations:**
- `userId` → `User.id` (CASCADE on delete)
- One user can have at most one referral code

---

### `referrals`
Tracks referral attribution (1 referrer per referred user).

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `referrerUserId` | String | User who referred (FK → users) |
| `referredUserId` | String (UNIQUE) | User who was referred (FK → users) |
| `referralCodeId` | String | Code used for signup (FK → referral_codes) |
| `stripeCouponId` | String? | Stripe coupon ID for 1-month free |
| `freeMonthEndsAt` | DateTime? | Expiry of free month benefit |
| `status` | ReferralStatus | PENDING \| ACTIVE \| COMPLETED \| CANCELLED |
| `createdAt` | DateTime | Referral creation timestamp |

**Indexes:**
- `referrerUserId`
- `referralCodeId`

**Relations:**
- `referrerUserId` → `User.id` (CASCADE on delete)
- `referredUserId` → `User.id` (CASCADE on delete)
- `referralCodeId` → `ReferralCode.id` (CASCADE on delete)
- Each referred user can only be attributed to one referrer

---

### `referral_payouts`
Append-only ledger of commission payouts (NO updates in app layer).

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `referralId` | String | Parent referral (FK → referrals) |
| `stripeInvoiceId` | String (UNIQUE) | Stripe invoice reference |
| `amountCents` | Int | Payout amount in cents |
| `currency` | String | Currency code (default: `"brl"`) |
| `commissionRateBps` | Int | Commission rate in basis points (default: 1500 = 15%) |
| `createdAt` | DateTime | Payout ledger entry timestamp |

**Indexes:**
- `referralId`

**Relations:**
- `referralId` → `Referral.id` (CASCADE on delete)

---

## Security & Privacy Notes

### PII & Purpose
- `userId`, `referrerUserId`, `referredUserId` are PII-linked identifiers
- **Purpose limitation**: Referral attribution and rewards tracking only
- No payment card data, PIX keys, or bank account numbers stored
- Stripe IDs (`stripeCouponId`, `stripeInvoiceId`) are opaque external references

### Least Privilege
- API layer: `INSERT` / `SELECT` only
- Payout ledger: Append-only (no `UPDATE` / `DELETE` from app)
- Backend job/admin service may have elevated privileges for reconciliation

### CASCADE Behavior
- Deleting a `User` cascades to their `referral_codes`, `referrals` (as referrer or referred), and transitively to `referral_payouts`
- Deleting a `ReferralCode` cascades to dependent `Referral` records
- Deleting a `Referral` cascades to its `ReferralPayout` ledger entries

⚠️ **Note**: CASCADE deletes are intentional for data consistency. If audit/immutability requirements change, soft-delete patterns should be implemented before production.

### Retention Policy
**TBD by compliance team** — no retention/purge logic defined in MVP.

---

## Future Considerations (Out of MVP Scope)

- API routes for code generation, referral signup flow, payout webhook handlers
- Stripe integration (coupon creation, invoice event webhooks)
- Admin dashboard for referral analytics
- Fraud detection / abuse prevention
- Multi-tier commission structures
- Referral code expiry / deactivation logic
