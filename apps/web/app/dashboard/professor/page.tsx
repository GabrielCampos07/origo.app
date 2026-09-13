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

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-teal-100">
            <svg
              className="h-12 w-12 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            Dashboard do Professor
          </h2>
          <p className="max-w-md text-slate-600">
            Bem-vindo ao painel do professor. Em breve você terá acesso a todas
            as funcionalidades para gerenciar suas turmas e atividades.
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
