#!/usr/bin/env node

/**
 * P0 TRIAL LOCK - Manual Verification Script
 * 
 * This script demonstrates how to verify the trial lock implementation.
 * Run this against a test Stripe account to verify behavior.
 * 
 * Usage:
 *   node verify-trial-lock.js
 */

const cases = [
  {
    name: "Case 1: Normal checkout (no referral)",
    request: {
      plan: "pro",
      billing_cycle: "monthly",
      // No referral_code
    },
    expected: {
      trial_period_days: null,
      coupon: null,
      reason: "Regular paid signup - user pays from day 1"
    }
  },
  {
    name: "Case 2: Checkout with valid referral code",
    request: {
      plan: "pro",
      billing_cycle: "monthly",
      referral_code: "VALID123" // Replace with actual valid code
    },
    expected: {
      trial_period_days: 14,
      coupon: "100% off first month",
      reason: "Valid referral code applied - 14-day trial + discount"
    }
  },
  {
    name: "Case 3: Checkout with invalid referral code",
    request: {
      plan: "pro",
      billing_cycle: "monthly",
      referral_code: "INVALID999"
    },
    expected: {
      status: 422,
      error: "Código de indicação inválido",
      reason: "Invalid referral code rejected"
    }
  }
];

console.log("\n════════════════════════════════════════════════════════");
console.log("  P0 TRIAL LOCK - Verification Test Cases");
console.log("════════════════════════════════════════════════════════\n");

cases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log("   ─────────────────────────────────────────────────────");
  console.log("   Request:");
  console.log("   ", JSON.stringify(testCase.request, null, 2).split('\n').join('\n    '));
  console.log("\n   Expected:");
  console.log("   ", JSON.stringify(testCase.expected, null, 2).split('\n').join('\n    '));
  console.log("\n   Verification Steps:");
  
  if (testCase.expected.trial_period_days !== undefined) {
    console.log(`   1. POST /api/v1/checkout/session with above payload`);
    console.log(`   2. Check response.checkout_url (should be Stripe URL)`);
    console.log(`   3. In Stripe Dashboard → Checkout Sessions:`);
    if (testCase.expected.trial_period_days === null) {
      console.log(`      • Verify subscription_data.trial_period_days is NOT set`);
      console.log(`      • Verify no discount/coupon applied`);
      console.log(`      • User should be charged immediately`);
    } else {
      console.log(`      • Verify subscription_data.trial_period_days = ${testCase.expected.trial_period_days}`);
      console.log(`      • Verify discount/coupon applied (100% off)`);
      console.log(`      • User should have ${testCase.expected.trial_period_days}-day free trial`);
    }
  } else {
    console.log(`   1. POST /api/v1/checkout/session with above payload`);
    console.log(`   2. Expect ${testCase.expected.status} error`);
    console.log(`   3. Error message: "${testCase.expected.error}"`);
    console.log(`   4. No checkout session should be created`);
  }
  
  console.log(`\n   Reason: ${testCase.expected.reason}`);
});

console.log("\n\n════════════════════════════════════════════════════════");
console.log("  Manual Testing Instructions");
console.log("════════════════════════════════════════════════════════\n");

console.log("1. Set up environment:");
console.log("   • Ensure STRIPE_SECRET_KEY is configured");
console.log("   • Ensure test price IDs are set in env");
console.log("   • Have a valid referral code ready (create via /api/v1/referrals/code)");
console.log("");
console.log("2. Test each case:");
console.log("   • Use curl, Postman, or HTTP client");
console.log("   • Send requests to /api/v1/checkout/session");
console.log("   • Verify responses match expected behavior");
console.log("");
console.log("3. Verify in Stripe Dashboard:");
console.log("   • Navigate to: Checkout > Sessions");
console.log("   • Find the created session");
console.log("   • Expand 'subscription_data' section");
console.log("   • Check trial_period_days value");
console.log("");
console.log("4. Security verification:");
console.log("   ✅ Cannot set trial_period_days via client");
console.log("   ✅ Cannot manipulate referralApplied flag");
console.log("   ✅ Referral validation is server-side");
console.log("   ✅ Default behavior is secure (no trial)");
console.log("");

console.log("\n════════════════════════════════════════════════════════");
console.log("  Example curl Commands");
console.log("════════════════════════════════════════════════════════\n");

console.log("# Case 1: Normal checkout (no trial expected)");
console.log(`curl -X POST http://localhost:3001/api/v1/checkout/session \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"plan":"pro","billing_cycle":"monthly"}'
`);

console.log("\n# Case 2: With valid referral (14-day trial expected)");
console.log(`curl -X POST http://localhost:3001/api/v1/checkout/session \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"plan":"pro","billing_cycle":"monthly","referral_code":"VALID123"}'
`);

console.log("\n# Case 3: With invalid referral (422 error expected)");
console.log(`curl -X POST http://localhost:3001/api/v1/checkout/session \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"plan":"pro","billing_cycle":"monthly","referral_code":"INVALID999"}'
`);

console.log("\n════════════════════════════════════════════════════════\n");
