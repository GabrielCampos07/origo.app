type Props = {
  percent: number;
  completed?: number;
  target?: number;
  compact?: boolean;
};

function tone(percent: number) {
  if (percent >= 80) return { bar: "bg-teal-600", text: "text-teal-800", chip: "bg-teal-50 text-teal-800" };
  if (percent >= 50) return { bar: "bg-amber-500", text: "text-amber-800", chip: "bg-amber-50 text-amber-800" };
  return { bar: "bg-rose-500", text: "text-rose-800", chip: "bg-rose-50 text-rose-800" };
}

export function AdherenceMeter({ percent, completed, target, compact }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const colors = tone(clamped);

  return (
    <div className={compact ? "min-w-[8rem]" : "w-full"}>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className={`font-medium ${colors.text}`}>{clamped}%</span>
        {completed !== undefined && target !== undefined ? (
          <span className={`rounded-full px-2 py-0.5 text-xs ${colors.chip}`}>
            {completed}/{target} sessões
          </span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
