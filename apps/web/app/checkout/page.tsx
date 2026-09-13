"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAccessToken, getStoredUser } from "../../lib/auth-storage";
import { validateReferralCode, type CouponValidation } from "../../lib/referral";
import { handleApiError } from "../../lib/api";

type PlanId = "start" | "pro" | "clinic";

type Plan = {
  id: PlanId;
  name: string;
  price_monthly: number;
  price_annual: number;
  description: string;
  features: string[];
  cta: string;
};

const PLANS: Record<PlanId, Plan> = {
  start: {
    id: "start",
    name: "Start",
    price_monthly: 49.0,
    price_annual: 470.4,
    description: "Para quem está começando",
    features: [
      "Até 15 alunos ativos",
      "HEP ilimitado",
      "Relatório de adesão",
      "Registro clínico mínimo",
    ],
    cta: "Começar trial de 14 dias",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price_monthly: 79.0,
    price_annual: 758.4,
    description: "Para atendimento consolidado",
    features: [
      "Alunos ilimitados",
      "HEP ilimitado",
      "Relatório de adesão avançado",
      "Registro clínico leve / mínimo",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
  },
  clinic: {
    id: "clinic",
    name: "Clinic",
    price_monthly: 149.0,
    price_annual: 1430.4,
    description: "Para equipes e clínicas",
    features: [
      "Até 3 seats (profissionais)",
      "Alunos ilimitados",
      "Dashboard de gestão",
      "Suporte dedicado",
    ],
    cta: "Assinar Clinic",
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [referralCode, setReferralCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [showCouponField, setShowCouponField] = useState(false);

  useEffect(() => {
    // SEC: Require auth + PROFESSIONAL role for checkout (fail-closed)
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }
    
    const storedUser = getStoredUser();
    
    // SEC: Only PROFESSIONAL role can access checkout (fail-closed)
    if (storedUser?.role !== "PROFESSIONAL") {
      router.push("/dashboard");
      return;
    }
    
    setUser(storedUser);
    
    // SEC: Validate plan query param (whitelist only)
    const planParam = searchParams.get("plan");
    if (planParam && ["start", "pro", "clinic"].includes(planParam)) {
      setSelectedPlan(planParam as PlanId);
    }
    
    // Read referral code from URL if present (e.g. ?ref=CODE or ?coupon=CODE)
    const refParam = searchParams.get("ref") || searchParams.get("coupon");
    if (refParam) {
      setReferralCode(refParam);
      setShowCouponField(true);
    }
    
    setLoading(false);
  }, [router, searchParams]);

  const handleValidateCoupon = async () => {
    if (!referralCode.trim()) {
      setCouponError("");
      setCouponValidation(null);
      return;
    }
    
    setValidatingCoupon(true);
    setCouponError("");
    
    const result = await validateReferralCode(referralCode);
    
    if (result.ok) {
      if (result.data.valid) {
        setCouponValidation(result.data);
        setCouponError("");
      } else {
        setCouponValidation(null);
        setCouponError("Cupom inválido ou expirado");
      }
    } else {
      setCouponValidation(null);
      handleApiError(result); // SEC: Handles legal 403 redirect
      setCouponError(result.message || "Erro ao validar cupom");
    }
    
    setValidatingCoupon(false);
  };

  const handleCheckout = async () => {
    // Backend checkout session endpoint not yet implemented
    // When ready, POST to /api/v1/checkout/session with:
    // { plan: selectedPlan, billing_cycle: billingCycle, referral_code?: referralCode }
    // Backend returns Stripe session URL → redirect
    
    // For now, show clear message that checkout is coming soon
    return;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-green-50)]">
        <div className="text-[var(--color-ink-600)]">Carregando...</div>
      </div>
    );
  }

  const plan = PLANS[selectedPlan];
  const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_annual;
  const finalPrice = couponValidation?.valid ? 0 : price;

  return (
    <div className="min-h-screen bg-[var(--color-green-50)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-green-50)]/95 backdrop-blur-md border-b border-[#d1e5d9]/40">
        <div className="flex items-center justify-between px-5 md:px-20 py-3 md:py-5">
          <Link href="/home" className="relative h-11 w-[160px] sm:h-14 sm:w-[200px] shrink-0">
            <Image
              src="/assets/logo-lockup.png"
              alt="beOrigo"
              fill
              className="object-contain object-left"
            />
          </Link>
          <span className="text-sm text-[var(--color-ink-600)]">{user?.email}</span>
        </div>
      </header>

      <div className="px-6 md:px-20 py-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-ink-900)] mb-2">
            Finalize sua assinatura
          </h1>
          <p className="text-[var(--color-ink-600)]">
            Escolha seu plano e período de cobrança
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan selection */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-900)] mb-4">
                Selecione seu plano
              </h2>
              <div className="space-y-3">
                {(Object.keys(PLANS) as PlanId[]).map((planId) => {
                  const p = PLANS[planId];
                  const isSelected = selectedPlan === planId;
                  return (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      className={`w-full text-left rounded-xl p-5 border-2 transition-all ${
                        isSelected
                          ? "border-[var(--brand-primary)] bg-[#e5f0e8]"
                          : "border-[#d1e5d9] bg-white hover:border-[#a8c4b3]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-[var(--color-ink-900)] mb-1">
                            {p.name}
                          </h3>
                          <p className="text-sm text-[var(--color-ink-600)] mb-3">
                            {p.description}
                          </p>
                          <ul className="space-y-1.5">
                            {p.features.slice(0, 3).map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-[var(--color-ink-600)]"
                              >
                                <span className="text-[var(--brand-primary)] mt-0.5">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[var(--color-ink-900)]">
                            R$ {billingCycle === "monthly" ? p.price_monthly : p.price_annual}
                          </div>
                          <div className="text-sm text-[var(--color-ink-600)]">
                            /{billingCycle === "monthly" ? "mês" : "ano"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-900)] mb-4">
                Período de cobrança
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 rounded-xl py-3 px-4 border-2 font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "border-[var(--brand-primary)] bg-[#e5f0e8] text-[var(--color-ink-900)]"
                      : "border-[#d1e5d9] bg-white text-[var(--color-ink-600)] hover:border-[#a8c4b3]"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`flex-1 rounded-xl py-3 px-4 border-2 font-medium transition-all ${
                    billingCycle === "annual"
                      ? "border-[var(--brand-primary)] bg-[#e5f0e8] text-[var(--color-ink-900)]"
                      : "border-[#d1e5d9] bg-white text-[var(--color-ink-600)] hover:border-[#a8c4b3]"
                  }`}
                >
                  Anual
                  <span className="block text-xs mt-0.5">Economize ~20%</span>
                </button>
              </div>
            </div>

            {/* Referral coupon field */}
            <div>
              {!showCouponField ? (
                <button
                  type="button"
                  onClick={() => setShowCouponField(true)}
                  className="text-sm text-[var(--brand-primary)] hover:underline font-medium"
                >
                  Tem um cupom de indicação?
                </button>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[var(--color-ink-900)]">
                    Cupom de indicação
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        setCouponError("");
                        setCouponValidation(null);
                      }}
                      onBlur={handleValidateCoupon}
                      placeholder="Digite o código"
                      className="flex-1 rounded-lg border border-[#d1e5d9] px-4 py-2.5 text-[var(--color-ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !referralCode.trim()}
                      className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white font-medium hover:bg-[#7da890] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {validatingCoupon ? "..." : "Validar"}
                    </button>
                  </div>
                  
                  {couponValidation?.valid && (
                    <div className="rounded-lg bg-[#e5f0e8] border border-[var(--brand-primary)]/30 p-3">
                      <p className="text-sm font-medium text-[var(--brand-primary)] mb-1">
                        ✓ Cupom válido!
                      </p>
                      <p className="text-sm text-[var(--color-ink-600)]">
                        {couponValidation.discount_description}
                      </p>
                      {couponValidation.referrer_email_prefix && (
                        <p className="text-xs text-[var(--color-ink-500)] mt-1">
                          Indicado por: {couponValidation.referrer_email_prefix}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                  
                  <p className="text-xs text-[var(--color-ink-500)]">
                    Com cupom de indicação: <strong>1 mês grátis</strong>. Seu indicador receberá
                    15% de comissão recorrente após o período gratuito.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-[#d1e5d9] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--color-ink-900)] mb-4">
                Resumo do pedido
              </h2>
              
              <div className="space-y-3 pb-4 border-b border-[#d1e5d9]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-ink-600)]">Plano</span>
                  <span className="font-medium text-[var(--color-ink-900)]">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-ink-600)]">Cobrança</span>
                  <span className="font-medium text-[var(--color-ink-900)]">
                    {billingCycle === "monthly" ? "Mensal" : "Anual"}
                  </span>
                </div>
                {couponValidation?.valid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--brand-primary)] font-medium">Desconto</span>
                    <span className="text-[var(--brand-primary)] font-medium">
                      1 mês grátis
                    </span>
                  </div>
                )}
              </div>
              
              <div className="py-4 space-y-2">
                {couponValidation?.valid && (
                  <div className="flex justify-between text-sm text-[var(--color-ink-500)] line-through">
                    <span>Subtotal</span>
                    <span>R$ {price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-medium text-[var(--color-ink-600)]">
                    Total {couponValidation?.valid ? "(1º mês)" : ""}
                  </span>
                  <span className="text-2xl font-bold text-[var(--color-ink-900)]">
                    R$ {finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleCheckout}
                disabled
                className="w-full mt-4 py-3.5 rounded-xl bg-[#c7dbcc] text-[var(--color-ink-600)] font-semibold cursor-not-allowed transition-colors"
              >
                Pagamento em breve
              </button>
              
              <p className="text-xs text-[var(--color-ink-500)] mt-4 text-center leading-relaxed">
                14 dias de teste grátis. Cancele quando quiser.{" "}
                <Link href="/termos-saas" className="underline hover:text-[var(--brand-primary)]">
                  Termos
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="underline hover:text-[var(--brand-primary)]">
                  Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
