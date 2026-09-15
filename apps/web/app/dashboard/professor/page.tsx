"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { LogoutButton } from "@/components/ui/LogoutButton";
import {
  getAccessToken,
  getStoredUser,
  clearAuthSession,
  getMissingDocVersions,
  patchStoredUser,
} from "@/lib/auth-storage";
import { getProfessionalDashboard, getProfessionalStudents, type DashboardStats } from "@/lib/professional";
import { dominantCategory, roleLabels } from "@/lib/role-labels";

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role?: string; category?: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

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

    // P1 SEC (FRONTEND SECURITY CHECKER): Fail-closed - allowlist PROFESSIONAL only
    if (storedUser.role !== "PROFESSIONAL") {
      router.push("/dashboard/aluno");
      return;
    }

    setUser(storedUser);
    setLoading(false);

    void Promise.all([getProfessionalDashboard(), getProfessionalStudents()]).then(
      ([dashResult, studentsResult]) => {
        if (dashResult.ok) setStats(dashResult.data);
        if (studentsResult.ok) {
          const category =
            storedUser.category || dominantCategory(studentsResult.data.map((s) => s.category));
          if (category && category !== storedUser.category) {
            const next = patchStoredUser({ category });
            if (next) setUser(next);
          }
        }
        setStatsLoading(false);
      }
    );
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const labels = roleLabels(user?.category);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">beOrigo</h1>
            <span className="inline-block mt-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              {labels.professionalBadge}
            </span>
          </div>
          <LogoutButton email={user?.email} onLogout={handleLogout} />
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            Dashboard do {labels.professionalShort}
          </h2>
          <p className="text-slate-600">
            Bem-vindo ao seu painel. Gerencie {labels.studentPlural}, sessões e planos.
          </p>
        </div>

        {statsLoading ? (
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 h-3 w-24 animate-pulse rounded bg-slate-200/80" />
                <div className="h-8 w-16 animate-pulse rounded bg-slate-200/80" />
              </div>
            ))}
          </div>
        ) : null}

        {!statsLoading && stats ? (
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {labels.rosterTitle} ativos
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.activeStudents}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Adesão média</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {Math.round(stats.averageAdherencePercent)}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sessões na semana</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.sessionsThisWeek}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Abaixo da meta</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.studentsBelowAdherence}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <button
            onClick={() => router.push("/alunos/convidar")}
            className="flex flex-col items-start rounded-lg border border-teal-200 bg-teal-50 p-6 text-left transition-colors hover:bg-teal-100"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">{labels.inviteCta}</h3>
            <p className="text-sm text-slate-600">
              Crie um link de convite para seu {labels.studentSingular}.
            </p>
          </button>

          <button
            onClick={() => router.push("/alunos")}
            className="flex flex-col items-start rounded-lg border border-teal-200 bg-teal-50 p-6 text-left transition-colors hover:bg-teal-100"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">HEP</h3>
            <p className="text-sm text-slate-600">
              {labels.rosterTitle}, programas e adesão.
            </p>
          </button>

          <button
            onClick={() => router.push("/checkout")}
            className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-6 text-left transition-colors hover:bg-slate-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Planos</h3>
            <p className="text-sm text-slate-600">Assine ou gerencie sua assinatura.</p>
          </button>

          <button
            onClick={() => router.push("/dashboard/professor/indicacao")}
            className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-6 text-left transition-colors hover:bg-slate-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Indicação</h3>
            <p className="text-sm text-slate-600">Compartilhe e ganhe benefícios.</p>
          </button>
        </div>

      </div>
    </div>
  );
}
