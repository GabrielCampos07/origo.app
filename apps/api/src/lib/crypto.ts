import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';

/**
 * Hash a password using argon2id (D1: strong password hashing)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a cryptographically secure random token (D4: ≥128 bits entropy)
 * Returns the raw token (to send to user) and its hash (to store in DB)
 */
export function generateSecureToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Hash a token for storage (D1: never store plaintext tokens)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Hash an email for rate limiting keys (MUST-FIX 1: email-hash rate limiting)
 * Never stores/logs raw email in rate limiter key material
 */
export function hashEmailForRateLimit(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}
