import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';

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
        },
      };
    });

    // Register auth routes
    await server.register(authRoutes);

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
