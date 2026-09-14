type Props = {
  compact?: boolean;
};

export function HealthDisclaimer({ compact = false }: Props) {
  return (
    <aside
      role="note"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Aviso de saúde
      </p>
      <p className={`mt-1 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
        Este é o HEP prescrito pelo seu profissional — ferramenta de acompanhamento, não substitui
        consulta, diagnóstico ou tratamento. Em dor intensa, tontura ou mal-estar, interrompa e
        avise seu profissional. A escala VAS (0–10) registra como você se sente ao final da sessão.
      </p>
    </aside>
  );
}
