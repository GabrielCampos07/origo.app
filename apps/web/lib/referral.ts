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

// TODO: Backend endpoints — stub responses until OpenAPI ships
// When backend returns 404, UI shows empty/disabled state with clear messaging

/**
 * GET /api/v1/referrals/code
 * Returns user's referral code (auto-creates if missing).
 * PROFESSIONAL only.
 */
export async function getReferralCode(): Promise<ApiResult<ReferralCode>> {
  const result = await apiGet<ReferralCode>("/api/v1/referrals/code");
  
  // DEMO stub: if 404, return placeholder for UI review
  if (!result.ok && result.status === 404) {
    console.warn("[DEMO STUB] Referral code endpoint not ready; using placeholder");
    return {
      ok: true,
      data: {
        code: "DEMO-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        created_at: new Date().toISOString(),
        is_active: true,
      },
    };
  }
  
  return result;
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
  const result = await apiGet<ReferralStatus>("/api/v1/referrals/status");
  
  // DEMO stub: if 404, return empty state for UI review
  if (!result.ok && result.status === 404) {
    console.warn("[DEMO STUB] Referral status endpoint not ready; using empty state");
    return {
      ok: true,
      data: {
        total_referred: 0,
        active_subscribers: 0,
        pending_payout: 0,
        total_earned: 0,
        referred_users: [],
      },
    };
  }
  
  return result;
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
  const result = await apiPostAuth<CouponValidation>("/api/v1/referrals/validate", {
    code: code.trim().toUpperCase(),
  });
  
  // DEMO stub: if 404, accept any non-empty code for UI review
  if (!result.ok && result.status === 404) {
    console.warn("[DEMO STUB] Referral validate endpoint not ready; accepting placeholder");
    const valid = code.trim().length >= 4;
    return {
      ok: true,
      data: {
        valid,
        discount_description: valid ? "1 mês grátis" : undefined,
        referrer_email_prefix: valid ? "j***@example.com" : undefined,
      },
    };
  }
  
  return result;
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
