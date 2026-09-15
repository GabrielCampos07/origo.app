/**
 * Daily motivational phrases for the patient/student home (local date, PT-BR).
 */

const PHRASES = [
  "Cada repetição conta — vá no seu ritmo.",
  "Seu corpo agradece a constância de hoje.",
  "Respire. Um exercício de cada vez.",
  "Pequenos passos também são progresso.",
  "Hoje é um bom dia para cuidar de você.",
  "A continuidade entre as sessões faz a diferença.",
  "Faça o que puder hoje — isso já vale.",
  "Movimento com atenção é o melhor remédio caseiro.",
] as const;

function dayOfYearLocal(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDailyMotivationPhrase(date: Date = new Date()): string {
  const index = dayOfYearLocal(date) % PHRASES.length;
  return PHRASES[index]!;
}
