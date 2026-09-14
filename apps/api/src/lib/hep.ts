import type { ProgramExercise, WorkoutSessionStatus } from '@prisma/client';

export const LOW_ADHERENCE_THRESHOLD = 50;

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

export function serializeExercise(exercise: Pick<ProgramExercise, 'id' | 'orderIndex' | 'name' | 'sets' | 'reps' | 'notes' | 'precautions'>) {
  return {
    id: exercise.id,
    orderIndex: exercise.orderIndex,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    notes: exercise.notes,
    precautions: exercise.precautions,
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
