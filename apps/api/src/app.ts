import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { legalRoutes, REQUIRED_DOCS_ALL_USERS, REQUIRED_DOCS_PROFESSIONAL } from './routes/legal';
import { referralRoutes } from './routes/referrals';
import { stripeWebhookRoutes } from './routes/stripe-webhook';
import { checkoutRoutes } from './routes/checkout';
import { inviteRoutes } from './routes/invites';
import { professionalHepRoutes } from './routes/professional-hep';
import { studentHepRoutes } from './routes/student-hep';
import { exerciseCatalogRoutes } from './routes/exercise-catalog';
import { professionalExerciseRoutes } from './routes/professional-exercises';
import { verifyAccessToken } from './lib/jwt';

export const prisma = new PrismaClient({
  log: process.env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

export async function buildApp(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info'),
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            headers: {
              host: request.headers.host,
              'user-agent': request.headers['user-agent'],
            },
          };
        },
      },
    },
    bodyLimit: 1048576, // 1MB
  });

  if (process.env.NODE_ENV === 'production') {
    const requiredSecrets = {
      JWT_SECRET: process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
    };

    const missingSecrets = Object.entries(requiredSecrets)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingSecrets.length > 0) {
      throw new Error(
        `FATAL: Required environment variables missing in production: ${missingSecrets.join(', ')}`
      );
    }
  }

  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: FRONTEND_URL environment variable is required in production for CORS allowlist');
  }

  const allowedOrigin = FRONTEND_URL || 'http://localhost:3456';

  await server.register(cors, {
    origin: allowedOrigin,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: process.env.NODE_ENV === 'test' ? 10000 : 100,
    timeWindow: '15 minutes',
    redis: undefined,
  });

  server.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    async (request: { rawBody?: Buffer }, rawBody: Buffer) => {
      request.rawBody = rawBody;

      try {
        return JSON.parse(rawBody.toString('utf8'));
      } catch (error) {
        throw error;
      }
    }
  );

  server.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      server.log.error(error, 'Health check failed');
      reply.code(503);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });

  server.get('/api/v1', async () => {
    return {
      message: 'Origo API v1',
      version: '0.1.0',
      endpoints: {
        auth: {
          login: 'POST /api/v1/auth/login',
          forgotPassword: 'POST /api/v1/auth/forgot-password',
          resetPassword: 'POST /api/v1/auth/reset-password',
          registerProfessional: 'POST /api/v1/auth/register/professional',
          registerStudent: 'POST /api/v1/auth/register/student',
        },
        invites: {
          create: 'POST /api/v1/invites',
          validate: 'POST /api/v1/invites/validate',
        },
        legal: {
          accept: 'POST /api/v1/legal/accept',
          missing: 'GET /api/v1/legal/missing',
        },
        referrals: {
          code: 'GET /api/v1/referrals/code',
          status: 'GET /api/v1/referrals/status',
          validate: 'POST /api/v1/referrals/validate',
        },
        checkout: {
          session: 'POST /api/v1/checkout/session',
        },
        webhooks: {
          stripe: 'POST /api/v1/webhooks/stripe',
        },
        professional: {
          students: 'GET /api/v1/professional/students',
          studentDetail: 'GET /api/v1/professional/students/:id',
          dashboard: 'GET /api/v1/professional/dashboard',
          createProgram: 'POST /api/v1/professional/students/:studentId/programs',
          updateProgram: 'PUT /api/v1/professional/programs/:programId',
          chart: 'GET /api/v1/professional/students/:studentId/chart',
          notes: 'POST /api/v1/professional/students/:studentId/notes',
          exerciseCatalog: 'GET /api/v1/exercises/catalog',
          myExercises: 'GET /api/v1/me/exercises',
          createMyExercise: 'POST /api/v1/me/exercises',
          updateMyExercise: 'PATCH /api/v1/me/exercises/:id',
        },
        me: {
          program: 'GET /api/v1/me/program',
          todaySummary: 'GET /api/v1/me/today-summary',
          startSession: 'POST /api/v1/me/sessions',
          completeExercise: 'POST /api/v1/me/sessions/:sessionId/exercises/:exerciseId/complete',
          completeSession: 'POST /api/v1/me/sessions/:sessionId/complete',
          progress: 'GET /api/v1/me/progress',
          exercises: 'GET /api/v1/me/exercises',
        },
      },
    };
  });

  await server.register(authRoutes);
  await server.register(legalRoutes);
  await server.register(referralRoutes);
  await server.register(checkoutRoutes);
  await server.register(stripeWebhookRoutes);
  await server.register(inviteRoutes);
  await server.register(professionalHepRoutes);
  await server.register(studentHepRoutes);
  await server.register(exerciseCatalogRoutes);
  await server.register(professionalExerciseRoutes);

  server.addHook('onRequest', async (request, reply) => {
    const exemptRoutes = [
      '/health',
      '/api/v1',
      '/api/v1/auth/login',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/register/professional',
      '/api/v1/auth/register/student',
      '/api/v1/legal/accept',
      '/api/v1/legal/missing',
      '/api/v1/checkout/session',
      '/api/v1/referrals/validate',
      '/api/v1/webhooks/stripe',
      '/api/v1/invites/validate',
    ];

    const requestPath = request.url.split('?')[0];

    if (exemptRoutes.includes(requestPath)) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }

    try {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      const userId = payload.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          legalAcceptances: {
            select: { docVersion: true },
          },
        },
      });

      if (!user) {
        return;
      }

      request.authenticatedUser = {
        userId: user.id,
        email: user.email,
        role: user.role,
        subscriptionActive: user.subscriptionActive,
      };

      if (user.role === 'PROFESSIONAL' && !user.subscriptionActive) {
        return reply.code(403).send({
          error: 'payment_required',
          message: 'Pagamento pendente. Complete o checkout para ativar sua conta.',
        });
      }
    } catch (error) {
      server.log.warn(error, 'Payment gate middleware: JWT verification failed');
      return;
    }
  });

  server.addHook('onRequest', async (request, reply) => {
    const exemptRoutes = [
      '/health',
      '/api/v1',
      '/api/v1/auth/login',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/register/professional',
      '/api/v1/auth/register/student',
      '/api/v1/legal/accept',
      '/api/v1/legal/missing',
      '/api/v1/referrals/validate',
      '/api/v1/webhooks/stripe',
    ];

    const requestPath = request.url.split('?')[0];

    if (requestPath === '/api/v1/invites/validate') {
      return;
    }

    if (exemptRoutes.includes(requestPath)) {
      return;
    }

    let user = request.authenticatedUser
      ? await prisma.user.findUnique({
          where: { id: request.authenticatedUser.userId },
          include: {
            legalAcceptances: {
              select: { docVersion: true },
            },
          },
        })
      : null;

    if (!user) {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return;
      }

      try {
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        const userId = payload.userId;

        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            legalAcceptances: {
              select: { docVersion: true },
            },
          },
        });

        if (!user) {
          return;
        }

        request.authenticatedUser = {
          userId: user.id,
          email: user.email,
          role: user.role,
          subscriptionActive: user.subscriptionActive,
        };
      } catch (error) {
        server.log.warn(error, 'Legal acceptance middleware: JWT verification failed');
        return;
      }
    }

    const requiredDocs = [
      ...REQUIRED_DOCS_ALL_USERS,
      ...(user.role === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
    ];

    const acceptedDocVersions = new Set(user.legalAcceptances.map((a) => a.docVersion));
    const missingDocVersions = requiredDocs.filter((doc) => !acceptedDocVersions.has(doc));

    if (missingDocVersions.length > 0) {
      return reply.code(403).send({
        error: 'legal_acceptance_required',
        missing_doc_versions: missingDocVersions,
      });
    }
  });

  return server;
}
