import { describe, expect, it } from 'vitest';
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MINUTES,
  evaluateRateLimit,
} from '@/lib/rate-limit-policy';

const NOW = Date.parse('2026-01-01T12:00:00.000Z');
const minutesAgo = (minutes: number) =>
  new Date(NOW - minutes * 60_000).toISOString();

describe('evaluateRateLimit', () => {
  it('allows requests below the failure threshold', () => {
    expect(evaluateRateLimit(0, null, NOW)).toEqual({ blocked: false });
    expect(evaluateRateLimit(LOGIN_MAX_FAILURES - 1, minutesAgo(1), NOW)).toEqual({
      blocked: false,
    });
  });

  it('blocks when the threshold is reached', () => {
    const result = evaluateRateLimit(LOGIN_MAX_FAILURES, minutesAgo(1), NOW);
    expect(result.blocked).toBe(true);
    expect(result.retryAfterMinutes).toBeGreaterThan(0);
  });

  it('reports the remaining wait based on the oldest failure', () => {
    const result = evaluateRateLimit(
      LOGIN_MAX_FAILURES,
      minutesAgo(LOGIN_WINDOW_MINUTES - 5),
      NOW
    );
    expect(result.blocked).toBe(true);
    expect(result.retryAfterMinutes).toBe(5);
  });

  it('never reports less than one minute', () => {
    const result = evaluateRateLimit(
      LOGIN_MAX_FAILURES,
      minutesAgo(LOGIN_WINDOW_MINUTES * 2),
      NOW
    );
    expect(result.blocked).toBe(true);
    expect(result.retryAfterMinutes).toBe(1);
  });

  it('treats a missing timestamp as "now"', () => {
    const result = evaluateRateLimit(LOGIN_MAX_FAILURES, null, NOW);
    expect(result.blocked).toBe(true);
    expect(result.retryAfterMinutes).toBe(LOGIN_WINDOW_MINUTES);
  });

  it('honours custom thresholds and windows', () => {
    const result = evaluateRateLimit(3, minutesAgo(2), NOW, 3, 10);
    expect(result.blocked).toBe(true);
    expect(result.retryAfterMinutes).toBe(8);
  });
});
