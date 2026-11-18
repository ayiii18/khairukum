import { describe, expect, it } from 'vitest';
import {
  isValidName,
  isValidPassword,
  isValidPhone,
  isValidSaudiPhone,
  normalizeDigits,
  normalizePhone,
  sanitizeText,
} from '@/lib/validation';

describe('normalizeDigits', () => {
  it('converts Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('converts extended Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('leaves ASCII text untouched', () => {
    expect(normalizeDigits('0501234567')).toBe('0501234567');
  });
});

describe('normalizePhone', () => {
  it('strips spaces, dashes and parentheses', () => {
    expect(normalizePhone('+966 (50) 123-4567')).toBe('+966501234567');
  });

  it('normalizes Arabic digits before stripping separators', () => {
    expect(normalizePhone('٠٥٠ ١٢٣ ٤٥٦٧')).toBe('0501234567');
  });
});

describe('isValidPhone', () => {
  it('accepts local and international numbers', () => {
    expect(isValidPhone('0501234567')).toBe(true);
    expect(isValidPhone('+966501234567')).toBe(true);
  });

  it('rejects obviously invalid numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('not-a-phone')).toBe(false);
  });
});

describe('isValidSaudiPhone', () => {
  it('accepts Saudi mobile formats', () => {
    expect(isValidSaudiPhone('0501234567')).toBe(true);
    expect(isValidSaudiPhone('+966501234567')).toBe(true);
  });

  it('rejects landlines and foreign numbers', () => {
    expect(isValidSaudiPhone('0112345678')).toBe(false);
    expect(isValidSaudiPhone('+15551234567')).toBe(false);
  });
});

describe('isValidName', () => {
  it('requires 3 to 100 characters', () => {
    expect(isValidName('أحمد')).toBe(true);
    expect(isValidName('  عبدالله بن محمد  ')).toBe(true);
    expect(isValidName('اب')).toBe(false);
    expect(isValidName('ا'.repeat(101))).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts letters + digits with at least 8 characters', () => {
    expect(isValidPassword('Quran2026')).toEqual({ ok: true });
    expect(isValidPassword('كلمةمرور1')).toEqual({ ok: true });
  });

  it('rejects short passwords', () => {
    const result = isValidPassword('Ab1');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('8');
  });

  it('rejects letters-only or digits-only passwords', () => {
    expect(isValidPassword('OnlyLetters').ok).toBe(false);
    expect(isValidPassword('12345678').ok).toBe(false);
  });

  it('rejects passwords longer than 72 characters', () => {
    expect(isValidPassword(`A1${'a'.repeat(71)}`).ok).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('trims, removes NUL bytes and caps length', () => {
    expect(sanitizeText('  hello\u0000  ')).toBe('hello');
    expect(sanitizeText('abcdef', 3)).toBe('abc');
  });
});
