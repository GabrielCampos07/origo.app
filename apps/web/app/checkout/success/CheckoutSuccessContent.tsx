"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAccessToken, getStoredUser } from "../../../lib/auth-storage";

export default function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // SEC: Soft auth check - redirect to login if not authenticated
    // (User might have been logged out during Stripe flow)
    const token = getAccessToken();
    if (!token) {
      router.push("/login?redirect=/checkout/success");
      return;
    }

    const storedUser = getStoredUser();
    setUser(storedUser);

    // Extract session_id from query params
    // SEC NOTE (FRONTEND SECURITY CHECKER):
    // - session_id is DISPLAY-ONLY (not used for authorization)
    // - Subscription activation is handled server-side via Stripe webhook
    // - No client-side Stripe API calls with secrets
    const sessionIdParam = searchParams.get("session_id");
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }

    setLoading(false);
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-green-50)]">
        <div className="text-[var(--color-ink-600)]">Carregando...</div>
      </div>
    );
  }

  // Truncate session_id for display (show first 8 + last 4 chars)
  const truncatedSessionId = sessionId
    ? sessionId.length > 20
      ? `${sessionId.substring(0, 12)}...${sessionId.substring(sessionId.length - 4)}`
      : sessionId
    : null;

  // Determine dashboard link based on role
  const dashboardLink =
    user?.role === "PROFESSIONAL" ? "/dashboard/professor" : "/dashboard";

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
          {user?.email && (
            <span className="text-sm text-[var(--color-ink-600)]">{user.email}</span>
          )}
        </div>
      </header>

      {/* Success Content */}
      <div className="px-6 md:px-20 py-12 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#d1e5d9] p-8 md:p-12 shadow-sm text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-[#e5f0e8] rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-[var(--brand-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-ink-900)] mb-3">
            Pagamento confirmado!
          </h1>
          
          <p className="text-lg text-[var(--color-ink-600)] mb-2">
            Sua assinatura está sendo processada.
          </p>

          <p className="text-base text-[var(--color-ink-500)] mb-8">
            Você receberá um e-mail de confirmação em breve. Seu período de teste de 14 dias já está ativo.
          </p>

          {/* Session ID (optional display for support reference) */}
          {truncatedSessionId && (
            <div className="mb-8 p-4 bg-[var(--color-green-50)] rounded-lg border border-[#d1e5d9]">
              <p className="text-xs text-[var(--color-ink-500)] mb-1">
                ID da sessão (para suporte)
              </p>
              <p className="text-sm font-mono text-[var(--color-ink-600)]">
                {truncatedSessionId}
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={dashboardLink}
              className="inline-block px-8 py-3.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold hover:bg-[#7da890] transition-colors"
            >
              Ir para o Dashboard
            </Link>
            <Link
              href="/home"
              className="inline-block px-8 py-3.5 rounded-xl border-2 border-[#d1e5d9] bg-white text-[var(--color-ink-900)] font-semibold hover:border-[#a8c4b3] transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-sm text-[var(--color-ink-500)] mt-8">
            Dúvidas? Entre em contato com nosso{" "}
            <Link href="/suporte" className="text-[var(--brand-primary)] hover:underline">
              suporte
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
