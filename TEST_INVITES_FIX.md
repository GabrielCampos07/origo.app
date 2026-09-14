# POST /api/v1/invites Fix - Test Scenarios

## Root Cause Summary

The POST /api/v1/invites endpoint was returning HTTP 500 for validation and authentication errors that should return more specific status codes (401, 422, 404).

### Issues Fixed

1. **Missing Body Validation** (500 → 422)
   - **Root Cause**: Destructuring `request.body` without checking if it exists first
   - **Impact**: Malformed JSON or missing Content-Type header caused unhandled error
   - **Fix**: Added validation to check `request.body` exists before destructuring

2. **JWT Verification Errors** (500 → 401)
   - **Root Cause**: `verifyAccessToken()` throws on invalid/expired/malformed JWT, caught by generic catch block
   - **Impact**: Invalid tokens returned 500 instead of proper 401 Unauthorized
   - **Fix**: Separated JWT verification into dedicated try-catch, returns 401 on verification failure

3. **Generic Prisma Error Handling** (500 → 404/422)
   - **Root Cause**: All database errors caught by generic handler and returned as 500
   - **Impact**: Specific errors like "user not found" returned 500 instead of 404
   - **Fix**: Added Prisma error code handling:
     - P2025 (record not found) → 404
     - P2002 (unique constraint) → 422
     - P2003 (foreign key constraint) → 422

## Test Scenarios

### Scenario 1: Missing Request Body (422)

**Before Fix**: Returns 500 Internal Server Error  
**After Fix**: Returns 422 Validation Error

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${VALID_JWT}" \
  -H "Content-Type: application/json"

# Expected Response (422):
# {
#   "error": "Validation Error",
#   "message": "Request body is required"
# }
```

### Scenario 2: Malformed JSON (422)

**Before Fix**: Returns 500 Internal Server Error  
**After Fix**: Returns 422 Validation Error

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${VALID_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": invalid json}'

# Expected: 422 or 400 (Fastify JSON parse error)
```

### Scenario 3: Missing student_email Field (422)

**Before Fix**: Returns 422 ✓ (Already working)  
**After Fix**: Returns 422 ✓

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${VALID_JWT}" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected Response (422):
# {
#   "error": "Validation Error",
#   "message": "student_email is required"
# }
```

### Scenario 4: Invalid Email Format (422)

**Before Fix**: Returns 422 ✓ (Already working)  
**After Fix**: Returns 422 ✓

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${VALID_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "not-an-email"}'

# Expected Response (422):
# {
#   "error": "Validation Error",
#   "message": "Invalid email format"
# }
```

### Scenario 5: Missing Authorization Header (401)

**Before Fix**: Returns 401 ✓ (Already working)  
**After Fix**: Returns 401 ✓

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (401):
# {
#   "error": "Unauthorized",
#   "message": "Valid authentication token required"
# }
```

### Scenario 6: Invalid JWT Token (401)

**Before Fix**: Returns 500 Internal Server Error  
**After Fix**: Returns 401 Unauthorized

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer invalid.jwt.token" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (401):
# {
#   "error": "Unauthorized",
#   "message": "Invalid or expired authentication token"
# }
```

### Scenario 7: Expired JWT Token (401)

**Before Fix**: Returns 500 Internal Server Error  
**After Fix**: Returns 401 Unauthorized

```bash
# Use an expired JWT token
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${EXPIRED_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (401):
# {
#   "error": "Unauthorized",
#   "message": "Invalid or expired authentication token"
# }
```

### Scenario 8: Malformed JWT Token (401)

**Before Fix**: Returns 500 Internal Server Error  
**After Fix**: Returns 401 Unauthorized

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer not-a-valid-jwt-format" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (401):
# {
#   "error": "Unauthorized",
#   "message": "Invalid or expired authentication token"
# }
```

### Scenario 9: STUDENT Role Trying to Create Invite (403)

**Before Fix**: Returns 403 ✓ (Already working)  
**After Fix**: Returns 403 ✓

```bash
# Use a JWT token for a STUDENT user
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${STUDENT_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (403):
# {
#   "error": "Forbidden",
#   "message": "Only PROFESSIONAL users can create invites"
# }
```

### Scenario 10: Professional Without Profile (422)

**Before Fix**: Returns 422 ✓ (Already working)  
**After Fix**: Returns 422 ✓

```bash
# Use a JWT for a PROFESSIONAL user who has no ProfessionalProfile
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${PROFESSIONAL_NO_PROFILE_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (422):
# {
#   "error": "Validation Error",
#   "message": "Professional profile not found"
# }
```

### Scenario 11: Valid Request (200)

**Before Fix**: Returns 200 ✓ (Already working)  
**After Fix**: Returns 200 ✓

```bash
curl -X POST https://api.origo.app/api/v1/invites \
  -H "Authorization: Bearer ${PROFESSIONAL_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"student_email": "student@example.com"}'

# Expected Response (200):
# {
#   "invite_url": "<opaque_token>",
#   "expires_at": "2026-10-14T15:30:00.000Z"
# }
```

## Security Notes

### BACKEND SECURITY CHECKER - Changes Review:

✅ **Fail-Closed**: All new validations return appropriate error codes (422, 401) instead of 500
✅ **No Information Leakage**: Error messages remain generic, no internal details exposed
✅ **JWT Security**: Invalid/expired/malformed JWTs now properly return 401 (not 500)
✅ **Existing Security Requirements Intact**: All 7 locked security requirements unchanged
✅ **Backward Compatible**: No breaking changes to successful request flow
✅ **Rate Limiting**: Unchanged (10 req/15min per authenticated user)

### Key Security Properties Maintained:

1. **Token hash only at rest** - No changes to token storage
2. **Zero client-supplied IDs** - No changes to JWT-derived userId
3. **Generic error states** - Error messages remain non-enumerable
4. **Professional-only endpoint** - Role check unchanged
5. **IDOR protection** - JWT-based authentication unchanged
6. **Category derivation** - Still derived from ProfessionalProfile only
7. **No PII leakage** - Error messages contain no user data

## Testing Instructions

### Local Testing (After Merge)

1. Set up local environment:
   ```bash
   cp .env.example .env
   ./scripts/setup.sh
   npm run api:dev
   ```

2. Generate test JWTs:
   ```bash
   # Login as professional
   PROF_JWT=$(curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "prof@origo.dev", "password": "OrigoDemoProf1!"}' \
     | jq -r '.access_token')
   
   # Login as student
   STUDENT_JWT=$(curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "aluno@origo.dev", "password": "OrigoDemoAluno1!"}' \
     | jq -r '.access_token')
   ```

3. Run test scenarios using the curl commands above

### Live Testing (After Merge + Deploy)

Replace `http://localhost:3001` with your production API URL and use valid production credentials.

## Code Changes

File: `apps/api/src/routes/invites.ts`

### Change 1: Request Body Validation (Lines 147-153)
```typescript
// Added validation to check request.body exists before destructuring
if (!request.body || typeof request.body !== 'object') {
  return reply.code(422).send({
    error: 'Validation Error',
    message: 'Request body is required',
  });
}
```

### Change 2: JWT Verification Try-Catch (Lines 184-198)
```typescript
// Separated JWT verification into dedicated try-catch
let professionalUserId: string;
try {
  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  professionalUserId = payload.userId;
} catch (jwtError) {
  fastify.log.warn(jwtError, 'JWT verification failed in POST /invites');
  return reply.code(401).send({
    error: 'Unauthorized',
    message: 'Invalid or expired authentication token',
  });
}
```

### Change 3: Prisma Error Handling (Lines 250-281)
```typescript
// Added specific Prisma error code handling
if (error && typeof error === 'object' && 'code' in error) {
  const prismaError = error as { code: string; meta?: any };
  
  if (prismaError.code === 'P2025') {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Professional user not found',
    });
  }
  
  if (prismaError.code === 'P2002') {
    return reply.code(422).send({
      error: 'Validation Error',
      message: 'Unable to create invite due to data conflict',
    });
  }
  
  if (prismaError.code === 'P2003') {
    return reply.code(422).send({
      error: 'Validation Error',
      message: 'Invalid reference data provided',
    });
  }
}
```

## Verification Checklist

- [ ] Missing body returns 422 (not 500)
- [ ] Invalid JWT returns 401 (not 500)
- [ ] Expired JWT returns 401 (not 500)
- [ ] Malformed JWT returns 401 (not 500)
- [ ] Missing student_email returns 422
- [ ] Invalid email format returns 422
- [ ] STUDENT role returns 403
- [ ] Professional without profile returns 422
- [ ] Valid request returns 200 with invite_url
- [ ] All security requirements still enforced
- [ ] Rate limiting still works (10 req/15min)
- [ ] Error messages don't leak sensitive info
