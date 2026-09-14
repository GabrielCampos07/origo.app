"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useProfessionalAuth } from "@/lib/use-professional-auth";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ProShell({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  actions,
  children,
}: Props) {
  const { loading, user, handleLogout } = useProfessionalAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
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
              Professor
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/alunos" className="text-teal-700 hover:text-teal-900">
              Alunos
            </Link>
            <span className="text-slate-600">{user?.email}</span>
            <button type="button" onClick={handleLogout} className="text-slate-500 hover:text-slate-800">
              Sair
            </button>
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
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-slate-600">Carregando...</div>
    </div>
  );
}
