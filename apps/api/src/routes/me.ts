import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../lib/authz';

const prisma = new PrismaClient();

const NAME_MAX = 120;

function serializeMe(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionActive: boolean;
  professionalProfile: { category: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionActive: user.subscriptionActive,
    category: user.professionalProfile?.category ?? null,
  };
}

export async function meRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/me
   * Current user profile for account UI (exempt from payment gate).
   */
  fastify.get('/api/v1/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionActive: true,
          professionalProfile: { select: { category: true } },
        },
      });

      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      return reply.code(200).send(serializeMe(user));
    } catch (error) {
      fastify.log.error(error, 'GET /me failed');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An error occurred while loading profile',
      });
    }
  });

  /**
   * PATCH /api/v1/me
   * Update display name (and future account fields). Payment-gate exempt.
   */
  fastify.patch<{ Body: { name?: unknown } }>(
    '/api/v1/me',
    {
      config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
    },
    async (request, reply) => {
      const auth = await requireAuth(request, reply);
      if (!auth) return;

      try {
        if (!request.body || typeof request.body !== 'object') {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Request body is required',
          });
        }

        if (!('name' in request.body)) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Field name is required',
          });
        }

        const rawName = request.body.name;
        if (rawName !== null && typeof rawName !== 'string') {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'name must be a string or null',
          });
        }

        let name: string | null = null;
        if (typeof rawName === 'string') {
          const trimmed = rawName.trim().replace(/\s+/g, ' ');
          if (trimmed.length > NAME_MAX) {
            return reply.code(400).send({
              error: 'Bad Request',
              message: `name must be at most ${NAME_MAX} characters`,
            });
          }
          name = trimmed.length > 0 ? trimmed : null;
        }

        const user = await prisma.user.update({
          where: { id: auth.userId },
          data: { name },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            subscriptionActive: true,
            professionalProfile: { select: { category: true } },
          },
        });

        return reply.code(200).send(serializeMe(user));
      } catch (error) {
        fastify.log.error(error, 'PATCH /me failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating profile',
        });
      }
    }
  );
}
