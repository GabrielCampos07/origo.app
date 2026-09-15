import type { ProgramExercise, WorkoutSessionStatus } from '@prisma/client';

export const LOW_ADHERENCE_THRESHOLD = 50;
export const PATIENT_NOTE_MAX_LENGTH = 2000;

/** Monday 00:00:00.000 UTC of the ISO week containing `now`. */
export function startOfIsoWeekUtc(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export function weeksAgoUtc(weeks: number, now = new Date()): Date {
  const start = startOfIsoWeekUtc(now);
  start.setUTCDate(start.getUTCDate() - weeks * 7);
  return start;
}

export function adherencePercent(completedThisWeek: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((completedThisWeek / target) * 100));
}

export function countCompletedThisWeek(
  sessions: Array<{ status: WorkoutSessionStatus | string; completedAt: Date | null }>,
  weekStart = startOfIsoWeekUtc()
): number {
  return sessions.filter(
    (session) =>
      session.status === 'COMPLETED' &&
      session.completedAt !== null &&
      session.completedAt >= weekStart
  ).length;
}

export type ExerciseMediaSource = 'catalog' | 'professional' | 'custom';

type CatalogFields = {
  catalogItemId?: string | null;
  catalogItem?: {
    videoUrl: string;
    thumbnailUrl: string | null;
    cuesPt: string | null;
  } | null;
};

type ProfessionalExerciseFields = {
  professionalExerciseId?: string | null;
  professionalExercise?: {
    videoUrl: string | null;
    photoUrls: string[];
    cuesPt: string | null;
  } | null;
};

export function serializeExercise(
  exercise: Pick<ProgramExercise, 'id' | 'orderIndex' | 'name' | 'sets' | 'reps' | 'notes' | 'precautions'> &
    CatalogFields &
    ProfessionalExerciseFields
) {
  const catalogItemId = exercise.catalogItemId ?? null;
  const professionalExerciseId = exercise.professionalExerciseId ?? null;
  const catalog = exercise.catalogItem ?? null;
  const pro = exercise.professionalExercise ?? null;

  let source: ExerciseMediaSource = 'custom';
  if (catalogItemId) {
    source = 'catalog';
  } else if (professionalExerciseId) {
    source = 'professional';
  }

  const photoUrls = pro?.photoUrls ?? [];
  const videoUrl = catalog?.videoUrl ?? pro?.videoUrl ?? null;
  const thumbnailUrl =
    catalog?.thumbnailUrl ?? (photoUrls.length > 0 ? photoUrls[0] : null);
  const cuesPt = catalog?.cuesPt ?? pro?.cuesPt ?? null;
  const rawNotes = exercise.notes?.trim() ? exercise.notes : null;
  // Avoid duplicating catalog/library cues as free-text notes in the student UI.
  const notes =
    rawNotes && cuesPt && rawNotes.trim() === cuesPt.trim() ? null : rawNotes;

  return {
    id: exercise.id,
    orderIndex: exercise.orderIndex,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    notes,
    precautions: exercise.precautions,
    catalogItemId,
    professionalExerciseId,
    videoUrl,
    thumbnailUrl,
    photoUrls,
    cuesPt,
    source,
  };
}

export function isPainLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10;
}

export function parseOptionalPainLevel(body: unknown): { ok: true; value: number | undefined } | { ok: false } {
  if (!body || typeof body !== 'object') {
    return { ok: true, value: undefined };
  }

  const raw = (body as { painLevel?: unknown; pain_level?: unknown }).painLevel
    ?? (body as { pain_level?: unknown }).pain_level;

  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: undefined };
  }

  const numeric = typeof raw === 'number' ? raw : Number(raw);
  if (!isPainLevel(numeric)) {
    return { ok: false };
  }

  return { ok: true, value: numeric };
}

export function parseOptionalPatientNote(
  body: unknown
): { ok: true; value: string | undefined } | { ok: false } {
  if (!body || typeof body !== 'object') {
    return { ok: true, value: undefined };
  }

  const raw = (body as { patientNote?: unknown; patient_note?: unknown }).patientNote
    ?? (body as { patient_note?: unknown }).patient_note;

  if (raw === undefined || raw === null) {
    return { ok: true, value: undefined };
  }

  if (typeof raw !== 'string') {
    return { ok: false };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: undefined };
  }

  if (trimmed.length > PATIENT_NOTE_MAX_LENGTH) {
    return { ok: false };
  }

  return { ok: true, value: trimmed };
}
