"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { AdherenceMeter } from "@/components/professional/AdherenceMeter";
import { ProShell } from "@/components/professional/ProShell";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import {
  categoryLabel,
  formatDate,
  getProfessionalStudents,
  type StudentListItem,
} from "@/lib/professional";

export default function StudentsListPage() {
  const router = useRouter();
  const { loading: authLoading } = useProfessionalAuth();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getProfessionalStudents();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setStudents([]);
      } else {
        setError(null);
        setStudents(result.data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  return (
    <ProShell
      title="Alunos"
      subtitle="Vínculos ativos e adesão da semana."
      backHref="/dashboard/professor"
      backLabel="Voltar ao dashboard"
      actions={
        <button
          type="button"
          onClick={() => router.push("/alunos/convidar")}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Convidar aluno
        </button>
      }
    >
      {loading ? <p className="text-slate-600">Carregando alunos...</p> : null}

      {!loading && error ? (
        <div className="space-y-3">
          <Alert variant="error">{error}</Alert>
          <p className="text-sm text-slate-500">
            Se a API de HEP ainda não estiver no ar, esta lista ficará vazia até o endpoint
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">GET /api/v1/professional/students</code>
            responder.
          </p>
        </div>
      ) : null}

      {!loading && !error && students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <svg className="h-7 w-7 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Nenhum aluno ativo</h2>
          <p className="mb-4 text-sm text-slate-600">Convide um aluno para começar o programa HEP.</p>
          <Link
            href="/alunos/convidar"
            className="inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Gerar convite
          </Link>
        </div>
      ) : null}

      {!loading && students.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/alunos/${student.id}`}
                className="flex flex-col gap-4 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="truncate text-sm text-slate-500">{student.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {categoryLabel(student.category)}
                    {student.lastSessionAt ? ` · última sessão ${formatDate(student.lastSessionAt)}` : " · sem sessão ainda"}
                  </p>
                </div>
                <AdherenceMeter
                  compact
                  percent={student.adherencePercent}
                  completed={student.completedSessionsThisWeek}
                  target={student.targetSessionsPerWeek}
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </ProShell>
  );
}
