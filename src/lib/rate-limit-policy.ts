/**
 * Pure rate-limit policy helpers.
 *
 * Kept free of `server-only`, database and Next.js imports so the logic can be
 * unit-tested in isolation (see src/lib/__tests__/rate-limit.test.ts).
 */

export const LOGIN_MAX_FAILURES = 8;
export const LOGIN_WINDOW_MINUTES = 15;

export interface RateLimitResult {
  blocked: boolean;
  retryAfterMinutes?: number;
}

export function evaluateRateLimit(
  failures: number,
  oldestFailureAt: string | null,
  now: number = Date.now(),
  maxFailures: number = LOGIN_MAX_FAILURES,
  windowMinutes: number = LOGIN_WINDOW_MINUTES
): RateLimitResult {
  if (failures < maxFailures) return { blocked: false };

  const oldest = oldestFailureAt ? new Date(oldestFailureAt).getTime() : now;
  const unlockAt = oldest + windowMinutes * 60_000;
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil((unlockAt - now) / 60_000)
  );

  return { blocked: true, retryAfterMinutes };
}
