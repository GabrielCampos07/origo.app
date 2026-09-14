"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/student/StatePanel";
import { ExerciseRow } from "@/components/student/ExerciseRow";
import {
  fetchStudentProgram,
  startOrResumeSession,
  type StudentProgram,
} from "@/lib/hep";

export default function AlunoProgramaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<StudentProgram | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchStudentProgram();
    if (!result.ok) {
      setError(result.message);
      setProgram(null);
    } else {
      setProgram(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStart() {
    setStarting(true);
    const result = await startOrResumeSession();
    setStarting(false);
    if (!result.ok) {
      setError(
        result.kind === "network"
          ? result.message
          : "Não foi possível iniciar a sessão. Tente novamente."
      );
      return;
    }
    router.push(`/dashboard/aluno/sessao?session=${encodeURIComponent(result.data.id)}`);
  }

  if (loading) return <LoadingPanel label="Carregando seu programa..." />;
  if (error && !program) return <ErrorPanel message={error} onRetry={() => void load()} />;

  if (!program) {
    return (
      <EmptyPanel
        title="Nenhum programa ativo"
        body="Quando seu profissional publicar o HEP, a lista ordenada de exercícios aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-800">Programa HEP</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{program.title}</h1>
        {program.phaseLabel ? (
          <p className="mt-1 text-slate-600">{program.phaseLabel}</p>
        ) : null}
        {program.professionalName ? (
          <p className="mt-2 text-sm text-slate-500">
            Prescrito por <span className="font-medium text-slate-700">{program.professionalName}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {program.targetSessionsPerWeek != null ? (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-800">
              Meta: {program.targetSessionsPerWeek}{" "}
              {program.targetSessionsPerWeek === 1 ? "sessão" : "sessões"}/semana
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {program.exercises.length}{" "}
            {program.exercises.length === 1 ? "exercício" : "exercícios"}
          </span>
        </div>
        <button
          type="button"
          disabled={starting}
          onClick={() => void handleStart()}
          className="mt-6 rounded-lg bg-teal-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {starting ? "Abrindo sessão…" : program.activeSessionId ? "Continuar sessão" : "Começar sessão"}
        </button>
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => void load()} /> : null}

      <section className="space-y-3">
        {program.exercises.length ? (
          program.exercises.map((exercise, index) => (
            <ExerciseRow key={exercise.id || `ex-${index}`} exercise={exercise} index={index} />
          ))
        ) : (
          <EmptyPanel
            title="Programa sem exercícios"
            body="O HEP está ativo, mas ainda não há itens na lista. Fale com seu profissional."
          />
        )}
      </section>
    </div>
  );
}
