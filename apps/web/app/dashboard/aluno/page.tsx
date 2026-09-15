"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/student/StatePanel";
import { ExerciseRow } from "@/components/student/ExerciseRow";
import { HealthDisclaimer } from "@/components/student/HealthDisclaimer";
import {
  fetchStudentProgram,
  fetchTodaySummary,
  startOrResumeSession,
  type StudentProgram,
  type TodaySummary,
} from "@/lib/hep";
import { getDailyMotivationPhrase } from "@/lib/student-motivation";

export default function AlunoHojePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [program, setProgram] = useState<StudentProgram | null>(null);
  const [summary, setSummary] = useState<TodaySummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const programResult = await fetchStudentProgram();
    if (!programResult.ok) {
      setProgram(null);
      setSummary(null);
      setError(programResult.message);
      setLoading(false);
      return;
    }

    const loadedProgram = programResult.data;
    setProgram(loadedProgram);

    const summaryResult = await fetchTodaySummary(loadedProgram);
    if (summaryResult.ok) {
      setSummary(summaryResult.data);
    } else {
      setError(summaryResult.message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStart() {
    setStartError(null);
    setStarting(true);
    const result = await startOrResumeSession();
    setStarting(false);
    if (!result.ok) {
      setStartError(
        result.kind === "network"
          ? result.message
          : "Não foi possível iniciar a sessão. Tente novamente."
      );
      return;
    }
    router.push(`/dashboard/aluno/sessao?session=${encodeURIComponent(result.data.id)}`);
  }

  if (loading) return <LoadingPanel label="Carregando seu dia..." />;

  const hasProgram = Boolean(
    program || summary?.programId || summary?.programTitle || (summary?.exercises.length ?? 0) > 0
  );
  const exercises = summary?.exercises?.length ? summary.exercises : program?.exercises ?? [];
  const weeklyGoal = summary?.weeklyGoal ?? program?.targetSessionsPerWeek;
  const sessionsThisWeek = summary?.sessionsThisWeek ?? program?.sessionsThisWeek;
  const adherence = summary?.adherencePercent ?? program?.adherencePercent;
  const activeSessionId = summary?.activeSessionId ?? program?.activeSessionId;
  const weekDone =
    weeklyGoal != null &&
    sessionsThisWeek != null &&
    sessionsThisWeek >= weeklyGoal;
  const title = summary?.programTitle ?? program?.title ?? "Seu programa";
  const phase = summary?.phaseLabel ?? program?.phaseLabel;
  const professional = summary?.professionalName ?? program?.professionalName;
  const motivation = getDailyMotivationPhrase();

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Hoje</h1>
        <p className="mt-2 text-sm text-teal-800/80">{motivation}</p>
        <p className="mt-2 text-slate-600">
          {hasProgram
            ? "Seu profissional preparou o que fazer hoje. Complete a sessão e registre como se sentiu."
            : "Quando seu profissional publicar o HEP, os exercícios do dia aparecem aqui."}
        </p>
        {professional ? (
          <p className="mt-3 text-sm text-slate-500">
            Profissional: <span className="font-medium text-slate-700">{professional}</span>
          </p>
        ) : null}
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => void load()} /> : null}

      {hasProgram ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Programa"
            value={title}
            hint={phase ?? "HEP ativo"}
          />
          <SummaryCard
            label="Meta semanal"
            value={
              weeklyGoal != null
                ? `${sessionsThisWeek ?? 0} / ${weeklyGoal}`
                : sessionsThisWeek != null
                  ? String(sessionsThisWeek)
                  : "—"
            }
            hint="Sessões nesta semana"
          />
          <SummaryCard
            label="Adesão"
            value={adherence != null ? `${Math.round(adherence)}%` : "—"}
            hint="Meta da semana"
          />
        </section>
      ) : null}

      <section className="rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-600">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <h2 className="mb-2 text-xl font-semibold text-slate-900">Sessão de hoje</h2>
        <p className="mb-4 text-slate-600">
          {activeSessionId
            ? "Você tem uma sessão em andamento. Continue de onde parou."
            : weekDone
              ? "Você já atingiu a meta semanal. Pode fazer outra sessão se o profissional pediu."
              : "Inicie quando estiver pronto. Marque os exercícios e, ao final, a dor (VAS) é opcional."}
        </p>
        {startError ? (
          <div className="mx-auto mb-4 max-w-md">
            <Alert variant="error">{startError}</Alert>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!hasProgram || starting}
          onClick={() => void handleStart()}
          className="rounded-lg bg-teal-600 px-8 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {starting
            ? "Abrindo sessão…"
            : activeSessionId
              ? "Continuar sessão"
              : "Começar sessão"}
        </button>
        {!hasProgram ? (
          <p className="mt-3 text-xs text-slate-500">Aguardando o profissional publicar o programa.</p>
        ) : null}
      </section>

      <HealthDisclaimer compact />

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Exercícios do dia</h2>
          <button
            type="button"
            onClick={() => router.push("/dashboard/aluno/programa")}
            className="text-sm text-teal-700 hover:text-teal-900"
          >
            Ver programa
          </button>
        </div>
        {exercises.length ? (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.id || `ex-${index}`}
                exercise={exercise}
                index={index}
                completed={exercise.completedInCurrentSession}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel
            title={hasProgram ? "Nenhum exercício listado" : "Sem programa ativo"}
            body={
              hasProgram
                ? "O programa existe, mas ainda não há exercícios. Fale com seu profissional."
                : "Seu profissional ainda não publicou um HEP. Os exercícios do dia aparecem aqui."
            }
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
