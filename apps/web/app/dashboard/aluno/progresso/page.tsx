"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/student/StatePanel";
import { formatDateTime, fetchProgress, type StudentProgress } from "@/lib/hep";

export default function AlunoProgressoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchProgress();
    if (!result.ok) {
      setError(result.message);
      setProgress(null);
    } else {
      setProgress(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingPanel label="Carregando seu progresso..." variant="detail" />;
  if (error) return <ErrorPanel message={error} onRetry={() => void load()} />;

  const cards = progress?.cards ?? [];
  const recent = progress?.recentSessions ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Progresso</h1>
        <p className="mt-1 text-slate-600">
          Adesão, sessões e dor (VAS) do seu HEP — atualizado quando você conclui uma sessão.
        </p>
      </section>

      {cards.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.title}
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              {card.hint ? <p className="mt-1 text-sm text-slate-500">{card.hint}</p> : null}
            </article>
          ))}
        </section>
      ) : (
        <EmptyPanel
          title="Ainda sem indicadores"
          body="Conclua uma sessão para ver adesão, meta semanal e o último registro de dor (VAS)."
        />
      )}

      {recent.length ? (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Sessões recentes</h2>
          <ul className="divide-y divide-slate-100">
            {recent.map((session) => (
              <li key={session.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <span className="text-sm text-slate-700">{formatDateTime(session.completedAt)}</span>
                <div className="sm:max-w-md sm:text-right">
                  <span className="text-sm text-slate-500">
                    {session.painLevel != null ? `VAS ${session.painLevel}/10` : "VAS não informado"}
                  </span>
                  {session.patientNote ? (
                    <p className="mt-1 text-sm text-slate-600">{session.patientNote}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
