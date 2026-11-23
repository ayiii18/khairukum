import 'server-only';
import { headers } from 'next/headers';
import { query, queryOne } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MINUTES,
  evaluateRateLimit,
  type RateLimitResult,
} from '@/lib/rate-limit-policy';

export type { RateLimitResult } from '@/lib/rate-limit-policy';

async function currentIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return store.get('x-real-ip') || 'local';
}

export async function checkLoginRateLimit(phone: string): Promise<RateLimitResult> {
  try {
    const ip = await currentIp();
    const row = await queryOne<{ failures: number; oldest: string | null }>(
      `SELECT
         COUNT(*)::int AS failures,
         MIN(created_at)::text AS oldest
       FROM login_audit
       WHERE success = FALSE
         AND created_at > NOW() - ($3 || ' minutes')::interval
         AND (phone = $1 OR ip = $2)`,
      [phone, ip, String(LOGIN_WINDOW_MINUTES)]
    );

    if (!row) return { blocked: false };
    return evaluateRateLimit(row.failures, row.oldest);
  } catch (error) {
    logger.warn('rate-limit.check-failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return { blocked: false };
  }
}

export async function recordLoginAttempt(options: {
  phone: string;
  userId?: string | null;
  success: boolean;
  reason?: string;
}): Promise<void> {
  try {
    const ip = await currentIp();
    // A data-modifying CTE appends the attempt and prunes old rows in a single
    // database round-trip, instead of two sequential queries on every login.
    await query(
      `WITH logged AS (
         INSERT INTO login_audit (phone, ip, user_id, success, reason)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id
       )
       DELETE FROM login_audit
       WHERE created_at < NOW() - INTERVAL '30 days'`,
      [options.phone, ip, options.userId ?? null, options.success, options.reason ?? null]
    );
  } catch (error) {
    logger.warn('rate-limit.record-failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES };
