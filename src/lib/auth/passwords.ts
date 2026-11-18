import 'server-only';
import { randomInt } from 'node:crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALL = UPPER + LOWER + DIGITS;

function pick(source: string): string {
  return source[randomInt(0, source.length)];
}

/**
 * Generates a one-time password that satisfies the password policy.
 * The caller must show it to the administrator once and require a change
 * at first login (users.must_change_password = TRUE).
 */
export function generateTempPassword(length = 10): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  const rest = Array.from({ length: Math.max(6, length - required.length) }, () => pick(ALL));
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export const TEMP_PASSWORD_HINT =
  'احتفظ بكلمة المرور المؤقتة وشاركها مع المستخدم؛ سيُطلب منه تغييرها عند أول دخول.';
