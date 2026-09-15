"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShellSkeleton } from "@/components/ui/Skeleton";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import { roleLabels } from "@/lib/role-labels";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Override category for copy; defaults to stored user category. */
  category?: string | null;
};

export function ProShell({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  actions,
  children,
  category,
}: Props) {
  const { loading, user, handleLogout } = useProfessionalAuth();
  const labels = roleLabels(category ?? user?.category);

  if (loading) {
    return <ShellSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard/professor" className="text-2xl font-bold text-slate-900">
              beOrigo
            </Link>
            <span className="ml-2 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              {labels.professionalBadge}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/alunos" className="text-teal-700 hover:text-teal-900">
              {labels.rosterTitle}
            </Link>
            <LogoutButton email={user?.email} onLogout={handleLogout} />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
          {backHref ? (
            <Link href={backHref} className="mb-4 inline-block text-sm text-teal-700 hover:text-teal-900">
              ← {backLabel}
            </Link>
          ) : null}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export function ProLoading() {
  return <ShellSkeleton />;
}
