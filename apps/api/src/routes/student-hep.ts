import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireStudent } from '../lib/authz';
import {
  adherencePercent,
  countCompletedThisWeek,
  parseOptionalPainLevel,
  serializeExercise,
  startOfIsoWeekUtc,
  weeksAgoUtc,
} from '../lib/hep';

const prisma = new PrismaClient();

async function loadActiveStudentContext(studentId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentUserId: studentId, status: 'ACTIVE' },
    include: {
      professional: { select: { id: true, name: true } },
      programs: {
        where: { status: 'ACTIVE' },
        include: {
          exercises: {
            where: { removedAt: null },
            orderBy: { orderIndex: 'asc' },
          },
          sessions: {
            orderBy: { startedAt: 'desc' },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  const program = enrollment.programs[0] ?? null;
  return { enrollment, program };
}

function serializeSession(
  session: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    painLevel: number | null;
  },
  completedExerciseIds: string[] = []
) {
  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    painLevel: session.painLevel,
    completedExerciseIds,
  };
}

function buildTodaySummary(
  program: {
    title: string;
    phaseLabel: string | null;
    targetSessionsPerWeek: number;
    exercises: Array<{
      id: string;
      orderIndex: number;
      name: string;
      sets: number;
      reps: string;
      notes: string | null;
      precautions: string | null;
    }>;
    sessions: Array<{
      id: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
      painLevel: number | null;
    }>;
  },
  currentSession: { id: string; completedExerciseIds: string[] } | null,
  weekStart: Date
) {
  const completedThisWeek = countCompletedThisWeek(program.sessions, weekStart);
  const remaining = Math.max(0, program.targetSessionsPerWeek - completedThisWeek);
  const completedIds = new Set(currentSession?.completedExerciseIds ?? []);

  return {
    programTitle: program.title,
    phaseLabel: program.phaseLabel,
    targetSessionsPerWeek: program.targetSessionsPerWeek,
    completedSessionsThisWeek: completedThisWeek,
    remainingSessionsThisWeek: remaining,
    adherencePercent: adherencePercent(completedThisWeek, program.targetSessionsPerWeek),
    currentSessionId: currentSession?.id ?? null,
    exercises: program.exercises.map((exercise) => ({
      ...serializeExercise(exercise),
      completedInCurrentSession: completedIds.has(exercise.id),
    })),
  };
}

export async function studentHepRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/me/program
   * Active program + exercises + today summary fields + current session.
   */
  fastify.get('/api/v1/me/program', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireStudent(request, reply);
    if (!user) return;

    try {
      const ctx = await loadActiveStudentContext(user.userId);
      if (!ctx) {
        return reply.code(200).send({
          program: null,
          enrollment: null,
          today: null,
          currentSession: null,
        });
      }

      const { enrollment, program } = ctx;
      if (!program) {
        return reply.code(200).send({
          program: null,
          enrollment: {
            id: enrollment.id,
            category: enrollment.category,
            professionalName: enrollment.professional.name,
          },
          today: null,
          currentSession: null,
        });
      }

      const inProgress = program.sessions.find((session) => session.status === 'IN_PROGRESS') ?? null;
      let completedExerciseIds: string[] = [];
      if (inProgress) {
        const logs = await prisma.sessionExerciseLog.findMany({
          where: { sessionId: inProgress.id },
          select: { programExerciseId: true },
        });
        completedExerciseIds = logs.map((log) => log.programExerciseId);
      }

      const currentSession = inProgress
        ? serializeSession(inProgress, completedExerciseIds)
        : null;
      const weekStart = startOfIsoWeekUtc();

      return reply.code(200).send({
        program: {
          id: program.id,
          title: program.title,
          phaseLabel: program.phaseLabel,
          status: program.status,
          targetSessionsPerWeek: program.targetSessionsPerWeek,
          exercises: program.exercises.map(serializeExercise),
        },
        enrollment: {
          id: enrollment.id,
          category: enrollment.category,
          professionalName: enrollment.professional.name,
        },
        today: buildTodaySummary(
          program,
          inProgress ? { id: inProgress.id, completedExerciseIds } : null,
          weekStart
        ),
        currentSession,
      });
    } catch (error) {
      fastify.log.error(error, 'GET /me/program failed');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred while loading program',
      });
    }
  });

  /**
   * GET /api/v1/me/today-summary
   * Same cards as the `today` object on GET /me/program.
   */
  fastify.get('/api/v1/me/today-summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireStudent(request, reply);
    if (!user) return;

    try {
      const ctx = await loadActiveStudentContext(user.userId);
      if (!ctx?.program) {
        return reply.code(200).send({
          today: null,
        });
      }

      const inProgress = ctx.program.sessions.find((session) => session.status === 'IN_PROGRESS') ?? null;
      let completedExerciseIds: string[] = [];
      if (inProgress) {
        const logs = await prisma.sessionExerciseLog.findMany({
          where: { sessionId: inProgress.id },
          select: { programExerciseId: true },
        });
        completedExerciseIds = logs.map((log) => log.programExerciseId);
      }

      return reply.code(200).send({
        today: buildTodaySummary(
          ctx.program,
          inProgress ? { id: inProgress.id, completedExerciseIds } : null,
          startOfIsoWeekUtc()
        ),
      });
    } catch (error) {
      fastify.log.error(error, 'GET /me/today-summary failed');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred while loading today summary',
      });
    }
  });

  /**
   * POST /api/v1/me/sessions
   * Start a new IN_PROGRESS session or resume the existing one.
   */
  fastify.post(
    '/api/v1/me/sessions',
    {
      config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireStudent(request, reply);
      if (!user) return;

      try {
        const ctx = await loadActiveStudentContext(user.userId);
        if (!ctx?.program) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'No active program found',
          });
        }

        const existing = ctx.program.sessions.find((session) => session.status === 'IN_PROGRESS');
        const session =
          existing ??
          (await prisma.workoutSession.create({
            data: {
              programId: ctx.program.id,
              studentId: user.userId,
              status: 'IN_PROGRESS',
            },
          }));

        const logs = await prisma.sessionExerciseLog.findMany({
          where: { sessionId: session.id },
          select: { programExerciseId: true, setsCompleted: true, completedAt: true },
        });

        return reply.code(200).send({
          session: serializeSession(
            session,
            logs.map((log) => log.programExerciseId)
          ),
          resumed: Boolean(existing),
          exercises: ctx.program.exercises.map((exercise) => ({
            ...serializeExercise(exercise),
            completed: logs.some((log) => log.programExerciseId === exercise.id),
          })),
        });
      } catch (error) {
        fastify.log.error(error, 'POST /me/sessions failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while starting session',
        });
      }
    }
  );

  /**
   * POST /api/v1/me/sessions/:sessionId/exercises/:exerciseId/complete
   * Mark a prescribed exercise complete (idempotent upsert).
   */
  fastify.post<{
    Params: { sessionId: string; exerciseId: string };
    Body: { setsCompleted?: unknown };
  }>(
    '/api/v1/me/sessions/:sessionId/exercises/:exerciseId/complete',
    {
      config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const user = await requireStudent(request, reply);
      if (!user) return;

      try {
        const session = await prisma.workoutSession.findFirst({
          where: { id: request.params.sessionId, studentId: user.userId },
          include: {
            program: {
              include: {
                exercises: {
                  where: { id: request.params.exerciseId, removedAt: null },
                },
                enrollment: true,
              },
            },
          },
        });

        if (!session || session.program.enrollment.studentUserId !== user.userId) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Session not found',
          });
        }

        if (session.status !== 'IN_PROGRESS') {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Session is already completed',
          });
        }

        const exercise = session.program.exercises[0];
        if (!exercise) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Exercise not found',
          });
        }

        let setsCompleted = exercise.sets;
        if (request.body && typeof request.body === 'object' && request.body.setsCompleted !== undefined) {
          const raw = Number(request.body.setsCompleted);
          if (!Number.isInteger(raw) || raw < 0 || raw > 50) {
            return reply.code(422).send({
              error: 'Validation Error',
              message: 'setsCompleted must be an integer between 0 and 50',
            });
          }
          setsCompleted = raw;
        }

        const log = await prisma.sessionExerciseLog.upsert({
          where: {
            sessionId_programExerciseId: {
              sessionId: session.id,
              programExerciseId: exercise.id,
            },
          },
          create: {
            sessionId: session.id,
            programExerciseId: exercise.id,
            setsCompleted,
          },
          update: {
            setsCompleted,
            completedAt: new Date(),
          },
        });

        return reply.code(200).send({
          log: {
            id: log.id,
            sessionId: log.sessionId,
            programExerciseId: log.programExerciseId,
            setsCompleted: log.setsCompleted,
            completedAt: log.completedAt.toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error, 'POST /me/sessions/:sessionId/exercises/:exerciseId/complete failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while completing exercise',
        });
      }
    }
  );

  /**
   * POST /api/v1/me/sessions/:sessionId/complete
   * Finish session. Optional body: { painLevel: 0-10 }.
   */
  fastify.post<{ Params: { sessionId: string }; Body: { painLevel?: unknown; pain_level?: unknown } }>(
    '/api/v1/me/sessions/:sessionId/complete',
    {
      config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const user = await requireStudent(request, reply);
      if (!user) return;

      const pain = parseOptionalPainLevel(request.body ?? {});
      if (!pain.ok) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'painLevel must be an integer between 0 and 10',
        });
      }

      try {
        const session = await prisma.workoutSession.findFirst({
          where: { id: request.params.sessionId, studentId: user.userId },
        });

        if (!session) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Session not found',
          });
        }

        if (session.status === 'COMPLETED') {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Session is already completed',
          });
        }

        const completed = await prisma.workoutSession.update({
          where: { id: session.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            ...(pain.value !== undefined ? { painLevel: pain.value } : {}),
          },
        });

        const logs = await prisma.sessionExerciseLog.findMany({
          where: { sessionId: completed.id },
          select: { programExerciseId: true },
        });

        return reply.code(200).send({
          session: serializeSession(
            completed,
            logs.map((log) => log.programExerciseId)
          ),
        });
      } catch (error) {
        fastify.log.error(error, 'POST /me/sessions/:sessionId/complete failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while completing session',
        });
      }
    }
  );

  /**
   * GET /api/v1/me/progress
   * Dynamic cards: adherence, weekly sessions, totals, VAS.
   */
  fastify.get('/api/v1/me/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireStudent(request, reply);
    if (!user) return;

    try {
      const ctx = await loadActiveStudentContext(user.userId);
      if (!ctx?.program) {
        return reply.code(200).send({ cards: [] });
      }

      const weekStart = startOfIsoWeekUtc();
      const completed = ctx.program.sessions.filter((session) => session.status === 'COMPLETED');
      const completedThisWeek = countCompletedThisWeek(completed, weekStart);
      const target = ctx.program.targetSessionsPerWeek;
      const percent = adherencePercent(completedThisWeek, target);

      const cards: Array<{
        key: string;
        title: string;
        value: number;
        unit: string;
        subtitle: string;
      }> = [
        {
          key: 'adherence',
          title: 'Adesão desta semana',
          value: percent,
          unit: '%',
          subtitle: `${completedThisWeek} de ${target} sessões`,
        },
        {
          key: 'sessions_this_week',
          title: 'Sessões na semana',
          value: completedThisWeek,
          unit: '',
          subtitle: `Meta: ${target}`,
        },
        {
          key: 'total_completed',
          title: 'Sessões concluídas',
          value: completed.length,
          unit: '',
          subtitle: 'Desde o início do programa',
        },
      ];

      const withPain = completed
        .filter((session) => session.painLevel !== null && session.completedAt)
        .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()));

      if (withPain[0]) {
        cards.push({
          key: 'last_pain',
          title: 'Última dor (VAS)',
          value: withPain[0].painLevel as number,
          unit: '/10',
          subtitle: withPain[0].completedAt!.toISOString().slice(0, 10),
        });
      }

      const recentWindow = weeksAgoUtc(4);
      const recentPain = withPain.filter((session) => session.completedAt! >= recentWindow);
      if (recentPain.length > 0) {
        const avg =
          recentPain.reduce((sum, session) => sum + (session.painLevel as number), 0) /
          recentPain.length;
        cards.push({
          key: 'avg_pain',
          title: 'Dor média (4 semanas)',
          value: Math.round(avg * 10) / 10,
          unit: '/10',
          subtitle: `${recentPain.length} registro${recentPain.length === 1 ? '' : 's'}`,
        });
      }

      return reply.code(200).send({ cards });
    } catch (error) {
      fastify.log.error(error, 'GET /me/progress failed');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred while loading progress',
      });
    }
  });
}
