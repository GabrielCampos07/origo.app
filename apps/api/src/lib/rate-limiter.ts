/**
 * Simple in-memory rate limiter for email-hash based rate limiting (MUST-FIX 1)
 * 
 * This is suitable for single-instance deployments. For distributed deployments,
 * use Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class EmailRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  /**
   * Check if rate limit is exceeded for a given key
   * @param key - The rate limit key (e.g., "login:emailhash")
   * @param maxHits - Maximum hits allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if limit exceeded, false otherwise
   */
  check(key: string, maxHits: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // Clean up expired entry
    if (entry && entry.resetAt < now) {
      this.store.delete(key);
    }

    const currentEntry = this.store.get(key);

    if (!currentEntry) {
      // First request in window
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return false;
    }

    // Check if limit exceeded
    if (currentEntry.count >= maxHits) {
      return true;
    }

    // Increment counter
    currentEntry.count++;
    return false;
  }

  /**
   * Clean up expired entries (periodic maintenance)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }
}

// Export singleton instance
export const emailRateLimiter = new EmailRateLimiter();

// Clean up expired entries every 5 minutes
setInterval(() => {
  emailRateLimiter.cleanup();
}, 5 * 60 * 1000);
