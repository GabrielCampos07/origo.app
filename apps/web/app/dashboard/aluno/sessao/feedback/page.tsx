"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { EmptyPanel, LoadingPanel } from "@/components/student/StatePanel";
import { HealthDisclaimer } from "@/components/student/HealthDisclaimer";
import { VasPicker } from "@/components/student/VasPicker";
import { completeSession, getStoredActiveSessionId } from "@/lib/hep";

const PATIENT_NOTE_MAX = 2000;

export default function AlunoFeedbackPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Carregando feedback..." variant="session" />}>
      <AlunoFeedbackForm />
    </Suspense>
  );
}

function AlunoFeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? getStoredActiveSessionId();

  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [patientNote, setPatientNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(nextPain?: number | null) {
    if (!sessionId) return;
    setError(null);
    setSubmitting(true);
    const result = await completeSession(sessionId, {
      ...(nextPain == null ? {} : { painLevel: nextPain }),
      ...(patientNote.trim() ? { patientNote: patientNote.trim() } : {}),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(
        result.kind === "network"
          ? result.message
          : "Não foi possível concluir a sessão. Tente novamente."
      );
      return;
    }
    setDone(true);
    router.push("/dashboard/aluno/progresso");
  }

  if (!sessionId) {
    return (
      <EmptyPanel
        title="Sessão não encontrada"
        body="Volte para Hoje e inicie ou continue uma sessão antes de registrar o feedback."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Como você está?</h1>
        <p className="mt-1 text-slate-600">
          Registre a dor agora (VAS 0–10) e, se quiser, uma nota curta. Seu profissional usa isso
          para ajustar o HEP.
        </p>

        <div className="mt-6">
          <VasPicker value={painLevel} onChange={setPainLevel} disabled={submitting || done} />
        </div>

        <label className="mt-6 flex flex-col gap-1.5 text-sm text-slate-700">
          Nota para o profissional (opcional)
          <textarea
            value={patientNote}
            onChange={(event) => setPatientNote(event.target.value.slice(0, PATIENT_NOTE_MAX))}
            disabled={submitting || done}
            rows={3}
            maxLength={PATIENT_NOTE_MAX}
            placeholder="Ex.: Dor leve ao subir escadas; mais fácil que ontem."
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50"
          />
          <span className="text-xs text-slate-500">
            {patientNote.length}/{PATIENT_NOTE_MAX}
          </span>
        </label>

        {error ? (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <button
          type="button"
          disabled={submitting || done || painLevel == null}
          onClick={() => void submit(painLevel)}
          className="mt-6 w-full rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Salvando…" : "Enviar e concluir"}
        </button>
        <button
          type="button"
          disabled={submitting || done}
          onClick={() => void submit(null)}
          className="mt-3 w-full text-sm text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed"
        >
          Pular VAS e concluir{patientNote.trim() ? " (com nota)" : ""}
        </button>
      </section>

      <HealthDisclaimer compact />
    </div>
  );
}
