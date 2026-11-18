import { describe, expect, it } from 'vitest';
import {
  homeForRole,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from '@/lib/auth/token';

const adminSession: SessionPayload = {
  userId: '11111111-1111-1111-1111-111111111111',
  role: 'ADMIN',
  name: 'مدير النظام',
  phone: '0500000001',
  mustChangePassword: false,
};

const teacherSession: SessionPayload = {
  userId: '22222222-2222-2222-2222-222222222222',
  role: 'TEACHER',
  name: 'معلم الحلقة',
  phone: '0500000002',
  teacherId: '33333333-3333-3333-3333-333333333333',
};

describe('session token', () => {
  it('round-trips a signed session payload', async () => {
    const token = await signSession(adminSession);
    const decoded = await verifySessionToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded).toMatchObject(adminSession);
  });

  it('preserves optional role identifiers', async () => {
    const token = await signSession(teacherSession);
    const decoded = await verifySessionToken(token);

    expect(decoded?.teacherId).toBe(teacherSession.teacherId);
    expect(decoded?.role).toBe('TEACHER');
  });

  it('rejects a tampered token', async () => {
    const token = await signSession(adminSession);
    const tampered = `${token.slice(0, -3)}abc`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it('rejects missing tokens', async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = await signSession(adminSession);
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'a-completely-different-secret-value-32-chars';
    try {
      expect(await verifySessionToken(token)).toBeNull();
    } finally {
      process.env.AUTH_SECRET = original;
    }
  });
});

describe('homeForRole', () => {
  it('maps each role to its landing page', () => {
    expect(homeForRole('ADMIN')).toBe('/dashboard');
    expect(homeForRole('TEACHER')).toBe('/teacher-portal');
    expect(homeForRole('PARENT')).toBe('/parent-portal');
    expect(homeForRole('STUDENT')).toBe('/unauthorized');
  });
});
