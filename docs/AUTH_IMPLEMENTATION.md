# Auth Implementation Notes

## Overview

This implementation provides production-ready authentication endpoints for the Origo API:

- `POST /api/v1/auth/login` - User authentication with JWT tokens
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Complete password reset

## Security Features

### Token Management (D1)
- **Access tokens**: JWT with 15-minute TTL
- **Refresh tokens**: Opaque tokens stored as SHA-256 hashes, 7-day TTL
- **Password reset tokens**: ≥128-bit entropy, SHA-256 hashed, 30-minute TTL
- On successful password reset, ALL refresh tokens for that user are invalidated

### Password Security
- Argon2id hashing with secure parameters
- Minimum 12 characters required (D4)
- Never logged in plaintext

### Anti-Enumeration (D7)
- Forgot password ALWAYS returns 200 with generic message
- Constant-time delays for authentication failures
- No indication if email exists or not

### Rate Limiting (D4)
- Login: 5 requests/min per IP + 10 requests/hour per email hash
- Forgot password: 3 requests/hour per email hash + 10 requests/hour per IP
- Global: 100 requests per 15 minutes

### Token Policies
- Reset tokens are single-use (marked with `used_at`)
- Reset tokens expire in 30 minutes
- Only 410 (Gone) returned for expired/used/invalid tokens, never 400

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://origo:origo_dev_password@localhost:5435/origo_dev
JWT_SECRET=change_me_in_production_use_secure_random_string

# Optional (with defaults)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@origo.local
FRONTEND_URL=http://localhost:3000
```

## Database Maintenance (D8-purge)

Expired and used tokens should be periodically purged. Run this SQL or schedule it as a cron job:

```sql
-- Password reset tokens: expired OR used
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() OR used_at IS NOT NULL;

-- Refresh tokens: expired OR revoked
DELETE FROM refresh_tokens
WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
```

Example cron (daily at 2 AM):
```bash
0 2 * * * psql $DATABASE_URL -c "DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL; DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL;"
```

See `docs/D8-TOKEN-PURGE.md` for detailed purge strategy and implementation patterns.

## Email Templates (D2)

Password reset emails are sent via SMTP (Mailhog in development) with a generic template that:
- Never reveals if the email exists
- Includes a 30-minute expiration notice
- Links to `/reset-password#token=<token>` on the frontend
- Uses plain text + HTML formats

## Testing

Local setup ports:
- API: http://localhost:3001
- Postgres: localhost:5435
- Mailhog Web UI: http://localhost:8025
- Mailhog SMTP: localhost:1025

### Setup
```bash
./scripts/setup.sh
npm run api:dev
```

### Test flow
1. Create a test user (insert into DB with hashed password)
2. Test login: `POST /api/v1/auth/login`
3. Test forgot password: `POST /api/v1/auth/forgot-password`
4. Check Mailhog UI for reset email
5. Copy token from email
6. Test reset: `POST /api/v1/auth/reset-password`

## Code Structure

```
apps/api/src/
├── lib/
│   ├── crypto.ts    # Password hashing, token generation
│   ├── jwt.ts       # JWT generation and verification
│   └── email.ts     # SMTP email sending
├── routes/
│   └── auth.ts      # Auth endpoint handlers
└── index.ts         # Main server with route registration
```

## Security Notes for Review

**BACKEND SECURITY CHECKER** comments are placed in code near critical security implementations:
- Rate limiting configuration
- Anti-enumeration measures
- Token invalidation on password reset
