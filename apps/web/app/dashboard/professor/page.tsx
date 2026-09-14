"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getStoredUser, clearAuthSession, getMissingDocVersions } from "@/lib/auth-storage";

export default function ProfessorDashboardPage() {
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

    // Role mismatch: redirect to correct dashboard
    if (storedUser.role === "STUDENT") {
      router.push("/dashboard/aluno");
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
            <span className="inline-block mt-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              Professor
            </span>
          </div>
          <span className="text-sm text-slate-600">{user?.email}</span>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            Dashboard do Professor
          </h2>
          <p className="text-slate-600">
            Bem-vindo ao seu painel. Convide alunos e gerencie seu plano.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push("/alunos/convidar")}
            className="flex flex-col items-start rounded-lg border border-teal-200 bg-teal-50 p-6 text-left transition-colors hover:bg-teal-100"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Convidar aluno</h3>
            <p className="text-sm text-slate-600">Crie um link de convite para seu aluno.</p>
          </button>

          <button
            onClick={() => router.push("/checkout")}
            className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-6 text-left transition-colors hover:bg-slate-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Ver planos</h3>
            <p className="text-sm text-slate-600">Assine ou gerencie sua assinatura.</p>
          </button>
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
