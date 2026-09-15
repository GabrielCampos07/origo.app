"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/student/StatePanel";
import { ExerciseRow } from "@/components/student/ExerciseRow";
import { HealthDisclaimer } from "@/components/student/HealthDisclaimer";
import {
  completeSessionExercise,
  fetchStudentProgram,
  startOrResumeSession,
  type ProgramExercise,
  type WorkoutSession,
} from "@/lib/hep";

export default function AlunoSessaoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, number>>({});
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const programResult = await fetchStudentProgram();
    if (programResult.ok && programResult.data) {
      setExercises(programResult.data.exercises);
    }

    const sessionResult = await startOrResumeSession();
    if (!sessionResult.ok) {
      setError(
        sessionResult.kind === "network" || sessionResult.status === 404
          ? sessionResult.message
          : "Não foi possível abrir a sessão. Volte e tente de novo."
      );
      setLoading(false);
      return;
    }

    const opened = sessionResult.data;
    if (opened.exercises.length) {
      setExercises(opened.exercises);
    }
    setSession(opened);
    setCompletedIds(opened.completedExerciseIds);
    setSetsByExercise(
      Object.fromEntries(
        opened.exerciseLogs
          .filter((log) => log.setsCompleted != null)
          .map((log) => [log.exerciseId, log.setsCompleted as number])
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const doneCount = useMemo(() => {
    return exercises.filter((exercise) => exercise.id && completedIds.includes(exercise.id)).length;
  }, [exercises, completedIds]);

  function handleToggleSet(exerciseId: string, setIndex: number) {
    setSetsByExercise((prev) => {
      const current = prev[exerciseId] ?? 0;
      const next = setIndex + 1;
      return { ...prev, [exerciseId]: current === next ? setIndex : next };
    });
  }

  async function handleCompleteExercise(exercise: ProgramExercise) {
    if (!session || !exercise.id) return;
    setActionError(null);
    setPendingExerciseId(exercise.id);
    const setsCompleted =
      setsByExercise[exercise.id] ?? (exercise.sets && exercise.sets > 0 ? exercise.sets : undefined);
    const result = await completeSessionExercise(session.id, exercise.id, setsCompleted);
    setPendingExerciseId(null);
    if (!result.ok) {
      setActionError(
        result.kind === "network"
          ? result.message
          : "Não foi possível marcar o exercício. Tente novamente."
      );
      return;
    }
    if ("completedExerciseIds" in result.data && Array.isArray(result.data.completedExerciseIds)) {
      setCompletedIds(result.data.completedExerciseIds);
    } else {
      setCompletedIds((prev) => (prev.includes(exercise.id) ? prev : [...prev, exercise.id]));
    }
  }

  function handleFinish() {
    if (!session) return;
    router.push(`/dashboard/aluno/sessao/feedback?session=${encodeURIComponent(session.id)}`);
  }

  if (loading) return <LoadingPanel label="Preparando sua sessão..." variant="session" />;
  if (error) return <ErrorPanel message={error} onRetry={() => void load()} />;

  if (!session) {
    return (
      <EmptyPanel
        title="Sessão indisponível"
        body="Não encontramos uma sessão ativa. Volte para Hoje e toque em Começar sessão."
      />
    );
  }

  const pending = exercises.length - doneCount;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Sessão</h1>
        <p className="mt-1 text-slate-600">
          Marque as séries e conclua cada exercício. Ao finalizar, você pode informar a dor (VAS 0–10)
          ou pular.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {doneCount} de {exercises.length}{" "}
          {exercises.length === 1 ? "exercício concluído" : "exercícios concluídos"}
        </p>
        {exercises.length > 0 ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-[width]"
              style={{ width: `${Math.round((doneCount / exercises.length) * 100)}%` }}
            />
          </div>
        ) : null}
      </section>

      <HealthDisclaimer />

      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      <section className="space-y-3">
        {exercises.length ? (
          exercises.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id || `ex-${index}`}
              exercise={exercise}
              index={index}
              interactive
              completed={Boolean(exercise.id && completedIds.includes(exercise.id))}
              setsChecked={exercise.id ? setsByExercise[exercise.id] ?? 0 : 0}
              completing={pendingExerciseId === exercise.id}
              onToggleSet={(setIndex) => exercise.id && handleToggleSet(exercise.id, setIndex)}
              onComplete={() => void handleCompleteExercise(exercise)}
            />
          ))
        ) : (
          <EmptyPanel
            title="Sem exercícios nesta sessão"
            body="O programa ativo não tem exercícios para executar. Fale com seu profissional."
          />
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        {pending > 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            Ainda há {pending} {pending === 1 ? "exercício pendente" : "exercícios pendentes"}. Você
            pode finalizar mesmo assim.
          </p>
        ) : (
          <p className="mb-3 text-sm text-teal-800">Todos os exercícios foram marcados.</p>
        )}
        <button
          type="button"
          onClick={handleFinish}
          className="w-full rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Finalizar sessão
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/aluno")}
          className="mt-3 w-full text-sm text-slate-600 hover:text-slate-900"
        >
          Voltar para Hoje
        </button>
      </section>
    </div>
  );
}
