"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAccessToken, getStoredUser, type OrigoUserRole } from "../../../../lib/auth-storage";
import {
  getReferralCode,
  getReferralStatus,
  formatCurrency,
  type ReferralCode,
  type ReferralStatus,
} from "../../../../lib/referral";
import { handleApiError } from "../../../../lib/api";

export default function ReferralDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role?: OrigoUserRole } | null>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      // SEC: Require auth + PROFESSIONAL role (fail-closed)
      const token = getAccessToken();
      if (!token) {
        router.push("/login?redirect=/dashboard/professor/indicacao");
        return;
      }

      const storedUser = getStoredUser();

      // SEC: Only PROFESSIONAL role can access referral program (fail-closed)
      if (storedUser?.role !== "PROFESSIONAL") {
        router.push("/dashboard");
        return;
      }

      setUser(storedUser);

      // Load referral code and status
      const [codeResult, statusResult] = await Promise.all([
        getReferralCode(),
        getReferralStatus(),
      ]);

      if (!codeResult.ok) {
        handleApiError(codeResult);
        setError(codeResult.message || "Erro ao carregar código de indicação");
      } else {
        setReferralCode(codeResult.data);
      }

      if (!statusResult.ok) {
        handleApiError(statusResult);
        // Don't block page load if status fails
      } else {
        setReferralStatus(statusResult.data);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/checkout?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-green-50)]">
        <div className="text-[var(--color-ink-600)]">Carregando...</div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
            >
              Dashboard
            </Link>
            <span className="text-sm text-[var(--color-ink-600)]">{user?.email}</span>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-20 py-12 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--brand-primary)] hover:underline"
            >
              ← Voltar
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-ink-900)] mb-2">
            Programa de indicação
          </h1>
          <p className="text-[var(--color-ink-600)]">
            Compartilhe seu link e ganhe 15% de comissão recorrente para cada profissional que assinar.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Referral code card */}
        {referralCode && (
          <div className="mb-8 bg-gradient-to-br from-[#e5f0e8] to-[#f0f5ed] rounded-2xl border-2 border-[var(--brand-primary)]/40 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 md:w-64 md:h-64 opacity-30">
              <Image
                src="/assets/referral-illustration-1.png"
                alt=""
                fill
                className="object-contain"
                aria-hidden
              />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                <span>Seu código</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--brand-primary)]/30 p-4 font-mono text-2xl md:text-3xl font-bold text-[var(--color-ink-900)] text-center tracking-wider">
                    {referralCode.code}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-white border border-[var(--brand-primary)] text-[var(--brand-primary)] font-medium hover:bg-[#f5f5f0] transition-colors"
                  >
                    {copied ? "✓ Copiado!" : "Copiar código"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[#7da890] transition-colors"
                  >
                    Copiar link
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-[var(--brand-primary)]/20 p-3">
                  <p className="text-[var(--color-ink-600)] text-xs mb-1">Para o indicado</p>
                  <p className="font-semibold text-[var(--color-ink-900)]">14 dias grátis</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-[var(--brand-primary)]/20 p-3">
                  <p className="text-[var(--color-ink-600)] text-xs mb-1">Para você</p>
                  <p className="font-semibold text-[var(--color-ink-900)]">15% recorrente</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-[var(--brand-primary)]/20 p-3">
                  <p className="text-[var(--color-ink-600)] text-xs mb-1">No período grátis</p>
                  <p className="font-semibold text-[var(--color-ink-900)]">0% comissão</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        {referralStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-[#d1e5d9] p-6 shadow-sm">
              <p className="text-sm text-[var(--color-ink-600)] mb-2">Total indicados</p>
              <p className="text-3xl font-bold text-[var(--color-ink-900)]">
                {referralStatus.referrals.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#d1e5d9] p-6 shadow-sm">
              <p className="text-sm text-[var(--color-ink-600)] mb-2">Assinantes ativos</p>
              <p className="text-3xl font-bold text-[var(--brand-primary)]">
                {referralStatus.referrals.filter(r => r.status === "ACTIVE").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#d1e5d9] p-6 shadow-sm">
              <p className="text-sm text-[var(--color-ink-600)] mb-2">Comissões pagas</p>
              <p className="text-3xl font-bold text-[var(--color-ink-900)]">
                {formatCurrency(referralStatus.total_payouts_cents)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#d1e5d9] p-6 shadow-sm">
              <p className="text-sm text-[var(--color-ink-600)] mb-2">Comissões</p>
              <p className="text-3xl font-bold text-[var(--color-ink-900)]">
                {referralStatus.payouts.length}
              </p>
            </div>
          </div>
        )}

        {/* Referred users list */}
        <div className="bg-white rounded-2xl border border-[#d1e5d9] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-ink-900)] mb-6">
            Seus indicados
          </h2>

          {referralStatus && referralStatus.referrals.length > 0 ? (
            <div className="space-y-3">
              {referralStatus.referrals.map((referral) => {
                const referralPayouts = referralStatus.payouts.filter(p => p.referral_id === referral.referred_user_id);
                const totalEarned = referralPayouts.reduce((sum, p) => sum + p.amount_cents, 0);
                
                return (
                  <div
                    key={referral.referred_user_id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#d1e5d9] hover:border-[var(--brand-primary)]/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[var(--color-ink-900)] mb-1">
                        ID: {referral.referred_user_id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-[var(--color-ink-600)]">
                        Inscrito em {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {referral.free_month_ends_at && (
                        <p className="text-xs text-[var(--color-ink-500)]">
                          Período grátis até {new Date(referral.free_month_ends_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-[var(--color-ink-600)] mb-1">Comissão gerada</p>
                        <p className="font-semibold text-[var(--color-ink-900)]">
                          {formatCurrency(totalEarned)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            referral.status === "ACTIVE"
                              ? "bg-[#e5f0e8] text-[var(--brand-primary)]"
                              : referral.status === "PENDING"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {referral.status === "ACTIVE"
                            ? "Ativo"
                            : referral.status === "PENDING"
                              ? "Pendente"
                              : referral.status === "COMPLETED"
                                ? "Completo"
                                : "Cancelado"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#e5f0e8] flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-[var(--brand-primary)]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-ink-900)] mb-2">
                Nenhum indicado ainda
              </h3>
              <p className="text-[var(--color-ink-600)] mb-4 max-w-md mx-auto">
                Compartilhe seu link com outros profissionais para começar a ganhar comissões.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-5 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[#7da890] transition-colors"
              >
                Copiar link de indicação
              </button>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-8 bg-[#f0f5ed] rounded-xl border border-[#d1e5d9] p-6">
          <h3 className="text-base font-semibold text-[var(--color-ink-900)] mb-3">
            Como funciona o programa de indicação
          </h3>
          <ul className="space-y-2 text-sm text-[var(--color-ink-600)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand-primary)] mt-0.5">•</span>
              <span>
                Compartilhe seu link ou código com outros profissionais de saúde e educação física
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand-primary)] mt-0.5">•</span>
              <span>Quando eles assinarem usando seu código, ganham 14 dias grátis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand-primary)] mt-0.5">•</span>
              <span>
                Após o período gratuito, você recebe 15% de comissão recorrente enquanto a
                assinatura estiver ativa
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--brand-primary)] mt-0.5">•</span>
              <span>
                Comissões são calculadas sobre o valor efetivamente cobrado em cada ciclo de
                cobrança
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-[var(--color-ink-500)]">
            <Link
              href="/termos-saas#indicacao"
              className="underline hover:text-[var(--brand-primary)]"
            >
              Ver termos completos do programa
            </Link>
            {" · "}
            Dúvidas? Entre em contato:{" "}
            <a
              href="mailto:contact@beorigo.app"
              className="underline hover:text-[var(--brand-primary)]"
            >
              contact@beorigo.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
