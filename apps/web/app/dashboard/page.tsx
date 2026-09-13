"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getStoredUser, getMissingDocVersions } from "../../lib/auth-storage";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

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
    
    // Redirect to role-specific dashboard if role is available
    if (storedUser?.role === "PROFESSIONAL") {
      router.push("/dashboard/professor");
      return;
    }
    if (storedUser?.role === "STUDENT") {
      router.push("/dashboard/aluno");
      return;
    }
    
    setUser(storedUser);
    setLoading(false);
  }, [router]);

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
          <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            Dashboard
          </h2>
          <p className="max-w-md text-slate-600">
            Em breve você terá acesso a todas as funcionalidades da plataforma beOrigo.
          </p>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.clear();
              }
              router.push("/login");
            }}
            className="text-sm text-teal-700 hover:text-teal-900"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
