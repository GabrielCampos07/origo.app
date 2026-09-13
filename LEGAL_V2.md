# Legal V2 Acceptance API

**Status:** ✅ **READY** — API fully implemented with LegalAcceptance model from PR #6

**Owner mandate:** 2026-09-13  
**API implementation:** Complete and ready for Frontend integration

---

## Overview

Legal V2 persistence tracks user acceptance of required legal documents with timestamps. The API gates sensitive flows until users accept required documents based on their role.


**Code locations to update when User.role lands:**
- `apps/api/src/routes/auth.ts:177` — login response calculation
- `apps/api/src/routes/legal.ts:247` — missing docs endpoint role check

---

## Required Documents & Frontend URLs

**Base URL (dev):** `http://localhost:3456`

### All Users (Login Gate) — REQUIRED
All authenticated users MUST accept these documents before proceeding:

| docVersion | Frontend Path | Full URL (dev) | Document |
|------------|---------------|----------------|----------|
| `privacy_v2_2026-09-13` | `/privacidade` | `http://localhost:3456/privacidade` | Privacy Policy V2 |
| `terms_app_v2_2026-09-13` | `/termos` | `http://localhost:3456/termos` | App Terms of Service V2 |

### PROFESSIONAL Users (Checkout Gate) — ADDITIONAL REQUIRED
Users with PROFESSIONAL role or during checkout MUST also accept:

| docVersion | Frontend Path | Full URL (dev) | Document |
|------------|---------------|----------------|----------|
| `terms_saas_v2_2026-09-13` | `/termos-saas` | `http://localhost:3456/termos-saas` | SaaS Terms V2 |
| `payments_notice_v2_2026-09-13` | `/aviso-pagamentos` | `http://localhost:3456/aviso-pagamentos` | Payments Notice V2 |

### Footer Only (NOT Login-Blocking)
The following are **available but NOT enforced** at the API level in this bump:

| docVersion | Frontend Path | Full URL (dev) | Document |
|------------|---------------|----------------|----------|
| `cookies_v2_2026-09-13` | `/cookies` | `http://localhost:3456/cookies` | Cookies Policy V2 |
| `dpa_subprocessors_v2_2026-09-13` | `/dpa` | `http://localhost:3456/dpa` | DPA Subprocessors V2 |

**Note:** Cookies and DPA docs are footer-only informational pages. They are NOT persisted in `LegalAcceptance` and do NOT block login or checkout in this Legal V2 bump.

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
- Idempotent: re-accepting same docs = 200 no-op
  - Uses `createMany` with `skipDuplicates: true` to skip existing records
  - Returns earliest original `acceptedAt` from stored records (never invents new timestamp)

---

### GET `/api/v1/legal/missing`

**Description:** Returns which required legal documents the authenticated user has NOT yet accepted.

**Authentication:** Required (Bearer JWT)

**Success Response (200):**
**STUDENT role** (base documents only):
```json
{
  "missing_docs": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ],
  "user_role": "STUDENT"
}
```

**PROFESSIONAL role** (additional checkout documents):
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

When redirecting users to legal acceptance screens:

**Login gate (all users):**
```typescript
const URL_MAP = {
  'privacy_v2_2026-09-13': 'http://localhost:3456/privacidade',
  'terms_app_v2_2026-09-13': 'http://localhost:3456/termos',
};
```

**Checkout gate (PROFESSIONAL additional):**
```typescript
const URL_MAP_PROFESSIONAL = {
  'terms_saas_v2_2026-09-13': 'http://localhost:3456/termos-saas',
  'payments_notice_v2_2026-09-13': 'http://localhost:3456/aviso-pagamentos',
};
```

**Footer only (NOT blocking):**
```typescript
const URL_MAP_FOOTER = {
  'cookies_v2_2026-09-13': 'http://localhost:3456/cookies',
  'dpa_subprocessors_v2_2026-09-13': 'http://localhost:3456/dpa',
};
```

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

## API Gates (IMPLEMENTED)

✅ **Global enforcement active** — All protected authenticated endpoints enforce legal acceptance.

### Global Middleware Enforcement

Protected authenticated endpoints automatically return **403 Forbidden** if user is missing required legal documents for their role.

**Response format:**
```json
{
  "error": "legal_acceptance_required",
  "missing_doc_versions": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ]
}
```

**Exempt routes (no 403 enforcement):**
- `/health` — health check
- `/api/v1/auth/login` — login
- `/api/v1/auth/forgot-password` — forgot password
- `/api/v1/auth/reset-password` — reset password
- `/api/v1/legal/accept` — accept legal docs
- `/api/v1/legal/missing` — check missing docs

**How it works:**
1. Middleware runs on every request (`onRequest` hook)
2. Skips exempt routes and unauthenticated requests
3. Extracts `userId` from JWT Bearer token
4. Fetches user's role (PROFESSIONAL | STUDENT) and existing acceptances
5. Compares against required docs for role
6. Returns 403 with `missing_doc_versions` if incomplete
7. Otherwise allows request to proceed

**Security notes:**
- Uses **403 Forbidden** (not 451) per OWNER/Sec requirement
- Error code `legal_acceptance_required` for client detection
- `missing_doc_versions` array tells client which docs to present
- Frontend should redirect to `/legal/accept` with missing docs

### Role-Based Enforcement

**STUDENT users** must accept:
- `privacy_v2_2026-09-13`
- `terms_app_v2_2026-09-13`

**PROFESSIONAL users** must accept (additional):
- `terms_saas_v2_2026-09-13`
- `payments_notice_v2_2026-09-13`

The middleware automatically enforces the correct set based on `User.role` from the database.

---

## Security Notes for BACKEND SECURITY CHECKER

### Tamper Prevention
- ✅ `userId` extracted from JWT signature verification (server-side only)
- ✅ `acceptedAt` timestamp is server-controlled, never from client
- ✅ No endpoint allows accepting on behalf of another user

### Replay Attack Mitigation
- ✅ INSERT ONLY: uses `createMany` with `skipDuplicates: true` (no upsert, no timestamp updates)
- ✅ Re-accepting returns earliest original `acceptedAt` from stored records (never invents new timestamp)
- ✅ JWT expiry enforced (15 min access token TTL)
- ⚠️ Consider: Add nonce or request ID for critical flows (future)

### Injection Prevention
- ✅ Whitelist validation: only known `docVersions` accepted
- ✅ Prisma ORM prevents SQL injection
- ✅ No arbitrary strings persisted without validation

### Rate Limiting
- ✅ Global rate limit: 100 req/15min per IP (Fastify global)
- 📝 Follow-up: Consider separate rate limit for `/legal/accept` (e.g., 10/hour)

### Canonical docVersion Format
⚠️ **CRITICAL:** Use underscore V2 IDs ONLY, never @ format.

**Correct format:**
```
privacy_v2_2026-09-13
terms_app_v2_2026-09-13
terms_saas_v2_2026-09-13
payments_notice_v2_2026-09-13
```

**Wrong format (rejected):**
```
privacy@2026-09-13          ❌ Never use @ format
privacy_v2                  ❌ Missing date
privacy_v2_2026-09          ❌ Incomplete date
```

### Database Permissions (INFRA/DBA)
⚠️ **CRITICAL:** Application role should have INSERT + SELECT only.

```sql
-- Correct grants for app_role
GRANT INSERT, SELECT ON legal_acceptances TO app_role;

-- NO UPDATE or DELETE grants for application
-- Updates/deletes only via DBA for legal/compliance directives
```

This enforces the APPEND-ONLY model at the database level.

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
- [ ] POST `/api/v1/legal/accept` re-accepting same docs → 200 with original `acceptedAt` (createMany+skipDuplicates)
- [ ] GET `/api/v1/legal/missing` for new user → returns all required docs
- [ ] GET `/api/v1/legal/missing` after accepting → returns empty `missing_docs`
- [ ] GET `/api/v1/legal/missing` for PROFESSIONAL user → includes SaaS + payment docs (not STUDENT)
- [ ] Verify unique constraint: `(userId, docVersion)` prevents duplicates
- [ ] Verify cascade delete: deleting user removes acceptances
- [ ] Load test: 100 concurrent `/legal/accept` requests for same user (idempotency with skipDuplicates)

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
