import 'server-only';
import { queryOne } from '@/lib/db';
import { AuthorizationError, requireRoleForAction } from './session';
import type { SessionPayload as SessionUser } from './token';

/**
 * Ownership/authorization helpers for Server Actions.
 * Server Actions are public endpoints; never trust IDs sent by the client.
 */

export async function requireAdmin(): Promise<SessionUser> {
  return requireRoleForAction('ADMIN');
}

export async function requireTeacherOrAdmin(): Promise<SessionUser> {
  return requireRoleForAction('TEACHER', 'ADMIN');
}

export async function assertCanManageEnrollment(
  enrollmentId: string
): Promise<SessionUser> {
  const session = await requireTeacherOrAdmin();
  if (session.role === 'ADMIN') return session;
  if (!session.teacherId) throw new AuthorizationError();

  const owned = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok
     FROM student_enrollments se
     JOIN teacher_halaqas th ON th.halaqa_id = se.halaqa_id
     WHERE se.id = $1 AND th.teacher_id = $2
     LIMIT 1`,
    [enrollmentId, session.teacherId]
  );
  if (!owned) {
    throw new AuthorizationError('لا تملك صلاحية تعديل بيانات هذا الطالب');
  }
  return session;
}

export async function assertCanManageStudent(
  studentId: string
): Promise<SessionUser> {
  const session = await requireTeacherOrAdmin();
  if (session.role === 'ADMIN') return session;
  if (!session.teacherId) throw new AuthorizationError();

  const owned = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok
     FROM student_enrollments se
     JOIN teacher_halaqas th ON th.halaqa_id = se.halaqa_id
     WHERE se.student_id = $1 AND th.teacher_id = $2
     LIMIT 1`,
    [studentId, session.teacherId]
  );
  if (!owned) {
    throw new AuthorizationError('لا تملك صلاحية الوصول لهذا الطالب');
  }
  return session;
}

export async function assertParentOwnsStudent(
  studentId: string
): Promise<SessionUser> {
  const session = await requireRoleForAction('PARENT');
  const owned = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok FROM parent_students WHERE parent_id = $1 AND student_id = $2 LIMIT 1`,
    [session.parentId, studentId]
  );
  if (!owned) {
    throw new AuthorizationError('لا تملك صلاحية الوصول لهذا الطالب');
  }
  return session;
}
