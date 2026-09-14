"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { ChartTimeline } from "@/components/professional/ChartTimeline";
import { ProShell } from "@/components/professional/ProShell";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import {
  createStudentNote,
  getProfessionalStudent,
  getStudentChart,
  type ClinicalNote,
  type PainPoint,
} from "@/lib/professional";

export default function StudentChartPage() {
  const params = useParams();
  const studentId = typeof params.id === "string" ? params.id : "";
  const { loading: authLoading } = useProfessionalAuth();

  const [studentName, setStudentName] = useState("");
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [pain, setPain] = useState<PainPoint[]>([]);
  const [conduta, setConduta] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [informacoesPertinentes, setInformacoesPertinentes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !studentId) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const [studentResult, chartResult] = await Promise.all([
        getProfessionalStudent(studentId),
        getStudentChart(studentId),
      ]);
      if (cancelled) return;

      if (studentResult.ok) {
        setStudentName(studentResult.data.name);
      }

      if (!chartResult.ok) {
        setError(chartResult.message);
        setNotes([]);
        setPain([]);
      } else {
        setError(null);
        setNotes(chartResult.data.notes);
        setPain(chartResult.data.pain);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, studentId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!conduta.trim() || !evolucao.trim() || !informacoesPertinentes.trim()) {
      setFormError("Conduta, evolução e informações pertinentes são obrigatórias.");
      return;
    }

    setSaving(true);
    const result = await createStudentNote(studentId, {
      conduta: conduta.trim(),
      evolucao: evolucao.trim(),
      informacoesPertinentes: informacoesPertinentes.trim(),
    });
    setSaving(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setNotes((current) => [result.data, ...current]);
    setConduta("");
    setEvolucao("");
    setInformacoesPertinentes("");
    setSuccess("Nota registrada.");
  }

  return (
    <ProShell
      title="Prontuário mínimo"
      subtitle={
        studentName
          ? `Registro leve de ${studentName} — conduta, evolução e dor.`
          : "Linha do tempo de notas e dor relatada."
      }
      backHref={studentId ? `/alunos/${studentId}` : "/alunos"}
      backLabel="Voltar à ficha"
    >
      <p className="mb-6 text-xs text-slate-500">
        Registro clínico leve para continuidade entre consultas. Não substitui prontuário fisioterapêutico
        completo (COFFITO 414).
      </p>

      {loading ? <p className="mb-6 text-slate-600">Carregando prontuário...</p> : null}
      {!loading && error ? (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {!loading && !error ? <ChartTimeline notes={notes} pain={pain} /> : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-900">Nova nota</h2>
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Conduta *
          <textarea
            value={conduta}
            onChange={(event) => setConduta(event.target.value)}
            disabled={saving}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Evolução *
          <textarea
            value={evolucao}
            onChange={(event) => setEvolucao(event.target.value)}
            disabled={saving}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Informações pertinentes *
          <textarea
            value={informacoesPertinentes}
            onChange={(event) => setInformacoesPertinentes(event.target.value)}
            disabled={saving}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Registrar nota"}
        </button>
      </form>
    </ProShell>
  );
}
