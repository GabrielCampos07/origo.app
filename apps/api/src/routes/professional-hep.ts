import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, type Program, type ProgramExercise, type WorkoutSession } from '@prisma/client';
import {
  requireOwnedActiveEnrollment,
  requireProfessional,
} from '../lib/authz';
import {
  LOW_ADHERENCE_THRESHOLD,
  adherencePercent,
  countCompletedThisWeek,
  serializeExercise,
  startOfIsoWeekUtc,
} from '../lib/hep';

const prisma = new PrismaClient();

const exerciseWithMediaInclude = {
  catalogItem: {
    select: {
      videoUrl: true,
      thumbnailUrl: true,
      cuesPt: true,
    },
  },
  professionalExercise: {
    select: {
      videoUrl: true,
      photoUrls: true,
      cuesPt: true,
    },
  },
} as const;

type ExerciseWithMedia = ProgramExercise & {
  catalogItem?: {
    videoUrl: string;
    thumbnailUrl: string | null;
    cuesPt: string | null;
  } | null;
  professionalExercise?: {
    videoUrl: string | null;
    photoUrls: string[];
    cuesPt: string | null;
  } | null;
};

type ExerciseInput = {
  id?: string;
  name?: unknown;
  sets?: unknown;
  reps?: unknown;
  notes?: unknown;
  precautions?: unknown;
  orderIndex?: unknown;
  catalogItemId?: unknown;
  catalog_item_id?: unknown;
  professionalExerciseId?: unknown;
  professional_exercise_id?: unknown;
};

type UpdateProgramBody = {
  title?: unknown;
  phaseLabel?: unknown;
  targetSessionsPerWeek?: unknown;
  exercises?: unknown;
};

type CreateProgramBody = {
  title?: unknown;
  phaseLabel?: unknown;
  targetSessionsPerWeek?: unknown;
  exercises?: unknown;
};

type CreateNoteBody = {
  conduta?: unknown;
  evolucao?: unknown;
  informacoesPertinentes?: unknown;
};

function lastCompletedSession(sessions: WorkoutSession[]) {
  const completed = sessions
    .filter((session) => session.status === 'COMPLETED' && session.completedAt)
    .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()));
  const session = completed[0];
  if (!session) return null;
  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    painLevel: session.painLevel,
    patientNote: session.patientNote ?? null,
  };
}

function serializeProgram(
  program: Program,
  exercises: ExerciseWithMedia[],
  exerciseIdsWithLogs: Set<string> = new Set()
) {
  return {
    id: program.id,
    title: program.title,
    phaseLabel: program.phaseLabel,
    status: program.status,
    targetSessionsPerWeek: program.targetSessionsPerWeek,
    exercises: exercises
      .filter((exercise) => exercise.removedAt === null)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((exercise) => ({
        ...serializeExercise(exercise),
        hasLogs: exerciseIdsWithLogs.has(exercise.id),
      })),
  };
}

async function exerciseIdsWithSessionLogs(exerciseIds: string[]): Promise<Set<string>> {
  if (exerciseIds.length === 0) return new Set();
  const logs = await prisma.sessionExerciseLog.findMany({
    where: { programExerciseId: { in: exerciseIds } },
    select: { programExerciseId: true },
    distinct: ['programExerciseId'],
  });
  return new Set(logs.map((log) => log.programExerciseId));
}

function parseRequiredText(value: unknown, field: string, max = 4000): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    return null;
  }
  return trimmed;
}

function parseExercises(raw: unknown): { ok: true; exercises: ParsedExercise[] } | { ok: false; message: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'exercises must be an array' };
  }

  const exercises: ParsedExercise[] = [];
  const seenOrder = new Set<number>();

  for (const item of raw as ExerciseInput[]) {
    if (!item || typeof item !== 'object') {
      return { ok: false, message: 'Each exercise must be an object' };
    }

    const catalogRaw = item.catalogItemId ?? item.catalog_item_id;
    let catalogItemId: string | null = null;
    if (catalogRaw !== undefined && catalogRaw !== null && catalogRaw !== '') {
      if (typeof catalogRaw !== 'string' || !catalogRaw.trim()) {
        return { ok: false, message: 'catalogItemId must be a string id' };
      }
      catalogItemId = catalogRaw.trim();
    }

    const proRaw = item.professionalExerciseId ?? item.professional_exercise_id;
    let professionalExerciseId: string | null = null;
    if (proRaw !== undefined && proRaw !== null && proRaw !== '') {
      if (typeof proRaw !== 'string' || !proRaw.trim()) {
        return { ok: false, message: 'professionalExerciseId must be a string id' };
      }
      professionalExerciseId = proRaw.trim();
    }

    if (catalogItemId && professionalExerciseId) {
      return {
        ok: false,
        message: 'Cannot set both catalogItemId and professionalExerciseId',
      };
    }

    const nameRaw =
      item.name === undefined || item.name === null
        ? ''
        : typeof item.name === 'string'
          ? item.name.trim()
          : String(item.name).trim();
    if (!nameRaw && !catalogItemId && !professionalExerciseId) {
      return { ok: false, message: 'Exercise name is required' };
    }
    if (nameRaw.length > 200) {
      return { ok: false, message: 'Exercise name must be at most 200 characters' };
    }

    const sets = typeof item.sets === 'number' ? item.sets : Number(item.sets);
    if (!Number.isInteger(sets) || sets < 1 || sets > 50) {
      return { ok: false, message: 'Exercise sets must be an integer between 1 and 50' };
    }

    const reps =
      typeof item.reps === 'string'
        ? item.reps.trim()
        : item.reps === undefined || item.reps === null
          ? ''
          : String(item.reps).trim();
    if (!reps || reps.length > 50) {
      return { ok: false, message: 'Exercise reps is required (max 50 characters)' };
    }

    const orderIndex =
      typeof item.orderIndex === 'number' ? item.orderIndex : Number(item.orderIndex);
    if (!Number.isInteger(orderIndex) || orderIndex < 0 || orderIndex > 500) {
      return { ok: false, message: 'Exercise orderIndex must be an integer >= 0' };
    }
    if (seenOrder.has(orderIndex)) {
      return { ok: false, message: 'Exercise orderIndex must be unique' };
    }
    seenOrder.add(orderIndex);

    const notes =
      item.notes === undefined || item.notes === null
        ? null
        : typeof item.notes === 'string'
          ? item.notes.trim() || null
          : null;
    const precautions =
      item.precautions === undefined || item.precautions === null
        ? null
        : typeof item.precautions === 'string'
          ? item.precautions.trim() || null
          : null;

    if (notes && notes.length > 2000) {
      return { ok: false, message: 'Exercise notes must be at most 2000 characters' };
    }
    if (precautions && precautions.length > 2000) {
      return { ok: false, message: 'Exercise precautions must be at most 2000 characters' };
    }

    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : undefined;

    exercises.push({
      id,
      name: nameRaw,
      sets,
      reps,
      notes,
      precautions,
      orderIndex,
      catalogItemId,
      professionalExerciseId,
    });
  }

  return { ok: true, exercises };
}

type ParsedExercise = {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  notes: string | null;
  precautions: string | null;
  orderIndex: number;
  catalogItemId: string | null;
  professionalExerciseId: string | null;
};

async function resolveExerciseDefaults(
  professionalUserId: string,
  exercises: ParsedExercise[]
): Promise<{ ok: true; exercises: ParsedExercise[] } | { ok: false; message: string }> {
  const catalogIds = [
    ...new Set(
      exercises
        .map((exercise) => exercise.catalogItemId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ),
  ];
  const proIds = [
    ...new Set(
      exercises
        .map((exercise) => exercise.professionalExerciseId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ),
  ];

  const [catalogItems, proItems] = await Promise.all([
    catalogIds.length === 0
      ? Promise.resolve([])
      : prisma.exerciseCatalogItem.findMany({
          where: { id: { in: catalogIds }, active: true },
          select: { id: true, namePt: true },
        }),
    proIds.length === 0
      ? Promise.resolve([])
      : prisma.professionalExercise.findMany({
          where: {
            id: { in: proIds },
            professionalUserId,
            active: true,
          },
          select: { id: true, namePt: true },
        }),
  ]);

  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  const proById = new Map(proItems.map((item) => [item.id, item]));

  const resolved: ParsedExercise[] = [];
  for (const exercise of exercises) {
    if (exercise.catalogItemId && exercise.professionalExerciseId) {
      return {
        ok: false,
        message: 'Cannot set both catalogItemId and professionalExerciseId',
      };
    }

    if (exercise.catalogItemId) {
      const catalog = catalogById.get(exercise.catalogItemId);
      if (!catalog) {
        return { ok: false, message: 'catalogItemId not found or inactive' };
      }
      resolved.push({
        ...exercise,
        professionalExerciseId: null,
        name: exercise.name || catalog.namePt,
      });
      continue;
    }

    if (exercise.professionalExerciseId) {
      const pro = proById.get(exercise.professionalExerciseId);
      if (!pro) {
        return {
          ok: false,
          message: 'professionalExerciseId not found, inactive, or not owned',
        };
      }
      resolved.push({
        ...exercise,
        catalogItemId: null,
        name: exercise.name || pro.namePt,
      });
      continue;
    }

    if (!exercise.name) {
      return { ok: false, message: 'Exercise name is required' };
    }
    resolved.push({
      ...exercise,
      catalogItemId: null,
      professionalExerciseId: null,
    });
  }

  return { ok: true, exercises: resolved };
}

function parseProgramMetadata(body: { title?: unknown; phaseLabel?: unknown; targetSessionsPerWeek?: unknown }) {
  let title: string | undefined;
  if (body.title !== undefined) {
    const parsedTitle = parseRequiredText(body.title, 'title', 200);
    if (!parsedTitle) {
      return { ok: false as const, message: 'title is required' };
    }
    title = parsedTitle;
  }

  let phaseLabel: string | null | undefined = undefined;
  if (body.phaseLabel !== undefined) {
    if (body.phaseLabel === null || body.phaseLabel === '') {
      phaseLabel = null;
    } else if (typeof body.phaseLabel === 'string') {
      const trimmed = body.phaseLabel.trim();
      if (trimmed.length > 120) {
        return { ok: false as const, message: 'phaseLabel must be at most 120 characters' };
      }
      phaseLabel = trimmed || null;
    } else {
      return { ok: false as const, message: 'phaseLabel must be a string' };
    }
  }

  let targetSessionsPerWeek: number | undefined = undefined;
  if (body.targetSessionsPerWeek !== undefined) {
    const target =
      typeof body.targetSessionsPerWeek === 'number'
        ? body.targetSessionsPerWeek
        : Number(body.targetSessionsPerWeek);
    if (!Number.isInteger(target) || target < 1 || target > 14) {
      return { ok: false as const, message: 'targetSessionsPerWeek must be an integer between 1 and 14' };
    }
    targetSessionsPerWeek = target;
  }

  return { ok: true as const, title, phaseLabel, targetSessionsPerWeek };
}

async function loadOwnedProgram(professionalUserId: string, programId: string) {
  return prisma.program.findFirst({
    where: {
      id: programId,
      enrollment: {
        professionalUserId,
        status: 'ACTIVE',
      },
    },
    include: {
      enrollment: true,
      exercises: {
        include: exerciseWithMediaInclude,
      },
    },
  });
}

export async function professionalHepRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/professional/students
   * Roster of ACTIVE enrollments + weekly adherence.
   */
  fastify.get(
    '/api/v1/professional/students',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      try {
        const weekStart = startOfIsoWeekUtc();
        const enrollments = await prisma.enrollment.findMany({
          where: { professionalUserId: user.userId, status: 'ACTIVE' },
          include: {
            student: { select: { id: true, name: true, email: true } },
            programs: {
              where: { status: 'ACTIVE' },
              include: {
                sessions: {
                  where: { status: 'COMPLETED' },
                  orderBy: { completedAt: 'desc' },
                },
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        });

        const students = enrollments.map((enrollment) => {
          const program = enrollment.programs[0] ?? null;
          const completedThisWeek = program
            ? countCompletedThisWeek(program.sessions, weekStart)
            : 0;
          const target = program?.targetSessionsPerWeek ?? 0;

          return {
            id: enrollment.student.id,
            name: enrollment.student.name,
            email: enrollment.student.email,
            enrollmentId: enrollment.id,
            category: enrollment.category,
            startedAt: enrollment.startedAt.toISOString(),
            programId: program?.id ?? null,
            targetSessionsPerWeek: program?.targetSessionsPerWeek ?? null,
            completedSessionsThisWeek: completedThisWeek,
            adherencePercent: adherencePercent(completedThisWeek, target),
            lastSession: program ? lastCompletedSession(program.sessions) : null,
          };
        });

        return reply.code(200).send({ students });
      } catch (error) {
        fastify.log.error(error, 'GET /professional/students failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while listing students',
        });
      }
    }
  );

  /**
   * GET /api/v1/professional/dashboard
   * Aggregated stats across ACTIVE enrollments.
   */
  fastify.get(
    '/api/v1/professional/dashboard',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      try {
        const weekStart = startOfIsoWeekUtc();
        const enrollments = await prisma.enrollment.findMany({
          where: { professionalUserId: user.userId, status: 'ACTIVE' },
          include: {
            programs: {
              where: { status: 'ACTIVE' },
              include: {
                sessions: {
                  where: { status: 'COMPLETED' },
                },
              },
            },
          },
        });

        const perStudent = enrollments.map((enrollment) => {
          const program = enrollment.programs[0] ?? null;
          const completedThisWeek = program
            ? countCompletedThisWeek(program.sessions, weekStart)
            : 0;
          const target = program?.targetSessionsPerWeek ?? 0;
          return {
            adherencePercent: adherencePercent(completedThisWeek, target),
            completedThisWeek,
            hasProgram: Boolean(program),
          };
        });

        const withProgram = perStudent.filter((row) => row.hasProgram);
        const averageAdherencePercent =
          withProgram.length === 0
            ? 0
            : Math.round(
                withProgram.reduce((sum, row) => sum + row.adherencePercent, 0) / withProgram.length
              );

        return reply.code(200).send({
          activeStudents: enrollments.length,
          averageAdherencePercent,
          sessionsCompletedThisWeek: perStudent.reduce((sum, row) => sum + row.completedThisWeek, 0),
          studentsBelowAdherence: withProgram.filter(
            (row) => row.adherencePercent < LOW_ADHERENCE_THRESHOLD
          ).length,
        });
      } catch (error) {
        fastify.log.error(error, 'GET /professional/dashboard failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while loading dashboard',
        });
      }
    }
  );

  /**
   * GET /api/v1/professional/students/:id
   * Student ficha: active program + last session + adherence.
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/v1/professional/students/:id',
    async (request, reply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      const studentId = request.params.id;
      const enrollment = await requireOwnedActiveEnrollment(reply, user.userId, studentId);
      if (!enrollment) return;

      try {
        const weekStart = startOfIsoWeekUtc();
        const student = await prisma.user.findUnique({
          where: { id: studentId },
          select: { id: true, name: true, email: true },
        });

        if (!student) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Student not found',
          });
        }

        const program = await prisma.program.findFirst({
          where: { enrollmentId: enrollment.id, status: 'ACTIVE' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: exerciseWithMediaInclude,
            },
            sessions: {
              where: { status: 'COMPLETED' },
              orderBy: { completedAt: 'desc' },
            },
          },
        });

        const completedThisWeek = program
          ? countCompletedThisWeek(program.sessions, weekStart)
          : 0;
        const target = program?.targetSessionsPerWeek ?? 0;
        const loggedExerciseIds = program
          ? await exerciseIdsWithSessionLogs(program.exercises.map((exercise) => exercise.id))
          : new Set<string>();

        return reply.code(200).send({
          student,
          enrollment: {
            id: enrollment.id,
            category: enrollment.category,
            status: enrollment.status,
            startedAt: enrollment.startedAt.toISOString(),
          },
          program: program ? serializeProgram(program, program.exercises, loggedExerciseIds) : null,
          lastSession: program ? lastCompletedSession(program.sessions) : null,
          completedSessionsThisWeek: completedThisWeek,
          adherencePercent: adherencePercent(completedThisWeek, target),
        });
      } catch (error) {
        fastify.log.error(error, 'GET /professional/students/:id failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while loading student',
        });
      }
    }
  );

  /**
   * POST /api/v1/professional/students/:studentId/programs
   * Create the first ACTIVE program for an enrollment (needed when seed/program is absent).
   */
  fastify.post<{ Params: { studentId: string }; Body: CreateProgramBody }>(
    '/api/v1/professional/students/:studentId/programs',
    {
      config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      const enrollment = await requireOwnedActiveEnrollment(
        reply,
        user.userId,
        request.params.studentId
      );
      if (!enrollment) return;

      if (!request.body || typeof request.body !== 'object') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Request body is required',
        });
      }

      const meta = parseProgramMetadata(request.body);
      if (!meta.ok) {
        return reply.code(422).send({ error: 'Validation Error', message: meta.message });
      }
      if (!meta.title || meta.targetSessionsPerWeek === undefined) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'title and targetSessionsPerWeek are required',
        });
      }

      let exercises: ParsedExercise[] = [];
      if (request.body.exercises !== undefined) {
        const parsed = parseExercises(request.body.exercises);
        if (!parsed.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: parsed.message });
        }
        const resolved = await resolveExerciseDefaults(user.userId, parsed.exercises);
        if (!resolved.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: resolved.message });
        }
        exercises = resolved.exercises;
      }

      try {
        const existing = await prisma.program.findFirst({
          where: { enrollmentId: enrollment.id, status: 'ACTIVE' },
        });
        if (existing) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'An active program already exists for this student',
          });
        }

        const program = await prisma.program.create({
          data: {
            enrollmentId: enrollment.id,
            title: meta.title,
            phaseLabel: meta.phaseLabel ?? null,
            targetSessionsPerWeek: meta.targetSessionsPerWeek,
            exercises: {
              create: exercises.map((exercise) => ({
                orderIndex: exercise.orderIndex,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                notes: exercise.notes,
                precautions: exercise.precautions,
                catalogItemId: exercise.catalogItemId,
                professionalExerciseId: exercise.professionalExerciseId,
              })),
            },
          },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: exerciseWithMediaInclude,
            },
          },
        });

        return reply.code(200).send({ program: serializeProgram(program, program.exercises) });
      } catch (error) {
        fastify.log.error(error, 'POST /professional/students/:studentId/programs failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating program',
        });
      }
    }
  );

  /**
   * PUT /api/v1/professional/programs/:programId
   * Update metadata + sync exercises.
   * Exercises with SessionExerciseLog cannot be removed (422 + blocked_exercise_ids).
   */
  fastify.put<{ Params: { programId: string }; Body: UpdateProgramBody }>(
    '/api/v1/professional/programs/:programId',
    {
      config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      if (!request.body || typeof request.body !== 'object') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Request body is required',
        });
      }

      const program = await loadOwnedProgram(user.userId, request.params.programId);
      if (!program) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Program not found',
        });
      }

      const meta = parseProgramMetadata(request.body);
      if (!meta.ok) {
        return reply.code(422).send({ error: 'Validation Error', message: meta.message });
      }

      let incoming: ParsedExercise[] | undefined;
      if (request.body.exercises !== undefined) {
        const parsed = parseExercises(request.body.exercises);
        if (!parsed.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: parsed.message });
        }
        const resolved = await resolveExerciseDefaults(user.userId, parsed.exercises);
        if (!resolved.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: resolved.message });
        }
        incoming = resolved.exercises;
      }

      try {
        const updated = await prisma.$transaction(async (tx) => {
          await tx.program.update({
            where: { id: program.id },
            data: {
              ...(meta.title !== undefined ? { title: meta.title } : {}),
              ...(meta.phaseLabel !== undefined ? { phaseLabel: meta.phaseLabel } : {}),
              ...(meta.targetSessionsPerWeek !== undefined
                ? { targetSessionsPerWeek: meta.targetSessionsPerWeek }
                : {}),
            },
          });

          if (incoming) {
            const visible = program.exercises.filter((exercise) => exercise.removedAt === null);
            const incomingIds = new Set(
              incoming.filter((exercise) => exercise.id).map((exercise) => exercise.id as string)
            );

            const toRemove = visible.filter((exercise) => !incomingIds.has(exercise.id));
            if (toRemove.length > 0) {
              const logs = await tx.sessionExerciseLog.findMany({
                where: { programExerciseId: { in: toRemove.map((exercise) => exercise.id) } },
                select: { programExerciseId: true },
              });
              const blocked = [...new Set(logs.map((log) => log.programExerciseId))];
              if (blocked.length > 0) {
                const err = new Error('BLOCKED_EXERCISE_DELETE');
                (err as Error & { blockedIds: string[] }).blockedIds = blocked;
                throw err;
              }

              await tx.programExercise.updateMany({
                where: { id: { in: toRemove.map((exercise) => exercise.id) } },
                data: { removedAt: new Date() },
              });
            }

            const kept = incoming.filter((exercise) => exercise.id);
            for (const exercise of kept) {
              const existing = visible.find((row) => row.id === exercise.id);
              if (!existing) {
                throw new Error('UNKNOWN_EXERCISE');
              }
            }

            // Park orderIndex values so swaps do not trip the partial unique index
            for (const [index, exercise] of kept.entries()) {
              await tx.programExercise.update({
                where: { id: exercise.id as string },
                data: { orderIndex: 1000 + index },
              });
            }

            for (const exercise of incoming) {
              if (exercise.id) {
                await tx.programExercise.update({
                  where: { id: exercise.id },
                  data: {
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    notes: exercise.notes,
                    precautions: exercise.precautions,
                    orderIndex: exercise.orderIndex,
                    catalogItemId: exercise.catalogItemId,
                    professionalExerciseId: exercise.professionalExerciseId,
                  },
                });
              } else {
                await tx.programExercise.create({
                  data: {
                    programId: program.id,
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    notes: exercise.notes,
                    precautions: exercise.precautions,
                    orderIndex: exercise.orderIndex,
                    catalogItemId: exercise.catalogItemId,
                    professionalExerciseId: exercise.professionalExerciseId,
                  },
                });
              }
            }
          }

          return tx.program.findUniqueOrThrow({
            where: { id: program.id },
            include: {
              exercises: {
                orderBy: { orderIndex: 'asc' },
                include: exerciseWithMediaInclude,
              },
            },
          });
        });

        const loggedExerciseIds = await exerciseIdsWithSessionLogs(
          updated.exercises.map((exercise) => exercise.id)
        );
        return reply.code(200).send({
          program: serializeProgram(updated, updated.exercises, loggedExerciseIds),
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'BLOCKED_EXERCISE_DELETE') {
          const blockedIds = (error as Error & { blockedIds?: string[] }).blockedIds ?? [];
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'Cannot remove exercises that already have session logs',
            blocked_exercise_ids: blockedIds,
          });
        }
        if (error instanceof Error && error.message === 'UNKNOWN_EXERCISE') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'One or more exercise ids do not belong to this program',
          });
        }
        fastify.log.error(error, 'PUT /professional/programs/:programId failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating program',
        });
      }
    }
  );

  /**
   * GET /api/v1/professional/students/:studentId/chart
   * Clinical notes + pain timeline (completed sessions with VAS and/or patientNote).
   */
  fastify.get<{ Params: { studentId: string } }>(
    '/api/v1/professional/students/:studentId/chart',
    async (request, reply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      const enrollment = await requireOwnedActiveEnrollment(
        reply,
        user.userId,
        request.params.studentId
      );
      if (!enrollment) return;

      try {
        const [notes, sessions] = await Promise.all([
          prisma.clinicalNote.findMany({
            where: {
              studentId: request.params.studentId,
              professionalId: user.userId,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.workoutSession.findMany({
            where: {
              studentId: request.params.studentId,
              status: 'COMPLETED',
              program: { enrollmentId: enrollment.id },
              OR: [{ painLevel: { not: null } }, { patientNote: { not: null } }],
            },
            orderBy: { completedAt: 'asc' },
            select: {
              id: true,
              completedAt: true,
              painLevel: true,
              patientNote: true,
            },
          }),
        ]);

        return reply.code(200).send({
          notes: notes.map((note) => ({
            id: note.id,
            conduta: note.conduta,
            evolucao: note.evolucao,
            informacoesPertinentes: note.informacoesPertinentes,
            createdAt: note.createdAt.toISOString(),
            professionalId: note.professionalId,
          })),
          painTimeline: sessions.map((session) => ({
            sessionId: session.id,
            completedAt: session.completedAt?.toISOString() ?? null,
            painLevel: session.painLevel,
            patientNote: session.patientNote,
          })),
        });
      } catch (error) {
        fastify.log.error(error, 'GET /professional/students/:studentId/chart failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while loading chart',
        });
      }
    }
  );

  /**
   * POST /api/v1/professional/students/:studentId/notes
   * Append-only ClinicalNote on an ACTIVE enrollment.
   */
  fastify.post<{ Params: { studentId: string }; Body: CreateNoteBody }>(
    '/api/v1/professional/students/:studentId/notes',
    {
      config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      const enrollment = await requireOwnedActiveEnrollment(
        reply,
        user.userId,
        request.params.studentId
      );
      if (!enrollment) return;

      if (!request.body || typeof request.body !== 'object') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Request body is required',
        });
      }

      const conduta = parseRequiredText(request.body.conduta, 'conduta');
      const evolucao = parseRequiredText(request.body.evolucao, 'evolucao');
      const informacoesPertinentes = parseRequiredText(
        request.body.informacoesPertinentes,
        'informacoesPertinentes'
      );

      if (!conduta || !evolucao || !informacoesPertinentes) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'conduta, evolucao and informacoesPertinentes are required',
        });
      }

      try {
        const note = await prisma.clinicalNote.create({
          data: {
            studentId: request.params.studentId,
            professionalId: user.userId,
            conduta,
            evolucao,
            informacoesPertinentes,
          },
        });

        return reply.code(200).send({
          note: {
            id: note.id,
            conduta: note.conduta,
            evolucao: note.evolucao,
            informacoesPertinentes: note.informacoesPertinentes,
            createdAt: note.createdAt.toISOString(),
            professionalId: note.professionalId,
            studentId: note.studentId,
          },
        });
      } catch (error) {
        fastify.log.error(error, 'POST /professional/students/:studentId/notes failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating note',
        });
      }
    }
  );
}
