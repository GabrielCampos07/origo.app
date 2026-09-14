import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { legalRoutes, REQUIRED_DOCS_ALL_USERS, REQUIRED_DOCS_PROFESSIONAL } from './routes/legal';
import { referralRoutes } from './routes/referrals';
import { stripeWebhookRoutes } from './routes/stripe-webhook';
import { checkoutRoutes } from './routes/checkout';
import { inviteRoutes } from './routes/invites';
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
  bodyLimit: 1048576, // 1MB
});

async function start() {
  try {
    // BACKEND SECURITY: Fail-fast on missing required secrets in production
    if (process.env.NODE_ENV === 'production') {
      const requiredSecrets = {
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
      };
      
      const missingSecrets = Object.entries(requiredSecrets)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
      
      if (missingSecrets.length > 0) {
        console.error(`FATAL: Required environment variables missing in production: ${missingSecrets.join(', ')}`);
        process.exit(1);
      }
    }
    
    // BACKEND SECURITY: CORS fail-closed - only allow FRONTEND_URL origin
    // SECURITY: Fail-fast if FRONTEND_URL is missing in production
    const FRONTEND_URL = process.env.FRONTEND_URL;
    if (!FRONTEND_URL) {
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: FRONTEND_URL environment variable is required in production for CORS allowlist');
        process.exit(1);
      }
      console.warn('WARNING: FRONTEND_URL not set. Using default http://localhost:3456');
    }
    
    const allowedOrigin = FRONTEND_URL || 'http://localhost:3456';
    
    await server.register(cors, {
      origin: allowedOrigin,
      credentials: true,
    });

    // Global rate limiting (D4: protect against abuse)
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
      redis: undefined,
    });

    // SECURITY: Custom content type parser for Stripe webhook to preserve raw body bytes
    // This is ONLY for /api/v1/webhooks/stripe route for signature verification
    // Stripe signs the exact raw bytes, so we cannot use parsed JSON
    server.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      async (request: any, rawBody: Buffer) => {
        // Store raw body for Stripe webhook signature verification
        request.rawBody = rawBody;
        
        // Parse JSON for normal request handling
        try {
          return JSON.parse(rawBody.toString('utf8'));
        } catch (error) {
          // Let Fastify handle JSON parse errors
          throw error;
        }
      }
    );

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
        },
      };
    });

    // Register auth routes
    await server.register(authRoutes);

    // Register legal routes (Legal V2)
    await server.register(legalRoutes);

    // Register referral routes (Referral MVP)
    await server.register(referralRoutes);

    // Register checkout routes (Checkout Session P0)
    await server.register(checkoutRoutes);

    // Register Stripe webhook routes (Referral MVP payouts)
    await server.register(stripeWebhookRoutes);

    // Register invite routes (Bloco A Slice 1)
    await server.register(inviteRoutes);

    // Payment gate enforcement middleware (403 if PROFESSIONAL without active subscription)
    // BACKEND SECURITY: Fail-closed payment gate for PROFESSIONAL users
    // 1. PROFESSIONAL users without subscriptionActive = true are blocked (403 payment_required)
    // 2. STUDENT users bypass payment gate (not subject to payment requirement)
    // 3. Allowlist exceptions (no gate): auth, legal, checkout, webhooks, health, public endpoints
    // 4. Runs BEFORE legal middleware to fail fast on payment issues
    // 5. User fetched once and attached to request for downstream use
    server.addHook('onRequest', async (request, reply) => {
      // Exception list: routes that should NOT be blocked by payment gate
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

      // Skip enforcement for exempt routes
      if (exemptRoutes.includes(requestPath)) {
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

        // Fetch user with legalAcceptances for both middlewares
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

        // Attach authenticated user to request for route handlers and legal middleware
        // @ts-ignore - Adding custom property to request
        request.authenticatedUser = {
          userId: user.id,
          email: user.email,
          role: user.role,
          subscriptionActive: user.subscriptionActive,
        };

        // PAYMENT GATE: Block PROFESSIONAL users without active subscription
        if (user.role === 'PROFESSIONAL' && !user.subscriptionActive) {
          return reply.code(403).send({
            error: 'payment_required',
            message: 'Pagamento pendente. Complete o checkout para ativar sua conta.',
          });
        }
      } catch (error) {
        // JWT verification failed - let it pass through
        // Route handler will properly handle auth errors (returns 401)
        server.log.warn(error, 'Payment gate middleware: JWT verification failed');
        return;
      }
    });

    // Legal acceptance enforcement middleware (403 if missing required docs)
    // BACKEND SECURITY: Criteria enforced
    // 1. Only after valid JWT - missing/invalid token stays 401 (not 403)
    // 2. 403 only when authenticated user missing required docs for role
    // 3. missing_doc_versions calculated server-side from JWT userId + DB role + LegalAcceptance SELECT
    // 4. Allowlist exceptions (no gate): auth routes + /legal/accept + /legal/missing + /health
    // 5. No bypass via header/query; userId/role only from JWT+DB
    // 6. Uses 403 (not 451)
    // 7. Middleware SELECT only; accept stays createMany/skipDuplicates append-only
    // 8. Reuses authenticatedUser from payment gate middleware if available
    server.addHook('onRequest', async (request, reply) => {
      // Exception list: routes that should NOT be blocked by legal acceptance
      // SECURITY: Use path only (not full URL) to prevent query parameter bypass
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

      // Extract path without query parameters (prevent bypass via ?foo=bar)
      const requestPath = request.url.split('?')[0];

      // SECURITY: Also exempt POST /api/v1/invites/validate (public validate endpoint)
      if (requestPath === '/api/v1/invites/validate') {
        return;
      }

      // Skip enforcement for exempt routes
      if (exemptRoutes.includes(requestPath)) {
        return;
      }

      // Reuse authenticatedUser from payment gate middleware if available
      // @ts-ignore - Custom property added by payment gate middleware
      let user = request.authenticatedUser ? await prisma.user.findUnique({
        where: { id: (request.authenticatedUser as any).userId },
        include: {
          legalAcceptances: {
            select: { docVersion: true },
          },
        },
      }) : null;

      // If payment gate didn't run (exempt route or no auth), extract from JWT
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

          // Attach authenticated user to request if not already done
          // @ts-ignore - Adding custom property to request
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

        // SECURITY: Determine required docs based on DB role (server-side calculation)
        // PROFESSIONAL: privacy + terms_app + terms_saas + payments_notice
        // STUDENT: privacy + terms_app
        const requiredDocs = [
          ...REQUIRED_DOCS_ALL_USERS,
          ...(user.role === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
        ];

        // SECURITY: Calculate missing docs from DB acceptances (server-side)
        const acceptedDocVersions = new Set(user.legalAcceptances.map(a => a.docVersion));
        const missingDocVersions = requiredDocs.filter(doc => !acceptedDocVersions.has(doc));

        // SECURITY: Return 403 (not 451) with missing_doc_versions calculated server-side
        if (missingDocVersions.length > 0) {
          return reply.code(403).send({
            error: 'legal_acceptance_required',
            missing_doc_versions: missingDocVersions,
          });
        }
      } catch (error) {
        // JWT verification failed or other error - let it pass through
        // Route handler will properly handle auth errors (returns 401)
        // SECURITY: Invalid JWT stays 401 (not 403)
        server.log.warn(error, 'Legal acceptance middleware: JWT verification failed');
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
