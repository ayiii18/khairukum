import { describe, expect, it } from 'vitest';
import { generateTempPassword } from '@/lib/auth/passwords';
import { isValidPassword } from '@/lib/validation';

describe('generateTempPassword', () => {
  it('always satisfies the password policy', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generateTempPassword();
      expect(isValidPassword(password).ok).toBe(true);
    }
  });

  it('is at least 8 characters and defaults to 10', () => {
    expect(generateTempPassword().length).toBe(10);
    expect(generateTempPassword(8).length).toBeGreaterThanOrEqual(8);
    expect(generateTempPassword(24).length).toBeGreaterThanOrEqual(24);
  });

  it('contains uppercase, lowercase and digits', () => {
    for (let i = 0; i < 50; i += 1) {
      const password = generateTempPassword();
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
    }
  });

  it('only uses the allowed, unambiguous alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateTempPassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('produces distinct values', () => {
    const values = new Set(Array.from({ length: 100 }, () => generateTempPassword()));
    expect(values.size).toBeGreaterThan(90);
  });
});
