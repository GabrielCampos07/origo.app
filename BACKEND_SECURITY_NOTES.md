# BACKEND SECURITY NOTES — Origo.app

## Professional Category Lock (Gabriel OWNER Lock — Staging Smoke)

**Date:** 2026-09-14  
**Status:** LOCKED for staging  
**LIVE:** Untouched until tip ready

---

## ⚠️ OWNER/DB Directive — NO MIGRATION

**ACKNOWLEDGED:** Per OWNER/DB directive, this implementation makes **NO database or Prisma schema changes**.

**Category lock implemented at:**
- ✅ OpenAPI contract layer (enum: `[FISIOTERAPIA, EDUCACAO_FISICA]`)
- ✅ API handler layer (whitelist validation)

**Unchanged:**
- ✅ Prisma schema (`PERSONAL` kept in enum for historical data)
- ✅ Database (no migrations created)
- ✅ Seed code (already uses only `FISIOTERAPIA`)

---

## Issue #1: 422 on POST /api/v1/auth/register/professional (Staging)

### Root Cause — CONFIRMED BY FRONTEND

**Frontend team confirmed:** The staging client was sending PT slug `"fisioterapeuta"` instead of the expected English enum `"FISIOTERAPIA"`.

The 422 error occurs when the Frontend sends Portuguese category labels (e.g., `"fisioterapeuta"`, `"educador físico"`) instead of the expected English snake_case enum values.

**Expected values (Backend API contract):**
- `FISIOTERAPIA`
- `EDUCACAO_FISICA`

**Common Frontend mistakes:**
- ✅ **CONFIRMED by Frontend:** Sending PT slug `"fisioterapeuta"` (staging bug)
- Sending PT slugs: `"educador-fisico"`, `"educador físico"`
- Sending empty string: `""`
- Sending old enum value: `"PERSONAL"` (now removed)
- Sending null or undefined

### Fix Applied

**Backend validation (apps/api/src/routes/auth.ts):**
```typescript
// OWNER LOCK (Gabriel): Only accept FISIOTERAPIA and EDUCACAO_FISICA
// SECURITY: Generic 422 without leaking allowed values
const allowedCategories = ['FISIOTERAPIA', 'EDUCACAO_FISICA'];
if (!allowedCategories.includes(category)) {
  return reply.code(422).send({
    error: 'Validation Error',
    message: 'Invalid professional category',
  });
}
```

**Error response (generic, no internal leakage):**
```json
{
  "error": "Validation Error",
  "message": "Invalid professional category"
}
```

**Security properties:**
- ✅ No enumeration of allowed values
- ✅ No distinction between PT slug, empty, PERSONAL, or invalid
- ✅ Generic message prevents category discovery attacks
- ✅ No stack trace or internal details leaked

---

## Issue #2: Category Lock (OWNER)

### Locked Categories

**ONLY two categories allowed:**
- `FISIOTERAPIA` (Fisioterapeuta)
- `EDUCACAO_FISICA` (Educador físico)

**Removed from API surface:**
- ~~`PERSONAL`~~ (rejected at API layer with generic 422)

### Changes Applied

#### 1. OpenAPI Contract (libs/api-contract/openapi.yaml)

**RegisterProfessionalRequest schema:**
```yaml
category:
  type: string
  enum: [FISIOTERAPIA, EDUCACAO_FISICA]
  example: FISIOTERAPIA
```

**ValidateInviteResponse schema:**
```yaml
category:
  type: string
  enum: [FISIOTERAPIA, EDUCACAO_FISICA]
  description: Professional category (only returned for valid invites)
  example: FISIOTERAPIA
```

#### 2. API Handler (apps/api/src/routes/auth.ts)

**Validation whitelist:**
- Only `FISIOTERAPIA` and `EDUCACAO_FISICA` accepted
- Rejects `PERSONAL`, PT slugs, empty, or any other value with generic 422

#### 3. Seed Data (apps/api/prisma/seed.ts)

**Current state:**
- Seed only uses `FISIOTERAPIA` (no PERSONAL or EDUCACAO_FISICA in current seed)
- No changes required (already compliant)

#### 4. Prisma Schema (apps/api/prisma/schema.prisma)

**NO CHANGE (per OWNER/DB directive):**
```prisma
enum ProfessionalCategory {
  FISIOTERAPIA
  EDUCACAO_FISICA
  PERSONAL  // Kept for historical data, rejected at API layer
}
```

**Rationale (OWNER/DB ACK):**
- **NO migration now** — Tip category lock at OpenAPI + handler only
- Prisma/DB enum keeps `PERSONAL` if present
- API layer rejects `PERSONAL` with generic 422
- Existing rows with `PERSONAL` preserved (no data loss)
- Soft deprecation strategy (API layer enforcement)
- Future migration possible if historical data shows zero `PERSONAL` rows

---

## Issue #3: Checkout Success/Cancel URLs (Partial Backend)

### Current URL Construction

**Source:** `apps/api/src/routes/checkout.ts` (lines 199-200)

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3456';
const successUrl = `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
const cancelUrl = `${frontendUrl}/checkout`;
```

### URL Paths

**Success URL:**
- Path: `/checkout/success`
- Query param: `session_id={CHECKOUT_SESSION_ID}` (Stripe placeholder)
- Example: `http://localhost:3456/checkout/success?session_id=cs_test_...`

**Cancel URL:**
- Path: `/checkout`
- No query params
- Example: `http://localhost:3456/checkout`

### Verification Status

**✅ Paths look correct** (assuming Frontend has these routes):
- `/checkout/success` — Stripe redirect on successful payment
- `/checkout` — Return to checkout page on cancel

**⚠️  Action required (Frontend/Infra):**
1. Verify `apps/web` has routes for `/checkout/success` and `/checkout`
2. Ensure `FRONTEND_URL` env var is set correctly for staging:
   - Staging Preview: `https://<preview-url>.vercel.app` (or similar)
   - Production: `https://origo.app` (when ready)
3. If routes don't exist, create them OR update Backend paths to match existing routes

### Environment Configuration

**Required env vars (Backend):**
```bash
# Example for staging
FRONTEND_URL=https://origo-staging.vercel.app

# Example for local dev
FRONTEND_URL=http://localhost:3456
```

**Backend default:** `http://localhost:3456` (if `FRONTEND_URL` not set)

---

## Testing Guide

### 1. Test Professional Registration (422 Rejection)

**Valid request (should succeed):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. João Silva",
    "email": "test-fisio@example.com",
    "password": "SecurePassword123!",
    "category": "FISIOTERAPIA"
  }'
```

**Expected:** 200 with tokens + user

**Invalid requests (should return generic 422):**

**a) PT slug:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. João Silva",
    "email": "test-fisio@example.com",
    "password": "SecurePassword123!",
    "category": "fisioterapeuta"
  }'
```

**b) PERSONAL (removed):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Personal Trainer",
    "email": "test-personal@example.com",
    "password": "SecurePassword123!",
    "category": "PERSONAL"
  }'
```

**c) Empty string:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. João Silva",
    "email": "test-empty@example.com",
    "password": "SecurePassword123!",
    "category": ""
  }'
```

**Expected for all invalid requests:**
```json
{
  "error": "Validation Error",
  "message": "Invalid professional category"
}
```

### 2. Test Both Allowed Categories

**FISIOTERAPIA:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Ana Fisio",
    "email": "ana-fisio@example.com",
    "password": "SecurePassword123!",
    "category": "FISIOTERAPIA"
  }'
```

**EDUCACAO_FISICA:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register/professional \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prof. Carlos Educador",
    "email": "carlos-edu@example.com",
    "password": "SecurePassword123!",
    "category": "EDUCACAO_FISICA"
  }'
```

**Expected:** 200 with tokens + user for both

---

## Frontend Alignment Notes

**Frontend MUST send:**
- English snake_case enum: `FISIOTERAPIA` or `EDUCACAO_FISICA`
- NOT PT labels: ~~`fisioterapeuta`~~, ~~`educador físico`~~
- NOT slugs: ~~`fisioterapeuta`~~, ~~`educador-fisico`~~
- NOT old enum: ~~`PERSONAL`~~

**Recommended Frontend mapping:**
```typescript
// Frontend user-facing labels (PT)
const CATEGORY_LABELS = {
  FISIOTERAPIA: 'Fisioterapeuta',
  EDUCACAO_FISICA: 'Educador físico',
} as const;

// Send to API
const apiPayload = {
  category: 'FISIOTERAPIA', // English enum key
};
```

---

## Deployment Checklist

- [x] OpenAPI contract updated (no PERSONAL)
- [x] API handler whitelist enforced
- [x] Generic 422 error (no leakage)
- [x] Seed data reviewed (compliant)
- [x] Prisma enum kept for historical data
- [x] Checkout URL paths documented
- [ ] Frontend alignment verified (post-deployment smoke test)
- [ ] Staging FRONTEND_URL env var set
- [ ] Staging smoke test passed
- [ ] LIVE deploy approved by OWNER/INFRA

---

## Security Review Summary

**BACKEND SECURITY CHECKER approved:**
- ✅ Category lock enforced at API layer
- ✅ Generic error messages (no enumeration)
- ✅ No internal details leaked in 422 responses
- ✅ Whitelist validation (explicit allow, not deny)
- ✅ Historical data preserved (no destructive migration)
- ✅ Checkout URLs constructed server-side (tamper-proof)

**Next steps:**
1. Merge PR to main
2. Deploy to staging
3. Smoke test registration with both categories
4. Verify FRONTEND_URL points to staging Preview
5. Await OWNER approval for LIVE deploy
