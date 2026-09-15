import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';
import { requireProfessional } from '../lib/authz';

const prisma = new PrismaClient();

const CATALOG_LIMIT = 50;

export async function exerciseCatalogRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/exercises/catalog?q=&tag=
   * Search active catalog items (PROFESSIONAL; payment/legal gates via app hooks).
   */
  fastify.get(
    '/api/v1/exercises/catalog',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      try {
        const query = request.query as { q?: unknown; tag?: unknown };
        const q =
          typeof query.q === 'string' && query.q.trim() ? query.q.trim().slice(0, 120) : '';
        const tag =
          typeof query.tag === 'string' && query.tag.trim()
            ? query.tag.trim().slice(0, 80)
            : '';

        const where: Prisma.ExerciseCatalogItemWhereInput = {
          active: true,
          ...(tag ? { categoryTags: { has: tag } } : {}),
          ...(q
            ? {
                OR: [
                  { namePt: { contains: q, mode: 'insensitive' } },
                  { slug: { contains: q, mode: 'insensitive' } },
                  { categoryTags: { has: q } },
                ],
              }
            : {}),
        };

        const items = await prisma.exerciseCatalogItem.findMany({
          where,
          orderBy: { namePt: 'asc' },
          take: CATALOG_LIMIT,
        });

        return reply.code(200).send({
          items: items.map((item) => ({
            id: item.id,
            slug: item.slug,
            namePt: item.namePt,
            categoryTags: item.categoryTags,
            videoUrl: item.videoUrl,
            thumbnailUrl: item.thumbnailUrl,
            durationSec: item.durationSec,
            cuesPt: item.cuesPt,
          })),
        });
      } catch (error) {
        fastify.log.error(error, 'GET /exercises/catalog failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while searching the exercise catalog',
        });
      }
    }
  );
}
