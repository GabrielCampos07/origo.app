import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { legalRoutes, REQUIRED_DOCS_ALL_USERS, REQUIRED_DOCS_PROFESSIONAL } from './routes/legal';
import { verifyAccessToken } from './lib/jwt';

const prisma = new PrismaClient({
  log: process.env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
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
});

async function start() {
  try {
    await server.register(cors, {
      origin: true,
    });

    // Global rate limiting (D4: protect against abuse)
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
      redis: undefined,
    });

    // Health endpoint (não autenticado)
    server.get('/health', async (request, reply) => {
      try {
        // Ping básico no DB para validar conexão
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

    // API v1 info
    server.get('/api/v1', async (request, reply) => {
      return {
        message: 'Origo API v1',
        version: '0.1.0',
        endpoints: {
          auth: {
            login: 'POST /api/v1/auth/login',
            forgotPassword: 'POST /api/v1/auth/forgot-password',
            resetPassword: 'POST /api/v1/auth/reset-password',
          },
          legal: {
            accept: 'POST /api/v1/legal/accept',
            missing: 'GET /api/v1/legal/missing',
          },
        },
      };
    });

    // Register auth routes
    await server.register(authRoutes);

    // Register legal routes (Legal V2)
    await server.register(legalRoutes);

    // Legal acceptance enforcement middleware (403 if missing required docs)
    server.addHook('onRequest', async (request, reply) => {
      // Exception list: routes that should NOT be blocked by legal acceptance
      const exemptRoutes = [
        '/health',
        '/api/v1',
        '/api/v1/auth/login',
        '/api/v1/auth/forgot-password',
        '/api/v1/auth/reset-password',
        '/api/v1/legal/accept',
        '/api/v1/legal/missing',
      ];

      // Skip enforcement for exempt routes
      if (exemptRoutes.includes(request.url)) {
        return;
      }

      // Skip enforcement for non-authenticated requests (let auth middleware handle 401)
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return;
      }

      try {
        // Extract userId from JWT
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        const userId = payload.userId;

        // Fetch user and their legal acceptances
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            legalAcceptances: {
              select: { docVersion: true },
            },
          },
        });

        if (!user) {
          // User not found - let the route handler deal with it
          return;
        }

        // Determine required docs based on user role
        const requiredDocs = [
          ...REQUIRED_DOCS_ALL_USERS,
          ...(user.role === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
        ];

        // Check which docs are missing
        const acceptedDocVersions = new Set(user.legalAcceptances.map(a => a.docVersion));
        const missingDocVersions = requiredDocs.filter(doc => !acceptedDocVersions.has(doc));

        // If user is missing required docs, return 403
        if (missingDocVersions.length > 0) {
          return reply.code(403).send({
            error: 'legal_acceptance_required',
            missing_doc_versions: missingDocVersions,
          });
        }
      } catch (error) {
        // JWT verification failed or other error - let it pass through
        // The route handler will properly handle auth errors
        return;
      }
    });
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`🚀 Origo API rodando em http://${host}:${port}`);
    server.log.info(`📋 Health check: http://${host}:${port}/health`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  server.log.info('SIGINT recebido, fechando servidor...');
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  server.log.info('SIGTERM recebido, fechando servidor...');
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

start();
