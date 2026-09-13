import Stripe from 'stripe';
import { PrismaClient, ReferralStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Stripe client initialization
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_REFERRAL_COUPON_ID = process.env.STRIPE_REFERRAL_COUPON_ID || 'create-on-fly';

if (!STRIPE_SECRET_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: STRIPE_SECRET_KEY environment variable is required in production.');
  }
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
}) : null;

/**
 * Checkout Helper - Referral Integration
 * 
 * BACKEND SECURITY NOTES:
 * - Validates referral code before applying Stripe coupon
 * - Creates referral attribution record (one per user)
 * - Applies 100% off first month via Stripe coupon
 * - Sets freeMonthEndsAt timestamp for commission logic
 * - Links Stripe customer to Origo user via metadata
 */

export interface CreateCheckoutSessionOptions {
  userId: string;
  email: string;
  priceId: string;
  referralCode?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  sessionUrl: string;
  referralApplied: boolean;
  referralCodeId?: string;
}

/**
 * Get or create Stripe coupon for 100% off first month
 * 
 * @returns Stripe coupon ID
 */
async function getOrCreateReferralCoupon(): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  // If STRIPE_REFERRAL_COUPON_ID is not "create-on-fly", use it directly
  if (STRIPE_REFERRAL_COUPON_ID && STRIPE_REFERRAL_COUPON_ID !== 'create-on-fly') {
    return STRIPE_REFERRAL_COUPON_ID;
  }

  // Create coupon dynamically: 100% off, duration=once
  try {
    const coupon = await stripe.coupons.create({
      name: 'Referral First Month Free',
      percent_off: 100,
      duration: 'once',
      max_redemptions: 1,
      metadata: {
        type: 'referral',
        created_by: 'origo-api',
      },
    });

    return coupon.id;
  } catch (error: any) {
    // If coupon already exists with same properties, reuse it
    if (error.code === 'resource_already_exists') {
      // For simplicity, use a fixed ID if creating dynamically
      return 'ORIGO_REFERRAL_100OFF';
    }
    throw error;
  }
}

/**
 * Create Stripe checkout session with optional referral code
 * 
 * BACKEND SECURITY:
 * - Validates referral code exists and is valid
 * - Creates referral attribution record atomically
 * - Applies Stripe coupon only if referral code is valid
 * - Sets customer metadata for webhook processing
 * - Prevents self-referral (user can't use their own code)
 * 
 * @param options - Checkout session options
 * @returns Checkout session result
 * @throws Error if referral code is invalid
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions
): Promise<CreateCheckoutSessionResult> {
  if (!stripe) {
    throw new Error('Stripe not initialized (missing STRIPE_SECRET_KEY)');
  }

  const { userId, email, priceId, referralCode, successUrl, cancelUrl } = options;

  let referralApplied = false;
  let referralCodeId: string | undefined;
  let stripeCouponId: string | undefined;
  let freeMonthEndsAt: Date | undefined;

  // Handle referral code if provided
  if (referralCode) {
    // SECURITY: Validate referral code exists
    const referralCodeRecord = await prisma.referralCode.findUnique({
      where: { code: referralCode.toUpperCase() },
      include: { user: true },
    });

    if (!referralCodeRecord) {
      throw new Error('Invalid referral code');
    }

    // SECURITY: Prevent self-referral
    if (referralCodeRecord.userId === userId) {
      throw new Error('Cannot use your own referral code');
    }

    // Check if user was already referred (one referral per user)
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });

    if (existingReferral) {
      throw new Error('User has already been referred');
    }

    // Get or create Stripe coupon
    stripeCouponId = await getOrCreateReferralCoupon();

    // Calculate free month end date (30 days from now)
    freeMonthEndsAt = new Date();
    freeMonthEndsAt.setDate(freeMonthEndsAt.getDate() + 30);

    // Create referral attribution record
    await prisma.referral.create({
      data: {
        referrerUserId: referralCodeRecord.userId,
        referredUserId: userId,
        referralCodeId: referralCodeRecord.id,
        stripeCouponId,
        freeMonthEndsAt,
        status: ReferralStatus.ACTIVE,
      },
    });

    referralApplied = true;
    referralCodeId = referralCodeRecord.id;
  }

  // SECURITY FIX: Create or retrieve Stripe Customer with origo_user_id metadata BEFORE session
  // Webhook reads customer.metadata.origo_user_id - must be set on Customer, not just session/subscription
  // Search for existing customer by email or create new one
  let customer: Stripe.Customer;
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  
  if (existingCustomers.data.length > 0) {
    // Customer exists - update metadata to ensure origo_user_id is set
    customer = await stripe.customers.update(existingCustomers.data[0].id, {
      metadata: {
        origo_user_id: userId,
      },
    });
  } else {
    // Create new customer with metadata
    customer = await stripe.customers.create({
      email,
      metadata: {
        origo_user_id: userId,
      },
    });
  }

  // Create Stripe checkout session with existing customer
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: customer.id, // SECURITY: Use pre-created customer with metadata
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      origo_user_id: userId,
    },
    subscription_data: {
      metadata: {
        origo_user_id: userId,
      },
    },
  };

  // Apply coupon if referral code was valid
  if (stripeCouponId) {
    sessionParams.discounts = [
      {
        coupon: stripeCouponId,
      },
    ];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    sessionUrl: session.url!,
    referralApplied,
    referralCodeId,
  };
}

/**
 * Verify referral code is valid
 * 
 * @param code - Referral code to validate
 * @returns true if valid, false otherwise
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  return !!referralCode;
}
