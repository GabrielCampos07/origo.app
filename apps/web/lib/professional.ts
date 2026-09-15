/**
 * Professional HEP (Slice 2–3) client.
 *
 * Contract (sibling API, /api/v1):
 *   GET  /professional/students
 *   GET  /professional/students/:id
 *   GET  /professional/dashboard
 *   PUT  /professional/programs/:programId
 *   GET  /professional/students/:id/chart
 *   POST /professional/students/:id/notes
 *
 * JSON may arrive as snake_case (existing API style) or camelCase (Prisma/spec).
 * Helpers normalize both. PUT/POST send both key styles so either backend lands.
 */

import { apiGet, apiPatch, apiPostAuth, apiPut, handleApiError, type ApiResult } from "./api";

export type ProfessionalCategory = "FISIOTERAPIA" | "EDUCACAO_FISICA" | "PERSONAL";

export type ExerciseSource = "catalog" | "professional" | "custom";

export type ProgramExercise = {
  id: string;
  orderIndex: number;
  name: string;
  sets: string;
  reps: string;
  notes: string;
  precautions: string;
  catalogItemId: string;
  professionalExerciseId: string;
  videoUrl: string;
  thumbnailUrl: string;
  photoUrls: string[];
  cuesPt: string;
  source: ExerciseSource;
  hasLogs: boolean;
};

export type HepProgram = {
  id: string;
  title: string;
  phaseLabel: string;
  status: string;
  targetSessionsPerWeek: number;
  exercises: ProgramExercise[];
};

export type StudentListItem = {
  id: string;
  name: string;
  email: string;
  enrollmentId: string;
  category: string;
  adherencePercent: number;
  completedSessionsThisWeek: number;
  targetSessionsPerWeek: number;
  lastSessionAt: string | null;
};

export type LastSession = {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  painLevel: number | null;
};

export type StudentDetail = {
  id: string;
  name: string;
  email: string;
  enrollmentId: string;
  category: string;
  enrollmentStatus: string;
  program: HepProgram | null;
  adherencePercent: number;
  completedSessionsThisWeek: number;
  targetSessionsPerWeek: number;
  lastSession: LastSession | null;
};

export type DashboardStats = {
  activeStudents: number;
  averageAdherencePercent: number;
  sessionsThisWeek: number;
  studentsBelowAdherence: number;
};

export type ClinicalNote = {
  id: string;
  conduta: string;
  evolucao: string;
  informacoesPertinentes: string;
  createdAt: string;
};

export type PainPoint = {
  sessionId: string;
  painLevel: number | null;
  patientNote: string | null;
  completedAt: string;
};

export type StudentChart = {
  notes: ClinicalNote[];
  pain: PainPoint[];
};

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined<T>(...values: unknown[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

function asNullableString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return asString(value);
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  const nested = firstDefined<unknown>(data.students, data.items, data.data, data.results);
  return Array.isArray(nested) ? nested : [];
}

function unwrapObject(data: unknown): Json {
  if (!isRecord(data)) return {};
  const nested = firstDefined<unknown>(data.student, data.data, data.detail);
  return isRecord(nested) ? { ...data, ...nested } : data;
}

function pickAdherence(source: Json): {
  adherencePercent: number;
  completedSessionsThisWeek: number;
  targetSessionsPerWeek: number;
} {
  const nested = isRecord(source.adherence) ? source.adherence : null;
  return {
    adherencePercent: asNumber(
      firstDefined(
        source.adherence_percent,
        source.adherencePercent,
        nested?.percent,
        nested?.adherence_percent,
        nested?.adherencePercent,
        typeof source.adherence === "number" ? source.adherence : undefined
      ),
      0
    ),
    completedSessionsThisWeek: asNumber(
      firstDefined(
        source.completed_sessions_this_week,
        source.completedSessionsThisWeek,
        nested?.completed_sessions_this_week,
        nested?.completedSessionsThisWeek
      ),
      0
    ),
    targetSessionsPerWeek: asNumber(
      firstDefined(
        source.target_sessions_per_week,
        source.targetSessionsPerWeek,
        nested?.target_sessions_per_week,
        nested?.targetSessionsPerWeek
      ),
      0
    ),
  };
}

export function normalizeExercise(raw: unknown, index = 0): ProgramExercise {
  const item = isRecord(raw) ? raw : {};
  const catalogItemId = asString(firstDefined(item.catalog_item_id, item.catalogItemId));
  const professionalExerciseId = asString(
    firstDefined(item.professional_exercise_id, item.professionalExerciseId)
  );
  const sourceRaw = asString(item.source).toLowerCase();
  let source: ExerciseSource = "custom";
  if (sourceRaw === "catalog" || sourceRaw === "professional" || sourceRaw === "custom") {
    source = sourceRaw;
  } else if (catalogItemId) {
    source = "catalog";
  } else if (professionalExerciseId) {
    source = "professional";
  }
  const photosRaw = firstDefined(item.photoUrls, item.photo_urls, item.photos);
  return {
    id: asString(firstDefined(item.id, item.exercise_id, item.exerciseId)),
    orderIndex: asNumber(firstDefined(item.order_index, item.orderIndex), index),
    name: asString(item.name),
    sets: asString(item.sets),
    reps: asString(item.reps),
    notes: asString(item.notes),
    precautions: asString(item.precautions),
    catalogItemId,
    professionalExerciseId,
    videoUrl: asString(firstDefined(item.video_url, item.videoUrl)),
    thumbnailUrl: asString(firstDefined(item.thumbnail_url, item.thumbnailUrl)),
    photoUrls: Array.isArray(photosRaw)
      ? photosRaw.map((url) => asString(url)).filter(Boolean)
      : [],
    cuesPt: asString(firstDefined(item.cues_pt, item.cuesPt, item.cues)),
    source,
    hasLogs: asBoolean(
      firstDefined(
        item.has_logs,
        item.hasLogs,
        item.has_session_logs,
        item.hasSessionLogs,
        item.locked
      )
    ),
  };
}

export function normalizeProgram(raw: unknown): HepProgram | null {
  if (!isRecord(raw)) return null;
  const id = asString(firstDefined(raw.id, raw.program_id, raw.programId));
  if (!id) return null;
  const exercisesRaw = firstDefined<unknown>(raw.exercises, raw.program_exercises, raw.programExercises);
  const exercises = Array.isArray(exercisesRaw)
    ? exercisesRaw.map((exercise, index) => normalizeExercise(exercise, index))
    : [];
  return {
    id,
    title: asString(raw.title, "Programa"),
    phaseLabel: asString(firstDefined(raw.phase_label, raw.phaseLabel, raw.phase)),
    status: asString(raw.status, "ACTIVE"),
    targetSessionsPerWeek: asNumber(
      firstDefined(raw.target_sessions_per_week, raw.targetSessionsPerWeek),
      0
    ),
    exercises,
  };
}

function normalizeLastSession(raw: unknown): LastSession | null {
  if (!isRecord(raw)) return null;
  const id = asString(firstDefined(raw.id, raw.session_id, raw.sessionId));
  if (!id && !raw.completed_at && !raw.completedAt) return null;
  const pain = firstDefined(raw.pain_level, raw.painLevel);
  return {
    id: id || "session",
    status: asString(raw.status),
    startedAt: asNullableString(firstDefined(raw.started_at, raw.startedAt)),
    completedAt: asNullableString(firstDefined(raw.completed_at, raw.completedAt)),
    painLevel: pain === undefined || pain === null ? null : asNumber(pain),
  };
}

export function normalizeStudentListItem(raw: unknown): StudentListItem | null {
  const item = unwrapObject(raw);
  const id = asString(firstDefined(item.id, item.student_id, item.studentId, item.user_id, item.userId));
  if (!id) return null;
  const adherence = pickAdherence(item);
  return {
    id,
    name: asString(firstDefined(item.name, item.full_name, item.fullName), item.email ? asString(item.email) : "Aluno"),
    email: asString(item.email),
    enrollmentId: asString(firstDefined(item.enrollment_id, item.enrollmentId)),
    category: asString(item.category),
    lastSessionAt: asNullableString(
      firstDefined(
        item.last_session_at,
        item.lastSessionAt,
        isRecord(item.lastSession) ? item.lastSession.completedAt : undefined,
        isRecord(item.last_session) ? item.last_session.completed_at : undefined,
        isRecord(item.lastSession) ? item.lastSession.completed_at : undefined
      )
    ),
    ...adherence,
  };
}

export function normalizeStudentDetail(raw: unknown): StudentDetail | null {
  const root = isRecord(raw) ? raw : {};
  const student = unwrapObject(raw);
  const id = asString(firstDefined(student.id, student.student_id, student.studentId));
  if (!id) return null;

  const enrollment = isRecord(student.enrollment) ? student.enrollment : isRecord(root.enrollment) ? root.enrollment : {};
  const programRaw = firstDefined(
    student.program,
    student.active_program,
    student.activeProgram,
    root.program,
    root.active_program
  );
  const lastSessionRaw = firstDefined(student.last_session, student.lastSession, root.last_session, root.lastSession);
  const program = normalizeProgram(programRaw);
  const adherence = pickAdherence({ ...root, ...student });
  if (!adherence.targetSessionsPerWeek && program) {
    adherence.targetSessionsPerWeek = program.targetSessionsPerWeek;
  }

  return {
    id,
    name: asString(firstDefined(student.name, student.full_name, student.fullName), student.email ? asString(student.email) : "Aluno"),
    email: asString(student.email),
    enrollmentId: asString(firstDefined(student.enrollment_id, student.enrollmentId, enrollment.id)),
    category: asString(firstDefined(student.category, enrollment.category)),
    enrollmentStatus: asString(firstDefined(student.enrollment_status, student.enrollmentStatus, enrollment.status), "ACTIVE"),
    program,
    lastSession: normalizeLastSession(lastSessionRaw),
    ...adherence,
  };
}

export function normalizeDashboardStats(raw: unknown): DashboardStats {
  const root = isRecord(raw) ? raw : {};
  const stats = isRecord(root.stats) ? root.stats : root;
  return {
    activeStudents: asNumber(firstDefined(stats.active_students, stats.activeStudents, stats.students_count)),
    averageAdherencePercent: asNumber(
      firstDefined(stats.average_adherence_percent, stats.averageAdherencePercent, stats.avg_adherence, stats.adherence)
    ),
    sessionsThisWeek: asNumber(
      firstDefined(stats.sessionsCompletedThisWeek, stats.sessions_completed_this_week, stats.sessions_this_week, stats.sessionsThisWeek)
    ),
    studentsBelowAdherence: asNumber(
      firstDefined(
        stats.studentsBelowAdherence,
        stats.students_below_adherence,
        stats.programs_active,
        stats.programsActive
      )
    ),
  };
}

export function normalizeClinicalNote(raw: unknown): ClinicalNote | null {
  const item = isRecord(raw) ? raw : {};
  const id = asString(item.id);
  if (!id && !item.created_at && !item.createdAt) return null;
  return {
    id: id || asString(firstDefined(item.created_at, item.createdAt), "note"),
    conduta: asString(item.conduta),
    evolucao: asString(item.evolucao),
    informacoesPertinentes: asString(
      firstDefined(item.informacoes_pertinentes, item.informacoesPertinentes)
    ),
    createdAt: asString(firstDefined(item.created_at, item.createdAt)),
  };
}

export function normalizeChart(raw: unknown): StudentChart {
  const root = isRecord(raw) ? raw : {};
  const notesRaw = firstDefined<unknown>(root.notes, root.clinical_notes, root.clinicalNotes);
  const painRaw = firstDefined<unknown>(
    root.painTimeline,
    root.pain_timeline,
    root.pain,
    root.pain_points,
    root.painPoints,
    root.sessions
  );
  return {
    notes: Array.isArray(notesRaw)
      ? notesRaw.map(normalizeClinicalNote).filter((note): note is ClinicalNote => note !== null)
      : [],
    pain: Array.isArray(painRaw)
      ? painRaw
          .map((point): PainPoint | null => {
            const item = isRecord(point) ? point : {};
            const painLevelRaw = firstDefined(item.pain_level, item.painLevel);
            const patientNote = asNullableString(
              firstDefined(item.patient_note, item.patientNote, item.note)
            );
            const painLevel =
              painLevelRaw === undefined || painLevelRaw === null ? null : asNumber(painLevelRaw);
            if (painLevel === null && !patientNote) return null;
            const completedAt = asString(
              firstDefined(item.completed_at, item.completedAt, item.created_at, item.createdAt)
            );
            if (!completedAt) return null;
            return {
              sessionId: asString(firstDefined(item.session_id, item.sessionId, item.id), completedAt),
              painLevel,
              patientNote,
              completedAt,
            };
          })
          .filter((point): point is PainPoint => point !== null)
      : [],
  };
}

export function categoryLabel(category: string): string {
  switch (category) {
    case "FISIOTERAPIA":
      return "Fisioterapia";
    case "EDUCACAO_FISICA":
      return "Educação física";
    case "PERSONAL":
      return "Personal";
    default:
      return category || "—";
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function sessionStatusLabel(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Concluída";
    case "IN_PROGRESS":
      return "Em andamento";
    default:
      return status || "—";
  }
}

function mapFetchError<T>(result: ApiResult<T>, fallback: string): ApiResult<T> {
  if (result.ok) return result;
  handleApiError(result);
  if (result.kind === "network") {
    return { ...result, message: result.message };
  }
  if (result.status === 404) {
    return {
      ...result,
      message: "Este recurso ainda não está disponível na API. Tente de novo em instantes.",
    };
  }
  if (result.kind === "unauthorized") {
    return { ...result, message: "Sessão expirada. Faça login novamente." };
  }
  return { ...result, message: result.message || fallback };
}

export async function getProfessionalStudents(): Promise<ApiResult<StudentListItem[]>> {
  const result = await apiGet<unknown>("/api/v1/professional/students");
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível carregar os alunos.");
  }
  const students = unwrapList(result.data)
    .map(normalizeStudentListItem)
    .filter((item): item is StudentListItem => item !== null);
  return { ok: true, data: students };
}

export async function getProfessionalStudent(id: string): Promise<ApiResult<StudentDetail>> {
  const result = await apiGet<unknown>(`/api/v1/professional/students/${encodeURIComponent(id)}`);
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível carregar a ficha do aluno.");
  }
  const detail = normalizeStudentDetail(result.data);
  if (!detail) {
    return { ok: false, kind: "unknown", message: "Resposta da API sem dados do aluno." };
  }
  return { ok: true, data: detail };
}

export async function getProfessionalDashboard(): Promise<ApiResult<DashboardStats>> {
  const result = await apiGet<unknown>("/api/v1/professional/dashboard");
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível carregar o resumo.");
  }
  return { ok: true, data: normalizeDashboardStats(result.data) };
}

export type UpdateProgramPayload = {
  title: string;
  phaseLabel: string;
  targetSessionsPerWeek: number;
  exercises: Array<{
    id?: string;
    orderIndex: number;
    name: string;
    sets: number;
    reps: string;
    notes: string;
    precautions: string;
    catalogItemId?: string;
    professionalExerciseId?: string;
  }>;
};

function programWriteBody(payload: UpdateProgramPayload): Record<string, unknown> {
  return {
    title: payload.title,
    phaseLabel: payload.phaseLabel || null,
    targetSessionsPerWeek: payload.targetSessionsPerWeek,
    exercises: payload.exercises.map((exercise) => ({
      ...(exercise.id ? { id: exercise.id } : {}),
      orderIndex: exercise.orderIndex,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      notes: exercise.notes || null,
      precautions: exercise.precautions || null,
      ...(exercise.catalogItemId
        ? { catalogItemId: exercise.catalogItemId, catalog_item_id: exercise.catalogItemId }
        : {}),
      ...(exercise.professionalExerciseId
        ? {
            professionalExerciseId: exercise.professionalExerciseId,
            professional_exercise_id: exercise.professionalExerciseId,
          }
        : {}),
    })),
  };
}

function mapProgramWriteError(message: string): string {
  if (/cannot remove exercises that already have session logs/i.test(message)) {
    return "Não é possível remover um exercício que já tem sessão registrada. Ele voltou para a lista.";
  }
  if (/exercise name is required/i.test(message)) {
    return "Todo exercício precisa de um nome.";
  }
  if (/sets must be an integer/i.test(message)) {
    return "Séries deve ser um número inteiro entre 1 e 50.";
  }
  if (/reps is required/i.test(message)) {
    return "Informe as repetições de cada exercício.";
  }
  if (/title is required/i.test(message)) {
    return "Informe o título do programa.";
  }
  if (/targetSessionsPerWeek/i.test(message)) {
    return "A meta semanal deve ser um número inteiro entre 1 e 14.";
  }
  return message;
}

export async function updateProfessionalProgram(
  programId: string,
  payload: UpdateProgramPayload
): Promise<ApiResult<HepProgram>> {
  const result = await apiPut<unknown>(
    `/api/v1/professional/programs/${encodeURIComponent(programId)}`,
    programWriteBody(payload)
  );

  if (!result.ok) {
    handleApiError(result);
    return {
      ...result,
      message: mapProgramWriteError(result.message || "Não foi possível salvar o programa."),
    };
  }

  const program = normalizeProgram(
    isRecord(result.data) ? firstDefined(result.data.program, result.data) : result.data
  );
  if (!program) {
    return { ok: false, kind: "unknown", message: "Programa salvo, mas a resposta da API veio incompleta." };
  }
  return { ok: true, data: program };
}

export async function createProfessionalProgram(
  studentId: string,
  payload: UpdateProgramPayload
): Promise<ApiResult<HepProgram>> {
  const result = await apiPostAuth<unknown>(
    `/api/v1/professional/students/${encodeURIComponent(studentId)}/programs`,
    programWriteBody(payload)
  );

  if (!result.ok) {
    handleApiError(result);
    return {
      ...result,
      message: mapProgramWriteError(result.message || "Não foi possível criar o programa."),
    };
  }

  const program = normalizeProgram(
    isRecord(result.data) ? firstDefined(result.data.program, result.data) : result.data
  );
  if (!program) {
    return { ok: false, kind: "unknown", message: "Programa criado, mas a resposta da API veio incompleta." };
  }
  return { ok: true, data: program };
}

export async function getStudentChart(studentId: string): Promise<ApiResult<StudentChart>> {
  const result = await apiGet<unknown>(
    `/api/v1/professional/students/${encodeURIComponent(studentId)}/chart`
  );
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível carregar o prontuário.");
  }
  return { ok: true, data: normalizeChart(result.data) };
}

export async function createStudentNote(
  studentId: string,
  note: { conduta: string; evolucao: string; informacoesPertinentes: string }
): Promise<ApiResult<ClinicalNote>> {
  const result = await apiPostAuth<unknown>(
    `/api/v1/professional/students/${encodeURIComponent(studentId)}/notes`,
    {
      conduta: note.conduta,
      evolucao: note.evolucao,
      informacoesPertinentes: note.informacoesPertinentes,
      informacoes_pertinentes: note.informacoesPertinentes,
    }
  );
  if (!result.ok) {
    handleApiError(result);
    return { ...result, message: result.message || "Não foi possível salvar a nota." };
  }
  const created = normalizeClinicalNote(
    isRecord(result.data) ? firstDefined(result.data.note, result.data) : result.data
  );
  if (!created) {
    return {
      ok: true,
      data: {
        id: `local-${Date.now()}`,
        conduta: note.conduta,
        evolucao: note.evolucao,
        informacoesPertinentes: note.informacoesPertinentes,
        createdAt: new Date().toISOString(),
      },
    };
  }
  return { ok: true, data: created };
}

export type CatalogExerciseItem = {
  id: string;
  slug: string;
  namePt: string;
  categoryTags: string[];
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  cuesPt: string | null;
};

export type ProfessionalExerciseItem = {
  id: string;
  namePt: string;
  categoryTags: string[];
  videoUrl: string | null;
  photoUrls: string[];
  cuesPt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeProfessionalExerciseItem(raw: unknown): ProfessionalExerciseItem | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const namePt = asString(firstDefined(raw.namePt, raw.name_pt, raw.name));
  if (!id || !namePt) return null;
  const tagsRaw = firstDefined(raw.categoryTags, raw.category_tags, raw.tags);
  const photosRaw = firstDefined(raw.photoUrls, raw.photo_urls, raw.photos);
  return {
    id,
    namePt,
    categoryTags: Array.isArray(tagsRaw)
      ? tagsRaw.map((tag) => asString(tag)).filter(Boolean)
      : [],
    videoUrl: asNullableString(firstDefined(raw.videoUrl, raw.video_url)),
    photoUrls: Array.isArray(photosRaw)
      ? photosRaw.map((url) => asString(url)).filter(Boolean)
      : [],
    cuesPt: asNullableString(firstDefined(raw.cuesPt, raw.cues_pt, raw.cues)),
    active: asBoolean(firstDefined(raw.active, true)),
    createdAt: asString(firstDefined(raw.createdAt, raw.created_at)),
    updatedAt: asString(firstDefined(raw.updatedAt, raw.updated_at)),
  };
}

export async function searchExerciseCatalog(params?: {
  q?: string;
  tag?: string;
}): Promise<ApiResult<CatalogExerciseItem[]>> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.tag?.trim()) search.set("tag", params.tag.trim());
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const result = await apiGet<unknown>(`/api/v1/exercises/catalog${suffix}`);
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível buscar o catálogo de exercícios.");
  }
  const root = isRecord(result.data) ? result.data : {};
  const list = Array.isArray(root.items)
    ? root.items
    : Array.isArray(root.exercises)
      ? root.exercises
      : Array.isArray(result.data)
        ? result.data
        : [];
  const items = list
    .map((raw): CatalogExerciseItem | null => {
      if (!isRecord(raw)) return null;
      const id = asString(raw.id);
      const namePt = asString(firstDefined(raw.namePt, raw.name_pt, raw.name));
      if (!id || !namePt) return null;
      const tagsRaw = firstDefined(raw.categoryTags, raw.category_tags, raw.tags);
      return {
        id,
        slug: asString(raw.slug),
        namePt,
        categoryTags: Array.isArray(tagsRaw)
          ? tagsRaw.map((tag) => asString(tag)).filter(Boolean)
          : [],
        videoUrl: asString(firstDefined(raw.videoUrl, raw.video_url)),
        thumbnailUrl: asNullableString(firstDefined(raw.thumbnailUrl, raw.thumbnail_url)),
        durationSec: (() => {
          const value = firstDefined(raw.durationSec, raw.duration_sec);
          return value === undefined || value === null ? null : asNumber(value);
        })(),
        cuesPt: asNullableString(firstDefined(raw.cuesPt, raw.cues_pt, raw.cues)),
      };
    })
    .filter((item): item is CatalogExerciseItem => item !== null);
  return { ok: true, data: items };
}

export async function listMyExercises(params?: {
  q?: string;
  tag?: string;
}): Promise<ApiResult<ProfessionalExerciseItem[]>> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.tag?.trim()) search.set("tag", params.tag.trim());
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const result = await apiGet<unknown>(`/api/v1/me/exercises${suffix}`);
  if (!result.ok) {
    return mapFetchError(result, "Não foi possível carregar seus exercícios.");
  }
  const root = isRecord(result.data) ? result.data : {};
  const list = Array.isArray(root.items)
    ? root.items
    : Array.isArray(root.exercises)
      ? root.exercises
      : Array.isArray(result.data)
        ? result.data
        : [];
  const items = list
    .map(normalizeProfessionalExerciseItem)
    .filter((item): item is ProfessionalExerciseItem => item !== null);
  return { ok: true, data: items };
}

export type CreateMyExercisePayload = {
  namePt: string;
  categoryTags?: string[];
  videoUrl?: string;
  photoUrls?: string[];
  cuesPt?: string;
};

export async function createMyExercise(
  payload: CreateMyExercisePayload
): Promise<ApiResult<ProfessionalExerciseItem>> {
  const result = await apiPostAuth<unknown>("/api/v1/me/exercises", {
    namePt: payload.namePt,
    categoryTags: payload.categoryTags ?? [],
    ...(payload.videoUrl ? { videoUrl: payload.videoUrl } : {}),
    ...(payload.photoUrls?.length ? { photoUrls: payload.photoUrls } : {}),
    ...(payload.cuesPt ? { cuesPt: payload.cuesPt } : {}),
  });
  if (!result.ok) {
    handleApiError(result);
    return { ...result, message: result.message || "Não foi possível criar o exercício." };
  }
  const item = normalizeProfessionalExerciseItem(
    isRecord(result.data) ? firstDefined(result.data.exercise, result.data) : result.data
  );
  if (!item) {
    return { ok: false, kind: "unknown", message: "Exercício criado, mas a resposta veio incompleta." };
  }
  return { ok: true, data: item };
}

export async function updateMyExercise(
  id: string,
  payload: Partial<CreateMyExercisePayload> & { active?: boolean }
): Promise<ApiResult<ProfessionalExerciseItem>> {
  const body: Record<string, unknown> = {};
  if (payload.namePt !== undefined) body.namePt = payload.namePt;
  if (payload.categoryTags !== undefined) body.categoryTags = payload.categoryTags;
  if (payload.videoUrl !== undefined) body.videoUrl = payload.videoUrl || null;
  if (payload.photoUrls !== undefined) body.photoUrls = payload.photoUrls;
  if (payload.cuesPt !== undefined) body.cuesPt = payload.cuesPt || null;
  if (payload.active !== undefined) body.active = payload.active;

  const result = await apiPatch<unknown>(`/api/v1/me/exercises/${encodeURIComponent(id)}`, body);
  if (!result.ok) {
    handleApiError(result);
    return { ...result, message: result.message || "Não foi possível atualizar o exercício." };
  }
  const item = normalizeProfessionalExerciseItem(
    isRecord(result.data) ? firstDefined(result.data.exercise, result.data) : result.data
  );
  if (!item) {
    return {
      ok: false,
      kind: "unknown",
      message: "Exercício atualizado, mas a resposta veio incompleta.",
    };
  }
  return { ok: true, data: item };
}
