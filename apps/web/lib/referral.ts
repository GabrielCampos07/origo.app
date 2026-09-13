/**
 * Referral (Indicação) program types and API stubs for beOrigo.
 * 
 * BUSINESS RULES:
 * - 15% recurring commission for referrer AFTER free month ends
 * - 1 free month coupon for referred (indicado)
 * - 0% commission during free/trial month
 * - PROFESSIONAL only (STUDENT role has no referral access)
 * - Commission base = amount charged in billing cycle (post-discount)
 * 
 * SEC: All referral endpoints require PROFESSIONAL role + auth token.
 * Backend validates Stripe coupon codes server-side; client validation is UX only.
 */

import { apiGet, apiPostAuth, type ApiResult } from "./api";

export type ReferralCode = {
  code: string;
  created_at: string;
  is_active: boolean;
};

export type ReferralStatus = {
  total_referred: number;
  active_subscribers: number;
  pending_payout: number; // in cents
  total_earned: number; // in cents, lifetime
  referred_users: ReferredUser[];
};

export type ReferredUser = {
  id: string;
  email_prefix: string; // e.g. "j***@example.com" for privacy
  status: "trial" | "active" | "cancelled";
  subscribed_at: string;
  commission_earned: number; // in cents
};

export type CouponValidation = {
  valid: boolean;
  discount_description?: string; // e.g. "1 mês grátis"
  referrer_email_prefix?: string;
};


/**
 * GET /api/v1/referrals/code
 * Returns user's referral code (auto-creates if missing).
 * PROFESSIONAL only.
 */
export async function getReferralCode(): Promise<ApiResult<ReferralCode>> {
  return apiGet<ReferralCode>("/api/v1/referrals/code");
}

/**
 * POST /api/v1/referrals/code
 * Regenerates user's referral code (optional feature).
 * PROFESSIONAL only.
 */
export async function regenerateReferralCode(): Promise<ApiResult<ReferralCode>> {
  return apiPostAuth<ReferralCode>("/api/v1/referrals/code", {});
}

/**
 * GET /api/v1/referrals/status
 * Returns referral status: referred users list + payout summary.
 * PROFESSIONAL only.
 */
export async function getReferralStatus(): Promise<ApiResult<ReferralStatus>> {
  return apiGet<ReferralStatus>("/api/v1/referrals/status");
}

/**
 * POST /api/v1/referrals/validate
 * Validates a referral/coupon code (for indicado at checkout).
 * Returns validation result + discount description if valid.
 * 
 * SEC: Backend must reject self-referral (user cannot use their own code).
 */
export async function validateReferralCode(
  code: string
): Promise<ApiResult<CouponValidation>> {
  return apiPostAuth<CouponValidation>("/api/v1/referrals/validate", {
    code: code.trim().toUpperCase(),
  });
}

/**
 * Formats currency in BRL (cents to R$).
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
