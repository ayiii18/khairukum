'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  assertCanManageEnrollment,
  assertCanManageStudent,
  assertParentOwnsStudent,
} from '@/lib/auth/access';
import { AuthorizationError } from '@/lib/auth/session';
import { logger, errorMessage } from '@/lib/logger';
import { sanitizeText } from '@/lib/validation';

function failure(error: unknown): PortalActionResult {
  if (error instanceof AuthorizationError) {
    return { success: false, error: error.message };
  }
  logger.error('portal.action-failed', { message: errorMessage(error) });
  return { success: false, error: 'تعذر حفظ البيانات. يرجى المحاولة لاحقاً.' };
}

export interface PortalActionResult {
  success: boolean;
  error?: string;
}

export async function recordTeacherAttendance(data: {
  enrollment_id: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
}): Promise<PortalActionResult> {
  try {
    const session = await assertCanManageEnrollment(data.enrollment_id);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.attendance_date)) {
      return { success: false, error: 'تاريخ غير صحيح' };
    }
    if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(data.status)) {
      return { success: false, error: 'حالة حضور غير صحيحة' };
    }

    await query(
      `INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_enrollment_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, recorded_by = EXCLUDED.recorded_by`,
      [
        data.enrollment_id,
        data.attendance_date,
        data.status,
        data.note ? sanitizeText(data.note, 500) : null,
        session.userId,
      ]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    revalidatePath('/attendance');
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}

export async function recordTeacherMemorization(data: {
  enrollment_id: string;
  surah: string;
  from_ayah: number;
  to_ayah: number;
  evaluation?: number;
  note?: string;
}): Promise<PortalActionResult> {
  try {
    const session = await assertCanManageEnrollment(data.enrollment_id);

    const surah = sanitizeText(data.surah, 80);
    if (!surah || data.from_ayah < 1 || data.to_ayah < data.from_ayah) {
      return { success: false, error: 'بيانات الآيات غير صحيحة' };
    }

    await query(
      `INSERT INTO memorization (student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.enrollment_id,
        surah,
        data.from_ayah,
        data.to_ayah,
        Math.min(100, Math.max(0, data.evaluation ?? 100)),
        data.note ? sanitizeText(data.note, 500) : null,
        session.userId,
      ]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    revalidatePath('/memorization');
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}

export async function sendTeacherNoteToParent(data: {
  student_id: string;
  category: 'EDUCATIONAL' | 'BEHAVIORAL' | 'ADMINISTRATIVE' | 'FOLLOW_UP';
  content: string;
}): Promise<PortalActionResult> {
  try {
    const session = await assertCanManageStudent(data.student_id);

    const content = sanitizeText(data.content, 1000);
    if (!content) return { success: false, error: 'نص الملاحظة مطلوب' };
    if (!['EDUCATIONAL', 'BEHAVIORAL', 'ADMINISTRATIVE', 'FOLLOW_UP'].includes(data.category)) {
      return { success: false, error: 'تصنيف الملاحظة غير صحيح' };
    }

    await query(
      `INSERT INTO notes (student_id, teacher_id, category, content)
       VALUES ($1, $2, $3, $4)`,
      [data.student_id, session.teacherId ?? null, data.category, content]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    revalidatePath('/notes');
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}

export async function submitParentExcuse(data: {
  student_id: string;
  date: string;
  reason: string;
}): Promise<PortalActionResult> {
  try {
    const session = await assertParentOwnsStudent(data.student_id);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      return { success: false, error: 'تاريخ غير صحيح' };
    }
    const reason = sanitizeText(data.reason, 500);
    if (reason.length < 3) {
      return { success: false, error: 'يرجى كتابة سبب العذر' };
    }

    const enrollment = await query<{ id: string }>(
      `SELECT id FROM student_enrollments WHERE student_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [data.student_id]
    );

    if (enrollment.length === 0) {
      return { success: false, error: 'لا يوجد تسجيل نشط لهذا الطالب' };
    }

    await query(
      `INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
       VALUES ($1, $2, 'EXCUSED', $3, $4)
       ON CONFLICT (student_enrollment_id, attendance_date)
       DO UPDATE SET status = 'EXCUSED', note = EXCLUDED.note`,
      [enrollment[0].id, data.date, `عذر من ولي الأمر: ${reason}`, session.userId]
    );

    revalidatePath('/parent-portal');
    revalidatePath('/teacher-portal');
    revalidatePath('/attendance');
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
