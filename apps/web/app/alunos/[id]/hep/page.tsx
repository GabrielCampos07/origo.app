"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { ProShell } from "@/components/professional/ProShell";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import {
  createProfessionalProgram,
  getProfessionalStudent,
  updateProfessionalProgram,
  type ProgramExercise,
} from "@/lib/professional";

type DraftExercise = ProgramExercise & { clientKey: string };

function nextKey() {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function HepEditorPage() {
  const params = useParams();
  const studentId = typeof params.id === "string" ? params.id : "";
  const { loading: authLoading } = useProfessionalAuth();

  const [programId, setProgramId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [title, setTitle] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [targetSessionsPerWeek, setTargetSessionsPerWeek] = useState("3");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !studentId) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getProfessionalStudent(studentId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setStudentName(result.data.name);
      const program = result.data.program;
      if (!program) {
        setProgramId(null);
        setTitle("Programa HEP");
        setPhaseLabel("");
        setTargetSessionsPerWeek("3");
        setExercises([]);
        setError(null);
        setLoading(false);
        return;
      }
      setProgramId(program.id);
      setTitle(program.title);
      setPhaseLabel(program.phaseLabel);
      setTargetSessionsPerWeek(String(program.targetSessionsPerWeek || 3));
      setExercises(
        program.exercises.map((exercise) => ({
          ...exercise,
          clientKey: exercise.id || nextKey(),
        }))
      );
      setError(null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, studentId]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  function updateExercise(clientKey: string, patch: Partial<DraftExercise>) {
    setExercises((current) => current.map((exercise) => (exercise.clientKey === clientKey ? { ...exercise, ...patch } : exercise)));
  }

  function addExercise() {
    setExercises((current) => [
      ...current,
      {
        clientKey: nextKey(),
        id: "",
        orderIndex: current.length,
        name: "",
        sets: "",
        reps: "",
        notes: "",
        precautions: "",
        hasLogs: false,
      },
    ]);
  }

  function removeExercise(exercise: DraftExercise) {
    setSuccess(null);
    if (exercise.hasLogs) {
      setError("Este exercício já tem sessão registrada e não pode ser removido. Ajuste o texto ou as séries, mas mantenha o item.");
      return;
    }
    setError(null);
    setExercises((current) => current.filter((item) => item.clientKey !== exercise.clientKey));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const target = Number(targetSessionsPerWeek);
    if (!title.trim()) {
      setError("Informe o título do programa.");
      return;
    }
    if (!Number.isInteger(target) || target < 1 || target > 14) {
      setError("A meta semanal deve ser um número inteiro entre 1 e 14.");
      return;
    }
    if (exercises.some((exercise) => !exercise.name.trim())) {
      setError("Todo exercício precisa de um nome.");
      return;
    }

    const parsedExercises: Array<{
      id?: string;
      orderIndex: number;
      name: string;
      sets: number;
      reps: string;
      notes: string;
      precautions: string;
    }> = [];

    for (const [index, exercise] of exercises.entries()) {
      const sets = Number(exercise.sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 50) {
        setError(`Séries do exercício ${index + 1} deve ser um número inteiro entre 1 e 50.`);
        return;
      }
      if (!exercise.reps.trim()) {
        setError(`Informe as repetições do exercício ${index + 1}.`);
        return;
      }
      parsedExercises.push({
        id: exercise.id || undefined,
        orderIndex: index,
        name: exercise.name.trim(),
        sets,
        reps: exercise.reps.trim(),
        notes: exercise.notes.trim(),
        precautions: exercise.precautions.trim(),
      });
    }

    const payload = {
      title: title.trim(),
      phaseLabel: phaseLabel.trim(),
      targetSessionsPerWeek: target,
      exercises: parsedExercises,
    };

    const existingProgramId = programId;
    setSaving(true);
    const result = existingProgramId
      ? await updateProfessionalProgram(existingProgramId, payload)
      : await createProfessionalProgram(studentId, payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      if (existingProgramId && /sessão registrada/i.test(result.message)) {
        const reload = await getProfessionalStudent(studentId);
        if (reload.ok && reload.data.program) {
          setExercises(
            reload.data.program.exercises.map((exercise) => ({
              ...exercise,
              clientKey: exercise.id || nextKey(),
            }))
          );
        }
      }
      return;
    }

    setProgramId(result.data.id);
    setTitle(result.data.title);
    setPhaseLabel(result.data.phaseLabel);
    setTargetSessionsPerWeek(String(result.data.targetSessionsPerWeek));
    setExercises(
      result.data.exercises.map((exercise) => ({
        ...exercise,
        clientKey: exercise.id || nextKey(),
      }))
    );
    setSuccess(
      existingProgramId
        ? "Programa salvo. O aluno verá as mudanças no próximo acesso."
        : "Programa criado. O aluno já pode executar as sessões."
    );
  }

  return (
    <ProShell
      title="Editar HEP"
      subtitle={
        studentName
          ? programId
            ? `Programa de ${studentName}`
            : `Criar o primeiro programa de ${studentName}`
          : "Título, fase, meta semanal e exercícios em texto livre."
      }
      backHref={studentId ? `/alunos/${studentId}` : "/alunos"}
      backLabel="Voltar à ficha"
    >
      {loading ? <p className="text-slate-600">Carregando programa...</p> : null}

      {!loading ? (
        <form onSubmit={onSubmit} className="space-y-6">
          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Fase
              <input
                value={phaseLabel}
                onChange={(event) => setPhaseLabel(event.target.value)}
                disabled={saving}
                placeholder="Ex.: Fortalecimento"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Sessões por semana
              <input
                type="number"
                min={1}
                max={14}
                value={targetSessionsPerWeek}
                onChange={(event) => setTargetSessionsPerWeek(event.target.value)}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Exercícios</h2>
              <button
                type="button"
                onClick={addExercise}
                disabled={saving}
                className="text-sm font-medium text-teal-700 hover:text-teal-900 disabled:text-slate-400"
              >
                + Adicionar
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Exercícios com sessão já registrada não podem ser apagados — a API recusa o hard-delete para preservar o histórico.
            </p>

            {exercises.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                Nenhum exercício. Adicione o primeiro em texto livre.
              </p>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <fieldset
                    key={exercise.clientKey}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <legend className="px-1 text-sm font-medium text-slate-700">
                      Exercício {index + 1}
                      {exercise.hasLogs ? (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-normal text-amber-800">
                          com histórico
                        </span>
                      ) : null}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                        Nome
                        <input
                          value={exercise.name}
                          onChange={(event) => updateExercise(exercise.clientKey, { name: event.target.value })}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        Séries
                        <input
                          value={exercise.sets}
                          onChange={(event) => updateExercise(exercise.clientKey, { sets: event.target.value })}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        Repetições
                        <input
                          value={exercise.reps}
                          onChange={(event) => updateExercise(exercise.clientKey, { reps: event.target.value })}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                        Notas
                        <textarea
                          value={exercise.notes}
                          onChange={(event) => updateExercise(exercise.clientKey, { notes: event.target.value })}
                          disabled={saving}
                          rows={2}
                          className="rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                        Precauções
                        <textarea
                          value={exercise.precautions}
                          onChange={(event) => updateExercise(exercise.clientKey, { precautions: event.target.value })}
                          disabled={saving}
                          rows={2}
                          className="rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                    </div>
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise)}
                        disabled={saving}
                        className="text-sm text-rose-700 hover:text-rose-900 disabled:text-slate-400"
                      >
                        Remover
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={saving || !canSave}
            className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando…" : programId ? "Salvar programa" : "Criar programa"}
          </button>
        </form>
      ) : null}
    </ProShell>
  );
}
