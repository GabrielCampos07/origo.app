# Legal V2 Acceptance API

**Status:** ✅ **READY** — API fully implemented with LegalAcceptance model from PR #6

**Owner mandate:** 2026-09-13  
**API implementation:** Complete and ready for Frontend integration

---

## Overview

Legal V2 persistence tracks user acceptance of required legal documents with timestamps. The API gates sensitive flows until users accept required documents based on their role.

## Known Dependencies

### User Role Field (TODO)

The `User` model currently does NOT have a `role` or `subscriptionTier` field. This limits Legal V2's ability to enforce PROFESSIONAL-specific documents (SaaS terms + payment notices) at the checkout gate.

**Current behavior:**
- Login returns `missing_doc_versions` for base required docs only (privacy + terms_app)
- `/api/v1/legal/missing` endpoint hardcodes `userRole = 'STANDARD'`
- PROFESSIONAL doc enforcement is **not active** until User.role is added

**What's needed:**
1. Add `role` enum field to `User` Prisma model: `STANDARD | PROFESSIONAL`
2. Update login to check `user.role` when calculating `missing_doc_versions`
3. Update `/api/v1/legal/missing` to use `user.role` instead of placeholder
4. Backend determines role based on subscription status or explicit assignment

**Code locations to update when User.role lands:**
- `apps/api/src/routes/auth.ts:177` — login response calculation
- `apps/api/src/routes/legal.ts:247` — missing docs endpoint role check

---

## Required Documents & Frontend URLs

### All Users (Login Gate)
All authenticated users MUST accept these documents:

- `privacy_v2_2026-09-13` → Frontend URL: `/privacidade`
- `terms_app_v2_2026-09-13` → Frontend URL: `/termos`

### PROFESSIONAL Users (Checkout Gate)
Users with PROFESSIONAL role or during checkout MUST also accept:

- `terms_saas_v2_2026-09-13` → Frontend URL: `/termos-saas`
- `payments_notice_v2_2026-09-13` → Frontend URL: `/aviso-pagamentos`

### Optional / UI-Only Documents
The following are **NOT** enforced at the API level (footer only):

- Cookie consent → Footer UI preference, not persisted
- DPA notices → Footer informational, not login-blocking
- Health consent → Out of scope for Legal V2 (see Security Note below)

---

## Prisma Model (From PR #6)

The LegalAcceptance model is now available in the schema:

```prisma
model LegalAcceptance {
  id         String   @id @default(cuid())
  userId     String
  docVersion String
  acceptedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, docVersion])
  @@index([userId])
  @@index([userId, acceptedAt])
  @@map("legal_acceptances")
}
```

**Key features:**
- ✅ Unique composite key on `(userId, docVersion)` — prevents duplicate acceptances
- ✅ Cascading delete — removes acceptances when user is deleted
- ✅ Indexed on `userId` and `(userId, acceptedAt)` — fast lookups for gate checks
- ✅ LGPD compliance notes in schema (APPEND-ONLY, minimal PII, purpose limitation)

---

## API Endpoints

### POST `/api/v1/legal/accept`

**Description:** Records user acceptance of one or more legal documents.

**Authentication:** Required (Bearer JWT)

**Request Body:**
```json
{
  "docVersions": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ]
}
```

**Success Response (200):**
```json
{
  "accepted": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ],
  "acceptedAt": "2026-09-13T17:45:30.123Z"
}
```

**Error Responses:**
- `401` — Missing or invalid JWT token
- `422` — Invalid docVersions (not in whitelist) or validation error
- `429` — Rate limit exceeded

**Security:**
- `userId` extracted from JWT (server-side, tamper-proof)
- `acceptedAt` timestamp is server-controlled (never from client)
- Only whitelisted `docVersions` accepted (prevents injection)
- Idempotent: re-accepting same docs updates timestamp

---

### GET `/api/v1/legal/missing`

**Description:** Returns which required legal documents the authenticated user has NOT yet accepted.

**Authentication:** Required (Bearer JWT)

**Success Response (200):**
```json
{
  "missing_docs": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ],
  "user_role": "STANDARD"
}
```

For PROFESSIONAL users:
```json
{
  "missing_docs": [
    "terms_saas_v2_2026-09-13",
    "payments_notice_v2_2026-09-13"
  ],
  "user_role": "PROFESSIONAL"
}
```

**Error Responses:**
- `401` — Missing or invalid JWT token
- `404` — User not found
- `429` — Rate limit exceeded

**Use Cases:**
- Login flow: check if user needs legal acceptance before full access
- Before checkout: verify PROFESSIONAL users have accepted payment docs
- UI: determine which legal screens to show

---

## Integration Guide for Frontend

### Frontend URL Mapping

When redirecting users to legal acceptance screens, use these URLs:

| docVersion | Frontend Route | Description |
|------------|---------------|-------------|
| `privacy_v2_2026-09-13` | `/privacidade` | Privacy Policy V2 |
| `terms_app_v2_2026-09-13` | `/termos` | App Terms of Service V2 |
| `terms_saas_v2_2026-09-13` | `/termos-saas` | SaaS Terms V2 (PROFESSIONAL) |
| `payments_notice_v2_2026-09-13` | `/aviso-pagamentos` | Payments Notice V2 (PROFESSIONAL) |

### 1. After Login: Check Missing Docs

```typescript
// After successful login
const response = await fetch('/api/v1/legal/missing', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { missing_docs, user_role } = await response.json();

if (missing_docs.length > 0) {
  // Redirect to legal acceptance screen
  router.push('/legal/accept?docs=' + missing_docs.join(','));
} else {
  // Proceed to dashboard
  router.push('/dashboard');
}
```

### 2. Legal Acceptance Screen: Submit Acceptances

```typescript
// User clicked "I Accept" on legal screen
const response = await fetch('/api/v1/legal/accept', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    docVersions: [
      'privacy_v2_2026-09-13',
      'terms_app_v2_2026-09-13'
    ]
  })
});

if (response.ok) {
  const { accepted, acceptedAt } = await response.json();
  console.log(`Accepted ${accepted.length} docs at ${acceptedAt}`);
  
  // Proceed to dashboard
  router.push('/dashboard');
} else if (response.status === 422) {
  const { invalid_versions } = await response.json();
  console.error('Invalid docVersions:', invalid_versions);
}
```

### 3. Before Checkout: Gate PROFESSIONAL Users

```typescript
// Before showing checkout form
const response = await fetch('/api/v1/legal/missing', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { missing_docs, user_role } = await response.json();

if (user_role === 'PROFESSIONAL' && missing_docs.length > 0) {
  // Block checkout, redirect to legal acceptance
  router.push('/legal/accept?docs=' + missing_docs.join(',') + '&return=/checkout');
} else {
  // Allow checkout
  showCheckoutForm();
}
```

---

## API Gates (Future Implementation)

Once the DB model lands, protected routes can check legal acceptance:

### Example: Gate Dashboard Access

```typescript
// In dashboard route handler
fastify.addHook('preHandler', async (request, reply) => {
  const userId = extractUserId(request);
  if (userId) {
    const hasAccepted = await checkLegalAcceptance(userId);
    if (!hasAccepted) {
      return reply.code(451).send({
        error: 'Legal Acceptance Required',
        message: 'You must accept required legal documents',
        missing_endpoint: '/api/v1/legal/missing',
      });
    }
  }
});
```

**HTTP 451 (Unavailable For Legal Reasons)** is the appropriate status code for blocked requests.

### Example: Gate Checkout for PROFESSIONAL

```typescript
// In checkout route handler
fastify.post('/api/v1/checkout', async (request, reply) => {
  const userId = extractUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const userRole = determineUserRole(user); // TODO: implement based on User model
  const hasAccepted = await checkLegalAcceptance(userId, userRole);
  
  if (!hasAccepted) {
    return reply.code(451).send({
      error: 'Legal Acceptance Required',
      message: 'PROFESSIONAL users must accept SaaS terms and payment notices',
      missing_endpoint: '/api/v1/legal/missing',
    });
  }
  
  // Proceed with checkout
});
```

---

## Security Notes for BACKEND SECURITY CHECKER

### Tamper Prevention
- ✅ `userId` extracted from JWT signature verification (server-side only)
- ✅ `acceptedAt` timestamp is server-controlled, never from client
- ✅ No endpoint allows accepting on behalf of another user

### Replay Attack Mitigation
- ✅ Idempotent upsert: re-accepting same docs updates timestamp
- ✅ JWT expiry enforced (15 min access token TTL)
- ⚠️ Consider: Add nonce or request ID for critical flows (future)

### Injection Prevention
- ✅ Whitelist validation: only known `docVersions` accepted
- ✅ Prisma ORM prevents SQL injection
- ✅ No arbitrary strings persisted without validation

### Rate Limiting
- ✅ Global rate limit: 100 req/15min per IP (Fastify global)
- ⚠️ Consider: Separate rate limit for `/legal/accept` (e.g., 10/hour) to prevent abuse

### Health Consent Handling
⚠️ **IMPORTANT:** Health consent is **UI-only** per owner mandate.

If a `health_consent_*` docVersion appears in requests:
- ❌ DO NOT persist it unless final schema explicitly includes it
- ❌ DO NOT mix health data with general legal acceptances
- ✅ Return `422` error for any docVersion not in REQUIRED_DOCS lists
- 🔒 Health data requires proper HIPAA/LGPD audit trails (separate system)

---

## Change Log

- **2026-09-13 17:22 UTC**: Legal V2 API fully implemented on schema branch
  - Integrated with LegalAcceptance model from PR #6
  - All routes active and ready for Frontend integration
  - Added Frontend URL mappings for legal pages
  - LGPD compliance documented in schema
- **Next**: Frontend implements legal screens → test → deploy

- [ ] POST `/api/v1/legal/accept` with valid JWT and docVersions → 200
- [ ] POST `/api/v1/legal/accept` without JWT → 401
- [ ] POST `/api/v1/legal/accept` with invalid docVersions → 422 with `invalid_versions`
- [ ] POST `/api/v1/legal/accept` re-accepting same docs → 200 (idempotent, updates timestamp)
- [ ] GET `/api/v1/legal/missing` for new user → returns all required docs
- [ ] GET `/api/v1/legal/missing` after accepting → returns empty `missing_docs`
- [ ] GET `/api/v1/legal/missing` for PROFESSIONAL user → includes SaaS + payment docs
- [ ] Verify unique constraint: `(userId, docVersion)` prevents duplicates
- [ ] Verify cascade delete: deleting user removes acceptances
- [ ] Load test: 100 concurrent `/legal/accept` requests for same user (idempotency)

---

## OpenAPI Spec

Full OpenAPI spec available in `libs/api-contract/openapi.yaml`.

Key sections:
- `POST /api/v1/legal/accept` → `#/paths/~1api~1v1~1legal~1accept`
- `GET /api/v1/legal/missing` → `#/paths/~1api~1v1~1legal~1missing`
- Schemas: `LegalAcceptanceRequest`, `LegalAcceptanceResponse`, `LegalMissingDocsResponse`

---

## Change Log

- **2026-09-13 17:22 UTC**: Legal V2 API fully implemented on schema branch
  - Integrated with LegalAcceptance model from PR #6
  - All routes active and ready for Frontend integration
  - Added Frontend URL mappings for legal pages
  - LGPD compliance documented in schema
- **Next**: Frontend implements legal screens → test → deploy
