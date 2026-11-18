/**
 * Shared, framework-free validation helpers (unit-tested in
 * src/lib/__tests__/validation.test.ts).
 */

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/g;

export function normalizeDigits(value: string): string {
  return value
    .replace(ARABIC_INDIC_DIGITS, (digit) =>
      String(digit.charCodeAt(0) - 0x0660)
    )
    .replace(EXTENDED_ARABIC_INDIC_DIGITS, (digit) =>
      String(digit.charCodeAt(0) - 0x06f0)
    );
}

export function normalizePhone(value: string): string {
  return normalizeDigits(value).replace(/[\s\-()]/g, '').trim();
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  if (!/^\+?[0-9]{8,20}$/.test(phone)) return false;
  return phone.replace(/\D/g, '').length >= 8;
}

export function isValidSaudiPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return /^(?:\+?9665|05)[0-9]{8}$/.test(phone);
}

export function isValidName(value: string): boolean {
  const name = value.trim();
  return name.length >= 3 && name.length <= 100;
}

export function isValidPassword(value: string): { ok: boolean; error?: string } {
  if (value.length < 8) {
    return { ok: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  if (value.length > 72) {
    // bcrypt silently truncates beyond 72 bytes.
    return { ok: false, error: 'كلمة المرور طويلة جداً (الحد الأقصى 72 حرفاً)' };
  }
  if (!/[A-Za-z\u0600-\u06FF]/.test(value) || !/[0-9]/.test(value)) {
    return {
      ok: false,
      error: 'كلمة المرور يجب أن تحتوي على حروف وأرقام معاً',
    };
  }
  return { ok: true };
}

export function sanitizeText(value: string, maxLength = 500): string {
  return value.replace(/\u0000/g, '').trim().slice(0, maxLength);
}
