# Testing Password Reset Flow

This document explains how to verify the forgot-password and reset-password functionality works correctly on localhost.

## Local Services

You'll need three services running:

1. **Mailhog** (email catcher): http://localhost:8025
2. **API Backend**: http://localhost:3001
3. **Web Frontend**: http://localhost:3456

## Testing Steps

### 1. Request Password Reset

1. Navigate to http://localhost:3456/forgot-password
2. Enter a registered user email (e.g., `prof@example.com` or `aluno@example.com`)
3. Click "Enviar link"
4. You should see: "Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha."

### 2. Check Mailhog

1. Open http://localhost:8025
2. Find the password reset email
3. Look for the reset link - it should contain a token in the URL hash: `#token=...` or as query param `?token=...`
4. **IMPORTANT**: The frontend prioritizes reading from `#token=` (hash), with fallback to `?token=` (query param)

### 3. Reset Password

1. Click the reset link from the email (or copy/paste into browser)
2. The page should load at http://localhost:3456/reset-password
3. The token is captured from the URL and then cleared from the browser history
4. Enter a new password (minimum 12 characters)
5. Confirm the password
6. Click "Salvar nova senha"

### 4. Verify Success

1. You should see: "Senha alterada. Redirecionando para o login…"
2. After 1.5 seconds, you'll be redirected to `/login`
3. Log in with the email and NEW password
4. You should be redirected to `/dashboard`

## Error Cases to Test

### 410 - Token Expired or Already Used
- Use the same reset link twice
- Expected: "Este link expirou ou já foi usado (410)"

### 422 - Validation Error
- Try a password with less than 12 characters
- Expected: "Senha deve ter pelo menos 12 caracteres"
- Try mismatched passwords in the confirm field
- Expected: "As senhas não coincidem"

### 429 - Rate Limited
- Attempt multiple password resets in quick succession
- Expected: "Muitas tentativas. Aguarde e tente novamente (429)"

## Technical Details

### Token Reading Priority

```typescript
// 1. First, check URL hash for #token=VALUE
// 2. Fallback to query param ?token=VALUE
function readResetToken(): string | null {
  const hash = window.location.hash?.replace(/^#/, "") || "";
  if (hash.startsWith("token=")) {
    return decodeURIComponent(hash.slice("token=".length)) || null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}
```

### API Request

The frontend sends to `POST /api/v1/auth/reset-password`:

```json
{
  "token": "...",
  "new_password": "..."
}
```

**Note**: `confirm_password` is NOT sent to the API - it's validated client-side only.

### Email Normalization

- On forgot-password: email is trimmed and lowercased before sending to API
- On login: email is trimmed and lowercased before sending to API
- This ensures consistent lookups regardless of user input casing

## Dashboard After Login

After successful login, users are now redirected to `/dashboard` instead of staying on `/login`.

### Dashboard Features

- **Protected Route**: Automatically redirects to `/login` if no access token is found
- **User Info**: Displays the logged-in user's email
- **Placeholder UI**: Shows "Em breve" message with beOrigo branding
- **Logout**: Button to clear session and return to login

### Role-Based Routes (Future)

Currently, all users see the same `/dashboard` placeholder. When role information is available from the API login response, routes can be split:

- `/dashboard/professional` for PROFESSIONAL role
- `/dashboard/student` for STUDENT role

The `user` object in the API response (`LoginResponse`) will need a `role` field to enable this.

## SECURITY NOTES FOR FRONTEND SECURITY CHECKER

### P0 - localStorage for Tokens (DEMO ONLY)

**Current Implementation** (`lib/auth-storage.ts`):
```typescript
localStorage.setItem("origo_access_token", token);
localStorage.setItem("origo_refresh_token", token);
```

**⚠️ CRITICAL**: This is DEMO-ONLY and NOT production-ready.

**Required for Production**:
1. **Move tokens to httpOnly cookies**:
   - `access_token` → httpOnly + Secure + SameSite=Strict cookie
   - `refresh_token` → httpOnly + Secure + SameSite=Strict cookie with path=/api/v1/auth/refresh

2. **Why httpOnly + Secure**:
   - Prevents XSS attacks from stealing tokens via JavaScript
   - `Secure` flag ensures cookies only sent over HTTPS
   - `SameSite=Strict` prevents CSRF attacks

3. **Cookie Implementation**:
   - Backend must set cookies in `/api/v1/auth/login` response headers
   - Backend must read cookies from request headers for protected routes
   - Frontend should NOT handle tokens directly after login

### P1 - Token Refresh Flow

The current implementation stores `refresh_token` but doesn't implement automatic refresh.

**Required**:
- Implement 401 interceptor that automatically refreshes tokens
- Use `refresh_token` from httpOnly cookie to request new `access_token`
- Handle refresh failures by redirecting to login

### P2 - HTTPS in Production

All API calls and cookies must use HTTPS in production. The `Secure` cookie flag enforces this.

### P3 - Content Security Policy

Consider adding CSP headers to prevent XSS:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

## Starting Local Services

### Backend API (port 3001)
```bash
cd apps/api
npm run dev
```

### Frontend Web (port 3456)
```bash
cd apps/web
npm run dev
```

### Mailhog (port 8025 web, 1025 SMTP)
```bash
# Using Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or using binary
mailhog
```

Configure the API to use Mailhog SMTP:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```
