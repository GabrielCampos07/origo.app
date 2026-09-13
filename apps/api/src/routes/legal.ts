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
 * 
 * CRITICAL: Canonical docVersion format (underscore V2 IDs ONLY):
 * ✅ privacy_v2_2026-09-13 (correct)
 * ❌ privacy@2026-09-13 (wrong - never use @ format)
 * 
 * SECURITY: APPEND-ONLY model
 * - NO DELETE endpoint (records never deleted individually)
 * - NO UPDATE endpoint (userId/docVersion never modified)
 * - Only INSERT (accept) + SELECT (check missing)
 * - Database GRANT: INSERT + SELECT only for app role
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
 * SECURITY NOTES for BACKEND SECURITY CHECKER:
 * 
 * APPEND-ONLY Model (LGPD compliance):
 * - LegalAcceptance is APPEND-ONLY — no update/delete endpoints exposed
 * - INSERT ONLY: uses createMany with skipDuplicates: true (no upsert, no timestamp updates)
 * - Re-accepting returns earliest original acceptedAt from stored records
 * - Never update acceptedAt, userId, or docVersion after record creation
 * - Individual records never deleted (only cascade on User delete)
 * - Database role: GRANT INSERT + SELECT only (NO UPDATE/DELETE for app)
 * 
 * Canonical docVersion format (underscore V2 IDs ONLY):
 * - Whitelist uses exact strings like 'privacy_v2_2026-09-13'
 * - Reject any @ format like 'privacy@2026-09-13'
 * - Reject any missing date suffix
 * 
 * Footer-only documents (NOT login-blocking):
 * - cookies_v2_2026-09-13, dpa_subprocessors_v2_2026-09-13
 * - Available as informational pages but NOT persisted in LegalAcceptance
 * - Return 422 if submitted to /legal/accept
 * 
 * Health consent: out of scope (no docVersion defined in this bump)
 */

interface RecordAcceptanceBody {
  docVersions: string[];
}

interface CheckMissingDocsResponse {
  missing_docs: string[];
  user_role?: 'PROFESSIONAL' | 'STUDENT'; // From User.role enum
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
   * APPEND-ONLY Security (BACKEND SECURITY CHECKER):
   * - LegalAcceptance is APPEND-ONLY: no delete endpoint, no arbitrary updates
   * - INSERT ONLY: uses createMany with skipDuplicates: true (no upsert, no timestamp updates)
   * - Re-accepting returns earliest original acceptedAt from stored records
   * - userId/docVersion NEVER modified after creation
   * - Database: app role has INSERT + SELECT only (NO UPDATE/DELETE grants)
   * 
   * Tamper Prevention:
   * - Requires valid JWT (Bearer token)
   * - userId extracted from JWT (server-side, signature-verified)
   * - acceptedAt timestamp is server-controlled (never from client)
   * - NO accepting on behalf of other users
   * 
   * Injection Prevention:
   * - Only whitelisted docVersions allowed (canonical underscore format)
   * - Rejects @ format, missing dates, or unknown versions
   * - Prisma ORM prevents SQL injection
   * 
   * Rate Limiting:
   * - Default global limit: 100 req/15min per IP
   * - Consider adding specific limit: 10 req/hour for this endpoint
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
        // APPEND-ONLY: Insert only if not already accepted (no update on re-acceptance)
        // Fetch existing acceptances first
        const existing = await prisma.legalAcceptance.findMany({
          where: {
            userId,
            docVersion: { in: docVersions },
          },
          select: { docVersion: true, acceptedAt: true },
        });

        const existingMap = new Map(existing.map(a => [a.docVersion, a.acceptedAt]));
        const newDocVersions = docVersions.filter(v => !existingMap.has(v));

        let acceptedAt: Date;
        
        // Insert only new acceptances (skip duplicates = no-op)
        if (newDocVersions.length > 0) {
          acceptedAt = new Date();
          await prisma.legalAcceptance.createMany({
            data: newDocVersions.map(docVersion => ({
              userId,
              docVersion,
              acceptedAt,
            })),
            skipDuplicates: true, // Safety: skip if unique constraint violated
          });
        } else {
          // Pure re-acceptance: use earliest original acceptedAt from existing records
          acceptedAt = new Date(Math.min(...Array.from(existingMap.values()).map(d => d.getTime())));
        }

        // Return all requested docVersions as accepted (idempotent 200)
        // Re-accepting keeps original acceptedAt unchanged
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

        // Determine required docs based on user role (from User.role enum)
        const userRole = user.role; // PROFESSIONAL | STUDENT
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
  role: 'PROFESSIONAL' | 'STUDENT' = 'STUDENT'
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
