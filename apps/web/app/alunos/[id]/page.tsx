"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { AdherenceMeter } from "@/components/professional/AdherenceMeter";
import { ProShell } from "@/components/professional/ProShell";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import {
  categoryLabel,
  formatDateTime,
  getProfessionalStudent,
  sessionStatusLabel,
  type StudentDetail,
} from "@/lib/professional";

export default function StudentFichaPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = typeof params.id === "string" ? params.id : "";
  const { loading: authLoading } = useProfessionalAuth();
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !studentId) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getProfessionalStudent(studentId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setDetail(null);
      } else {
        setError(null);
        setDetail(result.data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, studentId]);

  return (
    <ProShell
      title={detail?.name || "Ficha do aluno"}
      subtitle={detail ? `${detail.email} · ${categoryLabel(detail.category)}` : "Programa ativo, adesão e última sessão."}
      backHref="/alunos"
      backLabel="Voltar à lista"
      actions={
        detail ? (
          <>
            <button
              type="button"
              onClick={() => router.push(`/alunos/${studentId}/hep`)}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Editar HEP
            </button>
            <button
              type="button"
              onClick={() => router.push(`/alunos/${studentId}/prontuario`)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Prontuário
            </button>
          </>
        ) : null
      }
    >
      {loading ? <p className="text-slate-600">Carregando ficha...</p> : null}
      {!loading && error ? <Alert variant="error">{error}</Alert> : null}

      {!loading && detail ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="mb-2 text-sm font-medium text-slate-500">Adesão na semana</h2>
              <AdherenceMeter
                percent={detail.adherencePercent}
                completed={detail.completedSessionsThisWeek}
                target={detail.targetSessionsPerWeek || detail.program?.targetSessionsPerWeek}
              />
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="mb-2 text-sm font-medium text-slate-500">Última sessão</h2>
              {detail.lastSession ? (
                <div className="text-sm text-slate-800">
                  <p className="font-medium">{sessionStatusLabel(detail.lastSession.status)}</p>
                  <p className="text-slate-600">
                    {formatDateTime(detail.lastSession.completedAt || detail.lastSession.startedAt)}
                  </p>
                  {detail.lastSession.painLevel !== null ? (
                    <p className="mt-1 text-slate-600">Dor: {detail.lastSession.painLevel}/10</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma sessão registrada.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Programa ativo</h2>
              {detail.program ? (
                <Link href={`/alunos/${studentId}/hep`} className="text-sm text-teal-700 hover:text-teal-900">
                  Editar
                </Link>
              ) : null}
            </div>
            {detail.program ? (
              <div>
                <p className="font-medium text-slate-900">{detail.program.title}</p>
                <p className="text-sm text-slate-600">
                  {detail.program.phaseLabel ? `Fase: ${detail.program.phaseLabel} · ` : null}
                  Meta: {detail.program.targetSessionsPerWeek} sessões/semana · {detail.program.exercises.length} exercícios
                </p>
                {detail.program.exercises.length > 0 ? (
                  <ol className="mt-3 space-y-2">
                    {detail.program.exercises.map((exercise) => (
                      <li key={exercise.id || exercise.orderIndex} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-900">{exercise.name || "Exercício"}</span>
                        {exercise.sets || exercise.reps ? (
                          <span className="text-slate-600">
                            {" "}
                            · {exercise.sets || "—"} séries · {exercise.reps || "—"} reps
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Nenhum exercício neste programa.</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500">
                  Este aluno ainda não tem um programa HEP ativo.
                </p>
                <Link
                  href={`/alunos/${studentId}/hep`}
                  className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
                >
                  Criar programa
                </Link>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </ProShell>
  );
}
