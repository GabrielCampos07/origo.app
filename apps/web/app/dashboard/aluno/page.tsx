"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getStoredUser, clearAuthSession, getMissingDocVersions } from "@/lib/auth-storage";

export default function AlunoDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Check for missing docs - redirect to legal accept if any
    const missingDocs = getMissingDocVersions();
    if (missingDocs && missingDocs.length > 0) {
      router.push("/legal/accept");
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }

    // P2 SEC (FRONTEND SECURITY CHECKER): Fail-closed - allowlist STUDENT only
    // PROFESSIONAL/unknown roles must not see student dashboard CTAs
    if (storedUser.role !== "STUDENT") {
      router.push("/dashboard/professor");
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
            <span className="inline-block mt-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Aluno
            </span>
          </div>
          <span className="text-sm text-slate-600">{user?.email}</span>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            Dashboard do Aluno
          </h2>
          <p className="text-slate-600">
            Bem-vindo ao seu painel de estudos. Acompanhe suas sessões e atividades.
          </p>
        </div>

        {/* Começar sessão CTA */}
        <div className="mb-6 rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 mx-auto">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900">Sessão de hoje</h3>
          <p className="mb-4 text-slate-600">
            Inicie sua sessão quando estiver pronto. Seu profissional preparou atividades para você.
          </p>
          <button
            disabled
            className="rounded-lg bg-teal-600 px-8 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            Começar sessão
          </button>
          <p className="mt-3 text-xs text-slate-500">Em breve - Aguarde liberação</p>
        </div>

        {/* Seus profissionais - Empty state */}
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Seus profissionais</h3>
          <div className="text-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mx-auto">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-3-3h-1m-2.663-3.118a4.001 4.001 0 010-5.764M12 18a3 3 0 100-6 3 3 0 000 6z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-base font-medium text-slate-900">Profissionais vinculados</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Você está vinculado aos profissionais que te convidaram. Em breve você verá a lista completa aqui.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <button
            onClick={handleLogout}
            className="text-sm text-teal-700 hover:text-teal-900"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
