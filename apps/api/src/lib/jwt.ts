import jwt, { SignOptions } from 'jsonwebtoken';

// MUST-FIX 3: Fail fast if JWT_SECRET is missing in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate JWT_SECRET at module load time
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is required in production. ' +
      'Generate a secure random string: openssl rand -base64 32'
    );
  } else {
    console.warn(
      'WARNING: JWT_SECRET not set. Using insecure fallback for development only. ' +
      'DO NOT use in production!'
    );
  }
}

const JWT_SECRET_VALIDATED = JWT_SECRET || 'INSECURE_DEV_FALLBACK_DO_NOT_USE_IN_PROD';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Generate an access JWT (D1: 15 min TTL)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(
    { email: payload.email }, 
    JWT_SECRET_VALIDATED, 
    {
      expiresIn: JWT_ACCESS_EXPIRES_IN as any,
      issuer: 'origo-api',
      subject: payload.userId,
    }
  );
}

/**
 * Verify and decode an access JWT
 */
export function verifyAccessToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, JWT_SECRET_VALIDATED, {
    issuer: 'origo-api',
  }) as jwt.JwtPayload;

  return {
    userId: decoded.sub!,
    email: decoded.email,
  };
}

/**
 * Calculate token expiry timestamp for refresh tokens (D1: 7 days)
 */
export function getRefreshTokenExpiry(): Date {
  const ttl = JWT_REFRESH_EXPIRES_IN;
  const match = ttl.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const [, amount, unit] = match;
  const ms = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  }[unit]!;

  return new Date(Date.now() + parseInt(amount, 10) * ms);
}

/**
 * Calculate reset token expiry (D4: ≤30 min TTL)
 */
export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + 30 * 60 * 1000);
}
