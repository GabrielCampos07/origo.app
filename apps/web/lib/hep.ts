/**
 * Student HEP client — Slice 2–3 contract.
 *
 * Endpoints (STUDENT, own data only; backend enforces AuthZ):
 * - GET  /api/v1/me/program
 * - GET  /api/v1/me/today-summary
 * - POST /api/v1/me/sessions
 * - POST /api/v1/me/sessions/:sessionId/exercises/:exerciseId/complete
 * - POST /api/v1/me/sessions/:sessionId/complete  { painLevel?: 0-10 }
 * - GET  /api/v1/me/progress
 *
 * Backend sibling owns the API. This client accepts both snake_case and
 * camelCase and unwraps common `{ program | session | data }` envelopes.
 */

import { apiGet, apiPostAuth, handleApiError, type ApiResult } from "./api";

const ACTIVE_SESSION_KEY = "origo_active_session_id";

export type ProgramExercise = {
  id: string;
  orderIndex: number;
  name: string;
  sets: number | null;
  reps: string | null;
  notes: string | null;
  precautions: string | null;
  completedInCurrentSession: boolean;
};

export type StudentProgram = {
  id: string;
  title: string;
  phaseLabel: string | null;
  status: string;
  targetSessionsPerWeek: number | null;
  exercises: ProgramExercise[];
  professionalName: string | null;
  adherencePercent: number | null;
  sessionsThisWeek: number | null;
  sessionCompletedToday: boolean;
  activeSessionId: string | null;
};

export type TodaySummary = {
  programId: string | null;
  programTitle: string | null;
  phaseLabel: string | null;
  professionalName: string | null;
  exercises: ProgramExercise[];
  weeklyGoal: number | null;
  sessionsThisWeek: number | null;
  adherencePercent: number | null;
  sessionCompletedToday: boolean;
  activeSessionId: string | null;
  activeSessionStatus: string | null;
};

export type ExerciseLog = {
  exerciseId: string;
  setsCompleted: number | null;
  completedAt: string | null;
};

export type WorkoutSession = {
  id: string;
  programId: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  painLevel: number | null;
  completedExerciseIds: string[];
  exerciseLogs: ExerciseLog[];
  exercises: ProgramExercise[];
};

export type ProgressCard = {
  id: string;
  title: string;
  value: string;
  hint?: string;
};

export type RecentSession = {
  id: string;
  completedAt: string | null;
  painLevel: number | null;
};

export type StudentProgress = {
  cards: ProgressCard[];
  adherencePercent: number | null;
  sessionsThisWeek: number | null;
  targetSessionsPerWeek: number | null;
  sessionsCompletedTotal: number | null;
  lastPainLevel: number | null;
  recentSessions: RecentSession[];
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function pick(obj: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined) return obj[key];
  }
  return undefined;
}

function unwrap(payload: unknown, ...keys: string[]): unknown {
  if (!isRecord(payload)) return payload;
  for (const key of keys) {
    if (key in payload && payload[key] != null) return payload[key];
  }
  return payload;
}

export function normalizeExercise(raw: unknown, fallbackIndex = 0): ProgramExercise | null {
  if (!isRecord(raw)) return null;
  const id = asString(pick(raw, "id", "exerciseId", "exercise_id", "programExerciseId", "program_exercise_id"));
  const name = asString(pick(raw, "name", "title", "exerciseName", "exercise_name")) ?? "Exercício";
  return {
    id: id ?? "",
    orderIndex: asNumber(pick(raw, "orderIndex", "order_index", "order")) ?? fallbackIndex,
    name,
    sets: asNumber(pick(raw, "sets", "targetSets", "target_sets")),
    reps: asString(pick(raw, "reps", "repetitions", "targetReps", "target_reps")),
    notes: asString(pick(raw, "notes", "description", "instructions")),
    precautions: asString(pick(raw, "precautions", "cautions", "warnings")),
    completedInCurrentSession:
      asBoolean(
        pick(raw, "completedInCurrentSession", "completed_in_current_session", "completed")
      ) ?? false,
  };
}

function normalizeExerciseList(raw: unknown): ProgramExercise[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : [];
  return list
    .map((item, index) => normalizeExercise(item, index))
    .filter((item): item is ProgramExercise => item !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

function professionalNameFrom(raw: JsonRecord): string | null {
  const nested = pick(raw, "professional", "professionalProfile", "professional_profile", "enrollment");
  if (isRecord(nested)) {
    return (
      asString(pick(nested, "professionalName", "professional_name", "name", "fullName", "full_name"))
    );
  }
  return asString(pick(raw, "professionalName", "professional_name"));
}

export function normalizeProgram(raw: unknown): StudentProgram | null {
  const program = unwrap(raw, "program", "data", "activeProgram", "active_program");
  if (!isRecord(program)) return null;
  const id = asString(pick(program, "id", "programId", "program_id"));
  if (!id) return null;

  const exercises = normalizeExerciseList(
    pick(program, "exercises", "programExercises", "program_exercises", "items")
  );

  return {
    id,
    title: asString(pick(program, "title", "name")) ?? "Programa HEP",
    phaseLabel: asString(pick(program, "phaseLabel", "phase_label", "phase")),
    status: asString(pick(program, "status")) ?? "ACTIVE",
    targetSessionsPerWeek: asNumber(
      pick(program, "targetSessionsPerWeek", "target_sessions_per_week", "weeklyGoal", "weekly_goal")
    ),
    exercises,
    professionalName: professionalNameFrom(program) ?? (isRecord(raw) ? professionalNameFrom(raw) : null),
    adherencePercent: asNumber(
      pick(program, "adherencePercent", "adherence_percent", "adherence", "adesao")
    ),
    sessionsThisWeek: asNumber(
      pick(
        program,
        "sessionsThisWeek",
        "sessions_this_week",
        "completedThisWeek",
        "completed_this_week",
        "completedSessionsThisWeek",
        "completed_sessions_this_week"
      )
    ),
    sessionCompletedToday: asBoolean(
      pick(program, "sessionCompletedToday", "session_completed_today", "completedToday", "completed_today")
    ) ?? false,
    activeSessionId: asString(
      pick(program, "activeSessionId", "active_session_id", "currentSessionId", "current_session_id")
    ) ?? sessionIdFrom(pick(program, "activeSession", "active_session", "currentSession", "current_session")),
  };
}

function sessionIdFrom(raw: unknown): string | null {
  if (typeof raw === "string") return asString(raw);
  if (!isRecord(raw)) return null;
  return asString(pick(raw, "id", "sessionId", "session_id"));
}

export function normalizeTodaySummary(
  raw: unknown,
  fallbackProgram?: StudentProgram | null
): TodaySummary {
  const summary = unwrap(raw, "summary", "todaySummary", "today_summary", "data", "today");
  const record = isRecord(summary) ? summary : {};
  const program = fallbackProgram;

  const exercises = normalizeExerciseList(
    pick(record, "exercises", "todayExercises", "today_exercises", "programExercises", "program_exercises")
  );

  const weeklyGoal = asNumber(
    pick(record, "weeklyGoal", "weekly_goal", "targetSessionsPerWeek", "target_sessions_per_week")
  );
  const sessionsThisWeek = asNumber(
    pick(
      record,
      "sessionsThisWeek",
      "sessions_this_week",
      "completedThisWeek",
      "completed_this_week",
      "completedSessionsThisWeek",
      "completed_sessions_this_week"
    )
  );
  const adherence = asNumber(
    pick(record, "adherencePercent", "adherence_percent", "adherence", "adesao")
  );

  return {
    programId:
      asString(pick(record, "programId", "program_id")) ??
      sessionIdFrom(pick(record, "program")) ??
      program?.id ??
      null,
    programTitle:
      asString(pick(record, "programTitle", "program_title", "title")) ?? program?.title ?? null,
    phaseLabel:
      asString(pick(record, "phaseLabel", "phase_label", "phase")) ?? program?.phaseLabel ?? null,
    professionalName:
      (isRecord(record) ? professionalNameFrom(record) : null) ?? program?.professionalName ?? null,
    exercises: exercises.length ? exercises : program?.exercises ?? [],
    weeklyGoal: weeklyGoal ?? program?.targetSessionsPerWeek ?? null,
    sessionsThisWeek: sessionsThisWeek ?? program?.sessionsThisWeek ?? null,
    adherencePercent: adherence ?? program?.adherencePercent ?? computeAdherence(sessionsThisWeek, weeklyGoal ?? program?.targetSessionsPerWeek ?? null),
    sessionCompletedToday:
      asBoolean(
        pick(record, "sessionCompletedToday", "session_completed_today", "completedToday", "completed_today")
      ) ?? program?.sessionCompletedToday ?? false,
    activeSessionId:
      asString(pick(record, "activeSessionId", "active_session_id", "currentSessionId", "current_session_id")) ??
      sessionIdFrom(pick(record, "activeSession", "active_session", "currentSession", "current_session", "session")) ??
      program?.activeSessionId ??
      null,
    activeSessionStatus: asString(
      pick(record, "activeSessionStatus", "active_session_status", "sessionStatus", "session_status")
    ),
  };
}

function normalizeLog(raw: unknown): ExerciseLog | null {
  if (!isRecord(raw)) return null;
  const exerciseId = asString(
    pick(raw, "programExerciseId", "program_exercise_id", "exerciseId", "exercise_id", "id")
  );
  if (!exerciseId) return null;
  return {
    exerciseId,
    setsCompleted: asNumber(pick(raw, "setsCompleted", "sets_completed")),
    completedAt: asString(pick(raw, "completedAt", "completed_at")),
  };
}

export function normalizeSession(raw: unknown): WorkoutSession | null {
  const session = unwrap(raw, "session", "data", "workoutSession", "workout_session");
  if (!isRecord(session)) return null;
  const id = asString(pick(session, "id", "sessionId", "session_id"));
  if (!id) return null;

  const logsRaw = pick(session, "exerciseLogs", "exercise_logs", "logs", "completedExercises", "completed_exercises");
  const logs = Array.isArray(logsRaw)
    ? logsRaw.map(normalizeLog).filter((item): item is ExerciseLog => item !== null)
    : [];

  const completedIdsRaw = pick(session, "completedExerciseIds", "completed_exercise_ids");
  const completedFromIds = Array.isArray(completedIdsRaw)
    ? completedIdsRaw.map((item) => asString(item)).filter((item): item is string => Boolean(item))
    : [];

  const completedExerciseIds = Array.from(
    new Set([
      ...completedFromIds,
      ...logs.filter((log) => log.completedAt || (log.setsCompleted ?? 0) > 0).map((log) => log.exerciseId),
    ])
  );

  return {
    id,
    programId: asString(pick(session, "programId", "program_id")),
    status: asString(pick(session, "status")) ?? "IN_PROGRESS",
    startedAt: asString(pick(session, "startedAt", "started_at")),
    completedAt: asString(pick(session, "completedAt", "completed_at")),
    painLevel: asNumber(pick(session, "painLevel", "pain_level", "vas")),
    completedExerciseIds,
    exerciseLogs: logs,
    exercises: normalizeExerciseList(pick(session, "exercises") ?? (isRecord(raw) ? pick(raw as JsonRecord, "exercises") : undefined)),
  };
}

function formatCardValue(value: unknown, unit: string | null): string | null {
  const numeric = asNumber(value);
  const base = numeric != null ? String(numeric) : asString(value);
  if (base == null) return null;
  if (!unit) return base;
  if (unit.startsWith("/")) return `${base}${unit}`;
  if (unit === "%") return `${base}%`;
  return `${base} ${unit}`;
}

function asCard(raw: unknown, index: number): ProgressCard | null {
  if (!isRecord(raw)) return null;
  const title = asString(pick(raw, "title", "label", "name"));
  const value = formatCardValue(
    firstDefined(pick(raw, "displayValue", "display_value"), pick(raw, "value")),
    asString(pick(raw, "unit"))
  );
  if (!title && value == null) return null;
  return {
    id: asString(pick(raw, "id", "key")) ?? `card-${index}`,
    title: title ?? "Indicador",
    value: value ?? "—",
    hint: asString(pick(raw, "hint", "subtitle", "description")) ?? undefined,
  };
}

function deriveProgressCards(progress: Omit<StudentProgress, "cards">): ProgressCard[] {
  const cards: ProgressCard[] = [];
  if (progress.adherencePercent != null) {
    cards.push({
      id: "adherence",
      title: "Adesão",
      value: `${Math.round(progress.adherencePercent)}%`,
      hint: "Sessões concluídas nesta semana em relação à meta",
    });
  }
  if (progress.sessionsThisWeek != null || progress.targetSessionsPerWeek != null) {
    const done = progress.sessionsThisWeek ?? 0;
    const goal = progress.targetSessionsPerWeek;
    cards.push({
      id: "weekly",
      title: "Meta semanal",
      value: goal != null ? `${done} / ${goal}` : String(done),
      hint: goal != null ? "Sessões feitas / meta da semana" : "Sessões feitas nesta semana",
    });
  }
  if (progress.sessionsCompletedTotal != null) {
    cards.push({
      id: "total",
      title: "Sessões concluídas",
      value: String(progress.sessionsCompletedTotal),
      hint: "Total no programa atual",
    });
  }
  if (progress.lastPainLevel != null) {
    cards.push({
      id: "vas",
      title: "Última dor (VAS)",
      value: `${progress.lastPainLevel} / 10`,
      hint: "Escala de 0 (sem dor) a 10 (dor máxima)",
    });
  }
  return cards;
}

export function normalizeProgress(raw: unknown): StudentProgress {
  const payload = unwrap(raw, "progress", "data");
  const record = isRecord(payload) ? payload : {};
  const recentRaw = pick(record, "recentSessions", "recent_sessions", "sessions");
  const recentSessions: RecentSession[] = Array.isArray(recentRaw)
    ? recentRaw
        .map((item) => {
          if (!isRecord(item)) return null;
          const id = asString(pick(item, "id", "sessionId", "session_id"));
          if (!id) return null;
          return {
            id,
            completedAt: asString(pick(item, "completedAt", "completed_at")),
            painLevel: asNumber(pick(item, "painLevel", "pain_level", "vas")),
          };
        })
        .filter((item): item is RecentSession => item !== null)
    : [];

  const base: Omit<StudentProgress, "cards"> = {
    adherencePercent: asNumber(
      pick(record, "adherencePercent", "adherence_percent", "adherence", "adesao")
    ),
    sessionsThisWeek: asNumber(
      pick(record, "sessionsThisWeek", "sessions_this_week", "completedThisWeek", "completed_this_week")
    ),
    targetSessionsPerWeek: asNumber(
      pick(record, "targetSessionsPerWeek", "target_sessions_per_week", "weeklyGoal", "weekly_goal")
    ),
    sessionsCompletedTotal: asNumber(
      pick(record, "sessionsCompletedTotal", "sessions_completed_total", "totalSessions", "total_sessions")
    ),
    lastPainLevel: asNumber(
      pick(record, "lastPainLevel", "last_pain_level", "latestPainLevel", "latest_pain_level")
    ),
    recentSessions,
  };

  const rawCards = pick(record, "cards", "items");
  const apiCards = Array.isArray(rawCards)
    ? rawCards.map(asCard).filter((item): item is ProgressCard => item !== null)
    : [];

  return {
    ...base,
    cards: apiCards.length ? apiCards : deriveProgressCards(base),
  };
}

export function computeAdherence(completed: number | null, target: number | null): number | null {
  if (completed == null || target == null || target <= 0) return null;
  return Math.round(Math.min(100, (completed / target) * 100));
}

export function formatExerciseDose(exercise: ProgramExercise): string | null {
  const parts: string[] = [];
  if (exercise.sets != null) parts.push(`${exercise.sets} ${exercise.sets === 1 ? "série" : "séries"}`);
  if (exercise.reps) parts.push(exercise.reps.includes("rep") || /\D/.test(exercise.reps) ? exercise.reps : `${exercise.reps} reps`);
  return parts.length ? parts.join(" · ") : null;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function getStoredActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_SESSION_KEY);
}

export function storeActiveSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function clearActiveSessionId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function isNotFound(result: ApiResult<unknown>): boolean {
  return !result.ok && (result.status === 404 || result.status === 501);
}

export async function fetchStudentProgram(): Promise<ApiResult<StudentProgram | null>> {
  const result = await apiGet<unknown>("/api/v1/me/program");
  if (!result.ok) {
    handleApiError(result);
    if (isNotFound(result)) return { ok: true, data: null };
    return result;
  }

  const program = normalizeProgram(result.data);
  if (!program) return { ok: true, data: null };

  if (isRecord(result.data)) {
    const professionalName = professionalNameFrom(result.data);
    if (professionalName) program.professionalName = professionalName;

    const today = isRecord(result.data.today)
      ? normalizeTodaySummary({ today: result.data.today }, program)
      : null;
    if (today) {
      program.adherencePercent = today.adherencePercent ?? program.adherencePercent;
      program.sessionsThisWeek = today.sessionsThisWeek ?? program.sessionsThisWeek;
      program.targetSessionsPerWeek = today.weeklyGoal ?? program.targetSessionsPerWeek;
      program.activeSessionId = today.activeSessionId ?? program.activeSessionId;
      if (today.exercises.some((exercise) => exercise.completedInCurrentSession)) {
        program.exercises = today.exercises;
      }
    }

    const current = normalizeSession(result.data.currentSession);
    if (current) program.activeSessionId = current.id;
  }

  return { ok: true, data: program };
}

export async function fetchTodaySummary(
  fallbackProgram?: StudentProgram | null
): Promise<ApiResult<TodaySummary>> {
  const result = await apiGet<unknown>("/api/v1/me/today-summary");
  if (result.ok) {
    return { ok: true, data: normalizeTodaySummary(result.data, fallbackProgram) };
  }
  handleApiError(result);
  if (isNotFound(result) || fallbackProgram) {
    return { ok: true, data: normalizeTodaySummary(null, fallbackProgram ?? null) };
  }
  return result;
}

export async function startOrResumeSession(): Promise<ApiResult<WorkoutSession>> {
  const result = await apiPostAuth<unknown>("/api/v1/me/sessions", {});
  if (!result.ok) {
    handleApiError(result);
    if (isNotFound(result)) {
      return {
        ...result,
        message: "Nenhum programa ativo. Aguarde seu profissional publicar o HEP.",
      };
    }
    return result;
  }
  const session = normalizeSession(result.data);
  if (!session) {
    return { ok: false, kind: "unknown", message: "Resposta inválida ao iniciar a sessão." };
  }
  if (isRecord(result.data) && Array.isArray(result.data.exercises)) {
    const completed = result.data.exercises
      .map((item) => normalizeExercise(item))
      .filter((item): item is ProgramExercise => Boolean(item?.id && item.completedInCurrentSession))
      .map((item) => item.id);
    session.completedExerciseIds = Array.from(new Set([...session.completedExerciseIds, ...completed]));
  }
  storeActiveSessionId(session.id);
  return { ok: true, data: session };
}

export async function completeSessionExercise(
  sessionId: string,
  exerciseId: string,
  setsCompleted?: number
): Promise<ApiResult<WorkoutSession | Record<string, never>>> {
  const body: Record<string, unknown> = {};
  if (setsCompleted != null) {
    body.setsCompleted = setsCompleted;
    body.sets_completed = setsCompleted;
  }
  const result = await apiPostAuth<unknown>(
    `/api/v1/me/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseId)}/complete`,
    body
  );
  if (!result.ok) {
    handleApiError(result);
    return result;
  }
  const session = normalizeSession(result.data);
  return { ok: true, data: session ?? {} };
}

export async function completeSession(
  sessionId: string,
  painLevel?: number
): Promise<ApiResult<WorkoutSession | Record<string, never>>> {
  const body: Record<string, unknown> = {};
  if (painLevel != null) {
    body.painLevel = painLevel;
    body.pain_level = painLevel;
  }
  const result = await apiPostAuth<unknown>(
    `/api/v1/me/sessions/${encodeURIComponent(sessionId)}/complete`,
    body
  );
  if (!result.ok) {
    handleApiError(result);
    if (result.status === 409) {
      clearActiveSessionId();
      return { ok: true, data: {} };
    }
    return result;
  }
  clearActiveSessionId();
  const session = normalizeSession(result.data);
  return { ok: true, data: session ?? {} };
}

export async function fetchProgress(): Promise<ApiResult<StudentProgress>> {
  const result = await apiGet<unknown>("/api/v1/me/progress");
  if (!result.ok) {
    handleApiError(result);
    if (isNotFound(result)) return { ok: true, data: normalizeProgress({}) };
    return result;
  }
  return { ok: true, data: normalizeProgress(result.data) };
}
