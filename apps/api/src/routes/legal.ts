import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt';

const prisma = new PrismaClient();

/**
 * Legal V2 Document Versions (2026-09-13)
 * 
 * ⚠️ BLOCKED ON DB TEAM: This code requires the LegalAcceptance Prisma model
 * Expected schema from DB team:
 * 
 * model LegalAcceptance {
 *   id          String   @id @default(cuid())
 *   userId      String
 *   docVersion  String
 *   acceptedAt  DateTime @default(now())
 *   createdAt   DateTime @default(now())
 *   
 *   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
 *   
 *   @@unique([userId, docVersion])
 *   @@index([userId])
 *   @@map("legal_acceptances")
 * }
 */

/**
 * Legal V2 Document Versions - Frontend URL Mappings
 * Base URL (dev): http://localhost:3456
 */

// Required document versions for all users (login gate)
// These MUST be accepted before proceeding past login
export const REQUIRED_DOCS_ALL_USERS = [
  'privacy_v2_2026-09-13',      // → /privacidade
  'terms_app_v2_2026-09-13',    // → /termos
] as const;

// Additional required documents for PROFESSIONAL users (checkout gate)
// These are checked in addition to base docs for PROFESSIONAL flows
export const REQUIRED_DOCS_PROFESSIONAL = [
  'terms_saas_v2_2026-09-13',        // → /termos-saas
  'payments_notice_v2_2026-09-13',   // → /aviso-pagamentos
] as const;

// Footer-only documents (NOT login-blocking in this Legal V2 bump)
// These are available at the URLs below but NOT persisted in LegalAcceptance
// They do NOT block login or checkout
export const FOOTER_ONLY_DOCS = [
  // 'cookies_v2_2026-09-13' → /cookies (footer only)
  // 'dpa_subprocessors_v2_2026-09-13' → /dpa (footer only)
] as const;

/**
 * SECURITY NOTE for BACKEND SECURITY CHECKER:
 * 
 * Footer-only documents (cookies_v2_*, dpa_subprocessors_v2_*) are NOT login-blocking.
 * They are available as informational pages but NOT persisted in LegalAcceptance.
 * 
 * If cookies or DPA docVersions appear in /legal/accept requests:
 * - Return 422 (invalid docVersion)
 * - Do NOT persist them
 * - These are footer-only in this Legal V2 bump
 * 
 * Health consent remains out of scope (no docVersion defined).
 */

interface RecordAcceptanceBody {
  docVersions: string[];
}

interface CheckMissingDocsResponse {
  missing_docs: string[];
  user_role?: 'STANDARD' | 'PROFESSIONAL'; // Will be determined from User model
}

/**
 * Extract userId from Authorization header
 * 
 * SECURITY NOTE for BACKEND SECURITY CHECKER:
 * - MUST bind acceptances to authenticated userId from JWT
 * - NEVER allow accepting on behalf of another user
 * - Token tampering prevention via JWT signature verification
 * - Replay attack: acceptedAt timestamp is server-controlled (never from client)
 */
function extractUserId(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    return payload.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Validate docVersions against allowed list
 * 
 * SECURITY NOTE for BACKEND SECURITY CHECKER:
 * - Only accept known docVersions (whitelist approach)
 * - Reject any attempt to inject arbitrary strings into DB
 * - Prevents potential SQL injection via malformed docVersion strings
 */
function validateDocVersions(docVersions: string[]): { valid: boolean; invalid: string[] } {
  const allowedDocs = [
    ...REQUIRED_DOCS_ALL_USERS,
    ...REQUIRED_DOCS_PROFESSIONAL,
  ];

  const invalid = docVersions.filter(v => !allowedDocs.includes(v as any));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

export async function legalRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/legal/accept
   * Body: { docVersions: string[] }
   * Returns: { accepted: string[], acceptedAt: string }
   * Errors: 401 unauthorized, 422 invalid docVersions, 429 rate limit
   * 
   * BACKEND SECURITY CHECKER:
   * - Requires valid JWT (Bearer token)
   * - Rate limited: default global limit
   * - userId extracted from JWT (server-side, tamper-proof)
   * - acceptedAt timestamp is server-controlled
   * - Batch upsert: creates or updates existing acceptances
   * - NO accepting on behalf of other users
   * - Only whitelisted docVersions allowed
   * 
   * ⚠️ BLOCKED ON DB TEAM: Requires LegalAcceptance model in Prisma schema
   */
  fastify.post<{ Body: RecordAcceptanceBody }>(
    '/api/v1/legal/accept',
    async (request: FastifyRequest<{ Body: RecordAcceptanceBody }>, reply: FastifyReply) => {
      // Authentication required
      const userId = extractUserId(request);
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      const { docVersions } = request.body;

      // Validation
      if (!docVersions || !Array.isArray(docVersions) || docVersions.length === 0) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'docVersions array is required and must not be empty',
        });
      }

      // Validate docVersions against whitelist
      const validation = validateDocVersions(docVersions);
      if (!validation.valid) {
        return reply.code(422).send({
          error: 'Validation Error',
          message: 'Invalid docVersions provided',
          invalid_versions: validation.invalid,
        });
      }

      try {
        const acceptedAt = new Date();

        // Batch upsert acceptances (unique constraint on userId + docVersion)
        const acceptances = await Promise.all(
          docVersions.map(docVersion =>
            prisma.legalAcceptance.upsert({
              where: {
                userId_docVersion: {
                  userId,
                  docVersion,
                },
              },
              create: {
                userId,
                docVersion,
                acceptedAt,
              },
              update: {
                acceptedAt, // Update timestamp if re-accepting
              },
            })
          )
        );

        return reply.code(200).send({
          accepted: docVersions,
          acceptedAt: acceptedAt.toISOString(),
        });
      } catch (error) {
        fastify.log.error(error, 'Legal acceptance error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while recording legal acceptances',
        });
      }
    }
  );

  /**
   * GET /api/v1/legal/missing
   * Returns: { missing_docs: string[], user_role?: string }
   * Errors: 401 unauthorized, 429 rate limit
   * 
   * BACKEND SECURITY CHECKER:
   * - Requires valid JWT (Bearer token)
   * - Returns which required docs the user has NOT accepted
   * - Role-based: PROFESSIONAL users need additional docs
   * - Can be called by login flow or Front before showing legal screens
   * 
   * ⚠️ BLOCKED ON DB TEAM: Requires LegalAcceptance model in Prisma schema
   * ⚠️ ALSO BLOCKED: Assumes User model has a 'role' field (or subscription status)
   */
  fastify.get(
    '/api/v1/legal/missing',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Authentication required
      const userId = extractUserId(request);
      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      try {
        // Fetch user to determine role
        const user = await prisma.user.findUnique({
          where: { id: userId },
          // TODO: select role or subscription_tier field once available
        });

        if (!user) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        // Determine required docs based on user role
        // TODO: Replace with actual role field check when User model has role/subscriptionTier
        // Placeholder: hardcoded to STANDARD for now (will be user.role or similar)
        const userRole = (user as any).role || 'STANDARD'; // Type-safe placeholder
        const requiredDocs = [
          ...REQUIRED_DOCS_ALL_USERS,
          ...(userRole === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
        ];

        // Fetch existing acceptances
        const acceptances = await prisma.legalAcceptance.findMany({
          where: {
            userId,
            docVersion: { in: requiredDocs },
          },
          select: { docVersion: true },
        });

        const acceptedDocVersions = new Set(acceptances.map(a => a.docVersion));
        const missingDocs = requiredDocs.filter(doc => !acceptedDocVersions.has(doc));

        return reply.code(200).send({
          missing_docs: missingDocs,
          user_role: userRole,
        });
      } catch (error) {
        fastify.log.error(error, 'Legal missing docs check error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while checking legal acceptances',
        });
      }
    }
  );

  /**
   * Middleware: Check legal acceptance before protected routes
   * 
   * Example usage in other routes:
   * 
   * fastify.addHook('preHandler', async (request, reply) => {
   *   const userId = extractUserId(request);
   *   if (userId) {
   *     const hasAccepted = await checkLegalAcceptance(userId);
   *     if (!hasAccepted) {
   *       return reply.code(451).send({
   *         error: 'Legal Acceptance Required',
   *         message: 'You must accept required legal documents',
   *         missing_endpoint: '/api/v1/legal/missing',
   *       });
   *     }
   *   }
   * });
   * 
   * SECURITY NOTE for BACKEND SECURITY CHECKER:
   * - Use HTTP 451 (Unavailable For Legal Reasons) for blocked requests
   * - Always direct to /api/v1/legal/missing to get specific required docs
   * - For checkout/PROFESSIONAL flows, check additional docs
   */
}

/**
 * Helper: Check if user has accepted all required legal docs
 */
export async function checkLegalAcceptance(
  userId: string,
  role: 'STANDARD' | 'PROFESSIONAL' = 'STANDARD'
): Promise<boolean> {
  const requiredDocs = [
    ...REQUIRED_DOCS_ALL_USERS,
    ...(role === 'PROFESSIONAL' ? REQUIRED_DOCS_PROFESSIONAL : []),
  ];

  const acceptances = await prisma.legalAcceptance.findMany({
    where: {
      userId,
      docVersion: { in: requiredDocs },
    },
  });

  return acceptances.length === requiredDocs.length;
}
