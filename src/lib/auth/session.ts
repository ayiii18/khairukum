import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  homeForRole,
  signSession,
  verifySessionToken,
  type Role,
  type SessionPayload,
} from './token';

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) {
    redirect('/?login=true');
  }
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(homeForRole(session.role));
  }
  return session;
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Guard for Server Actions. Server Actions are public HTTP endpoints, so every
 * mutation must authorise itself instead of relying on the UI hiding buttons.
 */
export class AuthorizationError extends Error {
  constructor(message = 'غير مصرح لك بتنفيذ هذه العملية') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireSessionForAction(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) throw new AuthorizationError('انتهت الجلسة، يرجى تسجيل الدخول من جديد');
  return session;
}

export async function requireRoleForAction(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSessionForAction();
  if (!roles.includes(session.role)) throw new AuthorizationError();
  return session;
}
