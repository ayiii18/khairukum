import 'server-only';
import { cache } from 'react';
import { queryOne } from '@/lib/db';
import { errorMessage, logger } from '@/lib/logger';

export interface PublicStats {
  students: number;
  halaqat: number;
  mosques: number;
  teachers: number;
}

const EMPTY_STATS: PublicStats = {
  students: 0,
  halaqat: 0,
  mosques: 0,
  teachers: 0,
};

/**
 * Aggregate counters shown on the public landing page.
 *
 * The landing page is public, so a database hiccup must never take it down.
 * On error we log and fall back to zeros instead of throwing.
 */
export const getPublicStats = cache(async (): Promise<PublicStats> => {
  try {
    const row = await queryOne<PublicStats>(
      `SELECT
         (SELECT COUNT(*)::int FROM students WHERE is_active = TRUE) AS students,
         (SELECT COUNT(*)::int FROM halaqat WHERE is_active = TRUE) AS halaqat,
         (SELECT COUNT(*)::int FROM mosques WHERE is_active = TRUE) AS mosques,
         (SELECT COUNT(*)::int FROM teachers WHERE is_active = TRUE) AS teachers`
    );
    return row ?? EMPTY_STATS;
  } catch (error) {
    logger.warn('landing.stats-unavailable', { message: errorMessage(error) });
    return EMPTY_STATS;
  }
});
