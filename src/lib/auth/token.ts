import { SignJWT, jwtVerify } from 'jose';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  phone: string;
  teacherId?: string;
  parentId?: string;
  mustChangePassword?: boolean;
}

export const SESSION_COOKIE = 'khairukum_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is missing or too short (min 32 characters)');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.role !== 'string' ||
      !['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(payload.role)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as Role,
      name: typeof payload.name === 'string' ? payload.name : 'مستخدم النظام',
      phone: typeof payload.phone === 'string' ? payload.phone : '',
      teacherId:
        typeof payload.teacherId === 'string' ? payload.teacherId : undefined,
      parentId:
        typeof payload.parentId === 'string' ? payload.parentId : undefined,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

export function homeForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'TEACHER':
      return '/teacher-portal';
    case 'PARENT':
      return '/parent-portal';
    default:
      return '/unauthorized';
  }
}
