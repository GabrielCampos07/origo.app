const VAS_HINT: Record<number, string> = {
  0: "Sem dor",
  1: "Mínima",
  2: "Mínima",
  3: "Leve",
  4: "Leve",
  5: "Moderada",
  6: "Moderada",
  7: "Forte",
  8: "Forte",
  9: "Intensa",
  10: "Intensa",
};

function tone(value: number): string {
  if (value <= 3) return "border-teal-600 bg-teal-600 text-white";
  if (value <= 6) return "border-amber-500 bg-amber-500 text-white";
  return "border-red-600 bg-red-600 text-white";
}

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function VasPicker({ value, onChange, disabled }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>0 · sem dor</span>
        <span>10 · dor máxima</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Dor VAS de 0 a 10">
        {Array.from({ length: 11 }, (_, score) => {
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(score)}
              className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                selected
                  ? tone(score)
                  : "border-slate-300 bg-white text-slate-800 hover:border-teal-500"
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>
      {value != null ? (
        <p className="mt-3 text-sm text-slate-600">
          Selecionado: <span className="font-semibold text-slate-900">{value}</span>
          {VAS_HINT[value] ? ` · ${VAS_HINT[value]}` : null}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Toque um número para registrar, ou pule se preferir.</p>
      )}
    </div>
  );
}
