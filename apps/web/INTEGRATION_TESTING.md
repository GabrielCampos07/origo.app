# Legal Acceptance UI - Integration Testing Guide

This document describes how to test the Legal Acceptance UI against Backend PR #11 (branch: `cursor/legal-v2-api-6c46`, tip SHA: `7484484`).

## Prerequisites

1. **Backend API Running**: Backend PR #11 must be running on `http://localhost:3001` (or configure `NEXT_PUBLIC_API_URL`)
2. **Database**: PostgreSQL with migrations applied (includes `User.role` and `LegalAcceptance` model)
3. **Seed Data**: Test users with roles (or use seed emails for DEMO stub)

## Test Setup

### 1. Start Backend Services

```bash
# From repository root
cd deploy
docker compose up -d  # Starts PostgreSQL and Mailhog

cd ../tmp/api-test-worktree  # Or checkout cursor/legal-v2-api-6c46
cd apps/api

# Install dependencies
npm install

# Run migrations
npm run prisma:migrate

# Seed test data
npm run prisma:seed

# Start API
npm run dev  # Runs on http://localhost:3001
```

### 2. Start Web Frontend

```bash
# From repository root
cd apps/web

# Set API URL (optional, defaults to http://localhost:3001)
export NEXT_PUBLIC_API_URL=http://localhost:3001

# Start web server
npm run dev  # Runs on http://localhost:3456
```

## Test Scenarios

### Scenario 1: STUDENT Login with Missing Docs

**Setup**: User with STUDENT role who has not accepted legal documents

**Expected Flow**:
1. Navigate to http://localhost:3456/login
2. Login with student credentials
3. Should redirect to `/legal/accept`
4. Page shows 2 checkboxes:
   - "Política de Privacidade" (privacy_v2_2026-09-13)
   - "Termos de Uso do Aplicativo" (terms_app_v2_2026-09-13)
5. Check both boxes
6. Click "Aceitar e Continuar"
7. Should POST to `/api/v1/legal/accept` with Bearer JWT
8. Should redirect to `/dashboard/aluno`

**Verify**:
- Network tab shows POST `/api/v1/legal/accept` with 200 response
- Dashboard displays "Aluno" badge
- No redirect loop (missing docs cleared)

### Scenario 2: PROFESSIONAL Login with Missing Docs

**Setup**: User with PROFESSIONAL role who has not accepted legal documents

**Expected Flow**:
1. Login with professional credentials (e.g., prof@origo.dev)
2. Redirect to `/legal/accept`
3. Page shows 4 checkboxes:
   - "Política de Privacidade"
   - "Termos de Uso do Aplicativo"
   - "Termos de Serviço SaaS"
   - "Aviso de Pagamentos"
4. Accept all and continue
5. Redirect to `/dashboard/professor`

**Verify**:
- All 4 document versions sent to backend
- Dashboard displays "Professor" badge
- Professional-specific docs visible only for PROFESSIONAL role

### Scenario 3: DEMO Stub Email Mapping

**Setup**: Backend returns user without role field

**Test Cases**:
- Login as `prof@origo.dev` → should map to PROFESSIONAL role
- Login as `aluno@origo.dev` → should map to STUDENT role
- Login with other email → no role mapping

**Verify**:
- Role stored in localStorage
- Correct dashboard redirect based on mapped role

### Scenario 4: Already Accepted Docs

**Setup**: User who has already accepted all required documents

**Expected Flow**:
1. Login with credentials
2. Backend returns `missing_doc_versions: []`
3. Should skip `/legal/accept` page
4. Direct redirect to role-specific dashboard

**Verify**:
- No legal acceptance page shown
- Direct navigation to dashboard

### Scenario 5: Re-acceptance (APPEND-ONLY)

**Setup**: User accepts same documents multiple times

**Expected Behavior**:
1. First acceptance: Creates records with original `acceptedAt`
2. Re-acceptance: Backend returns 200 but keeps original `acceptedAt` (APPEND-ONLY)
3. Frontend treats as successful acceptance

**Verify**:
- Backend log confirms APPEND-ONLY behavior (no UPDATE queries)
- Original `acceptedAt` timestamp preserved in database

### Scenario 6: Unauthorized Access

**Test Cases**:
- Visit `/legal/accept` without login → redirect to `/login`
- Try POST `/api/v1/legal/accept` without Bearer token → 401 Unauthorized

### Scenario 7: Invalid Document Versions

**Setup**: Attempt to submit invalid doc versions (requires backend testing)

**Test**:
```bash
curl -X POST http://localhost:3001/api/v1/legal/accept \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"docVersions": ["invalid_doc_v1"]}'
```

**Expected**: 422 Validation Error

## Backend API Contract Verification

### Login Response (200)

```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "PROFESSIONAL"  // or "STUDENT"
  },
  "missing_doc_versions": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13",
    "terms_saas_v2_2026-09-13",
    "payments_notice_v2_2026-09-13"
  ]
}
```

### Accept Legal Documents

**Request**:
```
POST /api/v1/legal/accept
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "docVersions": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ]
}
```

**Response (200)**:
```json
{
  "accepted": [
    "privacy_v2_2026-09-13",
    "terms_app_v2_2026-09-13"
  ],
  "acceptedAt": "2026-09-13T17:45:00.000Z"
}
```

## Security Checklist

- ✅ JWT sent in `Authorization: Bearer <token>` header
- ✅ No legal acceptance without authentication
- ✅ 401 response for missing/invalid token
- ✅ User can only accept for their own userId (extracted from JWT)
- ✅ APPEND-ONLY: re-acceptance is idempotent (keeps original acceptedAt)
- ✅ Only whitelisted document versions accepted
- ⚠️  localStorage is DEMO-ONLY (production should use httpOnly cookies)

## Document Version Mappings

| Document Version ID | URL | Required For |
|---------------------|-----|--------------|
| `privacy_v2_2026-09-13` | `/privacidade` | ALL |
| `terms_app_v2_2026-09-13` | `/termos` | ALL |
| `terms_saas_v2_2026-09-13` | `/termos-saas` | PROFESSIONAL |
| `payments_notice_v2_2026-09-13` | `/aviso-pagamentos` | PROFESSIONAL |

**Note**: Cookies and DPA documents are footer-only and NOT login-blocking.

## Troubleshooting

### Issue: API returns 401 on accept

**Solution**: Check that access_token is being stored and sent correctly:
```javascript
// In browser console
localStorage.getItem('origo_access_token')
```

### Issue: Redirect loop on legal page

**Solution**: Check that `missing_doc_versions` is cleared after successful acceptance:
```javascript
// Should be null after acceptance
localStorage.getItem('origo_missing_docs')
```

### Issue: Wrong dashboard displayed

**Solution**: Verify role is stored correctly:
```javascript
JSON.parse(localStorage.getItem('origo_user')).role
```

## Manual Test Checklist

- [ ] STUDENT user sees 2 required documents
- [ ] PROFESSIONAL user sees 4 required documents
- [ ] All document links open in new tab
- [ ] Accept button disabled until all docs checked
- [ ] Successful acceptance redirects to correct dashboard
- [ ] Dashboard displays correct role badge
- [ ] Already-accepted users skip legal page
- [ ] Logout and re-login works correctly
- [ ] Demo stub emails map to correct roles
- [ ] API requests include Bearer token
- [ ] Re-acceptance doesn't break (APPEND-ONLY)
