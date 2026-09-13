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

    // Role mismatch: redirect to correct dashboard
    if (storedUser.role === "PROFESSIONAL") {
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

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-12 w-12 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            Dashboard do Aluno
          </h2>
          <p className="max-w-md text-slate-600">
            Bem-vindo ao seu painel de estudos. Em breve você terá acesso às suas
            turmas, atividades e materiais de estudo.
          </p>
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
