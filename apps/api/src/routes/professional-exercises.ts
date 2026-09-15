import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';
import { requireProfessional } from '../lib/authz';

const prisma = new PrismaClient();

const LIST_LIMIT = 50;
const MAX_TAGS = 20;
const MAX_PHOTOS = 12;
const MAX_URL_LENGTH = 2000;
const MAX_NAME = 200;
const MAX_CUES = 4000;
const MAX_TAG_LENGTH = 80;

function serializeProfessionalExercise(item: {
  id: string;
  namePt: string;
  categoryTags: string[];
  videoUrl: string | null;
  photoUrls: string[];
  cuesPt: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    namePt: item.namePt,
    categoryTags: item.categoryTags,
    videoUrl: item.videoUrl,
    photoUrls: item.photoUrls,
    cuesPt: item.cuesPt,
    active: item.active,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function parseTags(raw: unknown): { ok: true; tags: string[] } | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, tags: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'categoryTags must be an array of strings' };
  }
  if (raw.length > MAX_TAGS) {
    return { ok: false, message: `categoryTags must have at most ${MAX_TAGS} items` };
  }
  const tags: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !item.trim()) {
      return { ok: false, message: 'categoryTags must be an array of non-empty strings' };
    }
    const trimmed = item.trim().slice(0, MAX_TAG_LENGTH);
    if (trimmed) tags.push(trimmed);
  }
  return { ok: true, tags };
}

function parseOptionalUrl(
  raw: unknown,
  field: string
): { ok: true; value: string | null | undefined } | { ok: false; message: string } {
  if (raw === undefined) {
    return { ok: true, value: undefined };
  }
  if (raw === null || raw === '') {
    return { ok: true, value: null };
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: `${field} must be a string URL` };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, message: `${field} is too long` };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, message: `${field} must be an http(s) URL` };
  }
  return { ok: true, value: trimmed };
}

function parsePhotoUrls(
  raw: unknown
): { ok: true; urls: string[] | undefined } | { ok: false; message: string } {
  if (raw === undefined) {
    return { ok: true, urls: undefined };
  }
  if (raw === null) {
    return { ok: true, urls: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'photoUrls must be an array of strings' };
  }
  if (raw.length > MAX_PHOTOS) {
    return { ok: false, message: `photoUrls must have at most ${MAX_PHOTOS} items` };
  }
  const urls: string[] = [];
  for (const item of raw) {
    const parsed = parseOptionalUrl(item, 'photoUrls[]');
    if (!parsed.ok) return parsed;
    if (parsed.value) urls.push(parsed.value);
  }
  return { ok: true, urls };
}

export async function professionalExerciseRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/me/exercises?q=&tag=
   * List own active professional exercises (PROFESSIONAL; payment/legal via app hooks).
   */
  fastify.get(
    '/api/v1/me/exercises',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      try {
        const query = request.query as { q?: unknown; tag?: unknown; active?: unknown };
        const q =
          typeof query.q === 'string' && query.q.trim() ? query.q.trim().slice(0, 120) : '';
        const tag =
          typeof query.tag === 'string' && query.tag.trim()
            ? query.tag.trim().slice(0, MAX_TAG_LENGTH)
            : '';
        // Default active=true; pass active=false or active=all to broaden.
        let activeFilter: boolean | undefined = true;
        if (query.active === 'false' || query.active === false) {
          activeFilter = false;
        } else if (query.active === 'all') {
          activeFilter = undefined;
        }

        const where: Prisma.ProfessionalExerciseWhereInput = {
          professionalUserId: user.userId,
          ...(activeFilter !== undefined ? { active: activeFilter } : {}),
          ...(tag ? { categoryTags: { has: tag } } : {}),
          ...(q
            ? {
                OR: [
                  { namePt: { contains: q, mode: 'insensitive' } },
                  { categoryTags: { has: q } },
                ],
              }
            : {}),
        };

        const items = await prisma.professionalExercise.findMany({
          where,
          orderBy: { namePt: 'asc' },
          take: LIST_LIMIT,
        });

        return reply.code(200).send({
          items: items.map(serializeProfessionalExercise),
        });
      } catch (error) {
        fastify.log.error(error, 'GET /me/exercises failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while listing exercises',
        });
      }
    }
  );

  /**
   * POST /api/v1/me/exercises
   * Create a professional-owned exercise.
   */
  fastify.post(
    '/api/v1/me/exercises',
    {
      config: { rateLimit: { max: 40, timeWindow: '15 minutes' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await requireProfessional(request, reply);
      if (!user) return;

      if (!request.body || typeof request.body !== 'object') {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Request body is required',
        });
      }

      const body = request.body as Record<string, unknown>;
      const nameRaw = body.namePt ?? body.name_pt ?? body.name;
      if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'namePt is required',
        });
      }
      const namePt = nameRaw.trim();
      if (namePt.length > MAX_NAME) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: `namePt must be at most ${MAX_NAME} characters`,
        });
      }

      const tags = parseTags(body.categoryTags ?? body.category_tags);
      if (!tags.ok) {
        return reply.code(422).send({ error: 'Validation Error', message: tags.message });
      }

      const video = parseOptionalUrl(body.videoUrl ?? body.video_url, 'videoUrl');
      if (!video.ok) {
        return reply.code(422).send({ error: 'Validation Error', message: video.message });
      }

      const photos = parsePhotoUrls(body.photoUrls ?? body.photo_urls);
      if (!photos.ok) {
        return reply.code(422).send({ error: 'Validation Error', message: photos.message });
      }

      let cuesPt: string | null = null;
      const cuesRaw = body.cuesPt ?? body.cues_pt;
      if (cuesRaw !== undefined && cuesRaw !== null && cuesRaw !== '') {
        if (typeof cuesRaw !== 'string') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'cuesPt must be a string',
          });
        }
        const trimmed = cuesRaw.trim();
        if (trimmed.length > MAX_CUES) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: `cuesPt must be at most ${MAX_CUES} characters`,
          });
        }
        cuesPt = trimmed || null;
      }

      try {
        const item = await prisma.professionalExercise.create({
          data: {
            professionalUserId: user.userId,
            namePt,
            categoryTags: tags.tags,
            videoUrl: video.value ?? null,
            photoUrls: photos.urls ?? [],
            cuesPt,
          },
        });

        return reply.code(200).send({ exercise: serializeProfessionalExercise(item) });
      } catch (error) {
        fastify.log.error(error, 'POST /me/exercises failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while creating the exercise',
        });
      }
    }
  );

  /**
   * PATCH /api/v1/me/exercises/:id
   * Update own professional exercise (ownership enforced).
   */
  fastify.patch<{ Params: { id: string } }>(
    '/api/v1/me/exercises/:id',
    {
      config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
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

      const existing = await prisma.professionalExercise.findFirst({
        where: { id: request.params.id, professionalUserId: user.userId },
      });
      if (!existing) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Exercise not found',
        });
      }

      const body = request.body as Record<string, unknown>;
      const data: Prisma.ProfessionalExerciseUpdateInput = {};

      if (body.namePt !== undefined || body.name_pt !== undefined || body.name !== undefined) {
        const nameRaw = body.namePt ?? body.name_pt ?? body.name;
        if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'namePt must be a non-empty string',
          });
        }
        const namePt = nameRaw.trim();
        if (namePt.length > MAX_NAME) {
          return reply.code(422).send({
            error: 'Validation Error',
            message: `namePt must be at most ${MAX_NAME} characters`,
          });
        }
        data.namePt = namePt;
      }

      if (body.categoryTags !== undefined || body.category_tags !== undefined) {
        const tags = parseTags(body.categoryTags ?? body.category_tags);
        if (!tags.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: tags.message });
        }
        data.categoryTags = tags.tags;
      }

      if (body.videoUrl !== undefined || body.video_url !== undefined) {
        const video = parseOptionalUrl(body.videoUrl ?? body.video_url, 'videoUrl');
        if (!video.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: video.message });
        }
        data.videoUrl = video.value ?? null;
      }

      if (body.photoUrls !== undefined || body.photo_urls !== undefined) {
        const photos = parsePhotoUrls(body.photoUrls ?? body.photo_urls);
        if (!photos.ok) {
          return reply.code(422).send({ error: 'Validation Error', message: photos.message });
        }
        data.photoUrls = photos.urls ?? [];
      }

      if (body.cuesPt !== undefined || body.cues_pt !== undefined) {
        const cuesRaw = body.cuesPt ?? body.cues_pt;
        if (cuesRaw === null || cuesRaw === '') {
          data.cuesPt = null;
        } else if (typeof cuesRaw !== 'string') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'cuesPt must be a string',
          });
        } else {
          const trimmed = cuesRaw.trim();
          if (trimmed.length > MAX_CUES) {
            return reply.code(422).send({
              error: 'Validation Error',
              message: `cuesPt must be at most ${MAX_CUES} characters`,
            });
          }
          data.cuesPt = trimmed || null;
        }
      }

      if (body.active !== undefined) {
        if (typeof body.active !== 'boolean') {
          return reply.code(422).send({
            error: 'Validation Error',
            message: 'active must be a boolean',
          });
        }
        data.active = body.active;
      }

      try {
        const item = await prisma.professionalExercise.update({
          where: { id: existing.id },
          data,
        });
        return reply.code(200).send({ exercise: serializeProfessionalExercise(item) });
      } catch (error) {
        fastify.log.error(error, 'PATCH /me/exercises/:id failed');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating the exercise',
        });
      }
    }
  );
}
