import { formatDate, formatDateTime, type ClinicalNote, type PainPoint } from "@/lib/professional";

type Props = {
  notes: ClinicalNote[];
  pain: PainPoint[];
};

type TimelineItem =
  | { kind: "note"; at: string; note: ClinicalNote }
  | { kind: "pain"; at: string; point: PainPoint };

function painColor(level: number) {
  if (level <= 3) return "#0f766e";
  if (level <= 6) return "#d97706";
  return "#e11d48";
}

export function ChartTimeline({ notes, pain }: Props) {
  const sortedPain = [...pain]
    .filter((point) => point.completedAt)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const items: TimelineItem[] = [
    ...notes.map((note) => ({ kind: "note" as const, at: note.createdAt, note })),
    ...pain.map((point) => ({ kind: "pain" as const, at: point.completedAt, point })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const width = 640;
  const height = 180;
  const padX = 28;
  const padY = 24;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Dor relatada (VAS 0–10)</h3>
        {sortedPain.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda não há registros de dor nas sessões.</p>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Gráfico de dor ao longo do tempo">
            {[0, 5, 10].map((tick) => {
              const y = padY + ((10 - tick) / 10) * (height - padY * 2);
              return (
                <g key={tick}>
                  <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" />
                  <text x={8} y={y + 4} fontSize="10" fill="#64748b">
                    {tick}
                  </text>
                </g>
              );
            })}
            {sortedPain.length > 1 ? (
              <polyline
                fill="none"
                stroke="#0f766e"
                strokeWidth="2"
                points={sortedPain
                  .map((point, index) => {
                    const x =
                      padX +
                      (sortedPain.length === 1 ? (width - padX * 2) / 2 : (index / (sortedPain.length - 1)) * (width - padX * 2));
                    const y = padY + ((10 - point.painLevel) / 10) * (height - padY * 2);
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            ) : null}
            {sortedPain.map((point, index) => {
              const x =
                padX +
                (sortedPain.length === 1 ? (width - padX * 2) / 2 : (index / (sortedPain.length - 1)) * (width - padX * 2));
              const y = padY + ((10 - point.painLevel) / 10) * (height - padY * 2);
              return (
                <g key={`${point.sessionId}-${index}`}>
                  <circle cx={x} cy={y} r="5" fill={painColor(point.painLevel)} />
                  <text x={x} y={height - 6} textAnchor="middle" fontSize="9" fill="#64748b">
                    {formatDate(point.completedAt)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-700">Linha do tempo</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma nota ou sessão com dor registrada ainda.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, index) =>
              item.kind === "pain" ? (
                <li
                  key={`pain-${item.point.sessionId}-${index}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Dor (VAS)</span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.at)}</span>
                  </div>
                  <p className="text-slate-900">
                    Nível <strong>{item.point.painLevel}</strong>/10
                  </p>
                </li>
              ) : (
                <li key={`note-${item.note.id}-${index}`} className="rounded-lg border border-teal-100 bg-teal-50/40 px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-teal-800">Nota clínica</span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.at)}</span>
                  </div>
                  {item.note.conduta ? (
                    <p className="text-sm text-slate-800">
                      <span className="font-medium text-slate-600">Conduta: </span>
                      {item.note.conduta}
                    </p>
                  ) : null}
                  {item.note.evolucao ? (
                    <p className="text-sm text-slate-800">
                      <span className="font-medium text-slate-600">Evolução: </span>
                      {item.note.evolucao}
                    </p>
                  ) : null}
                  {item.note.informacoesPertinentes ? (
                    <p className="text-sm text-slate-800">
                      <span className="font-medium text-slate-600">Infos pertinentes: </span>
                      {item.note.informacoesPertinentes}
                    </p>
                  ) : null}
                </li>
              )
            )}
          </ol>
        )}
      </div>
    </div>
  );
}
