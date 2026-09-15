/**
 * Category-aware copy for HEP/dashboard UIs.
 * Fisioterapia → Paciente + Fisioterapeuta
 * Educação Física → Aluno + Professor / Profissional EF
 */

export type RoleLabels = {
  studentSingular: string;
  studentPlural: string;
  professionalSingular: string;
  professionalShort: string;
  rosterTitle: string;
  inviteCta: string;
  emptyRosterTitle: string;
  emptyRosterBody: string;
  studentBadge: string;
  professionalBadge: string;
  fichaFallback: string;
  noProgramBody: string;
};

const FISIO: RoleLabels = {
  studentSingular: "paciente",
  studentPlural: "pacientes",
  professionalSingular: "fisioterapeuta",
  professionalShort: "Fisioterapeuta",
  rosterTitle: "Pacientes",
  inviteCta: "Convidar paciente",
  emptyRosterTitle: "Nenhum paciente ativo",
  emptyRosterBody: "Convide um paciente para começar o programa HEP.",
  studentBadge: "Paciente",
  professionalBadge: "Fisioterapeuta",
  fichaFallback: "Ficha do paciente",
  noProgramBody: "Este paciente ainda não tem um programa HEP ativo.",
};

const EDUCACAO: RoleLabels = {
  studentSingular: "aluno",
  studentPlural: "alunos",
  professionalSingular: "profissional de educação física",
  professionalShort: "Professor",
  rosterTitle: "Alunos",
  inviteCta: "Convidar aluno",
  emptyRosterTitle: "Nenhum aluno ativo",
  emptyRosterBody: "Convide um aluno para começar o programa HEP.",
  studentBadge: "Aluno",
  professionalBadge: "Professor",
  fichaFallback: "Ficha do aluno",
  noProgramBody: "Este aluno ainda não tem um programa HEP ativo.",
};

const DEFAULT: RoleLabels = {
  studentSingular: "aluno",
  studentPlural: "alunos",
  professionalSingular: "profissional",
  professionalShort: "Professor",
  rosterTitle: "Alunos",
  inviteCta: "Convidar aluno",
  emptyRosterTitle: "Nenhum aluno ativo",
  emptyRosterBody: "Convide um aluno para começar o programa HEP.",
  studentBadge: "Aluno",
  professionalBadge: "Professor",
  fichaFallback: "Ficha do aluno",
  noProgramBody: "Este aluno ainda não tem um programa HEP ativo.",
};

export function roleLabels(category?: string | null): RoleLabels {
  switch (category) {
    case "FISIOTERAPIA":
      return FISIO;
    case "EDUCACAO_FISICA":
      return EDUCACAO;
    default:
      return DEFAULT;
  }
}

/** Pick a single category when a roster mixes types (prefer majority). */
export function dominantCategory(categories: Array<string | null | undefined>): string | null {
  const counts = new Map<string, number>();
  for (const raw of categories) {
    const key = (raw || "").trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
