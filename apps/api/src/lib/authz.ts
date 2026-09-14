import type { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, type Enrollment, type UserRole } from '@prisma/client';
import { verifyAccessToken } from './jwt';

const prisma = new PrismaClient();

export type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  subscriptionActive: boolean;
};

function unauthorized(reply: FastifyReply) {
  return reply.code(401).send({
    error: 'Unauthorized',
    message: 'Valid authentication token required',
  });
}

/**
 * Resolve the authenticated user from middleware (preferred) or JWT.
 * Sends 401 and returns null when auth is missing/invalid.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser | null> {
  if (request.authenticatedUser?.userId) {
    return request.authenticatedUser;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await unauthorized(reply);
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionActive: true,
      },
    });

    if (!user) {
      await unauthorized(reply);
      return null;
    }

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionActive: user.subscriptionActive,
    };
    request.authenticatedUser = authUser;
    return authUser;
  } catch {
    await unauthorized(reply);
    return null;
  }
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  role: UserRole,
  forbiddenMessage: string
): Promise<AuthUser | null> {
  const user = await requireAuth(request, reply);
  if (!user) return null;

  if (user.role !== role) {
    await reply.code(403).send({
      error: 'Forbidden',
      message: forbiddenMessage,
    });
    return null;
  }

  return user;
}

export async function requireProfessional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser | null> {
  return requireRole(
    request,
    reply,
    'PROFESSIONAL',
    'Only PROFESSIONAL users can access this resource'
  );
}

export async function requireStudent(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser | null> {
  return requireRole(
    request,
    reply,
    'STUDENT',
    'Only STUDENT users can access this resource'
  );
}

/**
 * IDOR fail-closed: generic 404 when the professional has no ACTIVE enrollment
 * with the student (does not distinguish unknown id vs someone else's student).
 */
export async function findOwnedActiveEnrollment(
  professionalUserId: string,
  studentUserId: string
): Promise<Enrollment | null> {
  return prisma.enrollment.findFirst({
    where: {
      professionalUserId,
      studentUserId,
      status: 'ACTIVE',
    },
  });
}

export async function requireOwnedActiveEnrollment(
  reply: FastifyReply,
  professionalUserId: string,
  studentUserId: string
): Promise<Enrollment | null> {
  const enrollment = await findOwnedActiveEnrollment(professionalUserId, studentUserId);
  if (!enrollment) {
    await reply.code(404).send({
      error: 'Not Found',
      message: 'Student not found',
    });
    return null;
  }
  return enrollment;
}
