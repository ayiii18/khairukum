'use server';

import { query, queryOne } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function recordTeacherAttendance(data: {
  enrollment_id: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
}) {
  try {
    // Resolve recorder admin/teacher user
    const fallbackUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE role IN ('TEACHER', 'ADMIN') LIMIT 1`
    );
    const recordedBy = fallbackUser?.id || '00000000-0000-0000-0000-000000000000';

    await query(
      `INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_enrollment_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, recorded_by = EXCLUDED.recorded_by`,
      [data.enrollment_id, data.attendance_date, data.status, data.note || null, recordedBy]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    return { success: false, error: error.message };
  }
}

export async function recordTeacherMemorization(data: {
  enrollment_id: string;
  surah: string;
  from_ayah: number;
  to_ayah: number;
  evaluation?: number;
  note?: string;
}) {
  try {
    const fallbackUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE role IN ('TEACHER', 'ADMIN') LIMIT 1`
    );
    const recordedBy = fallbackUser?.id || '00000000-0000-0000-0000-000000000000';

    await query(
      `INSERT INTO memorization (student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.enrollment_id,
        data.surah,
        data.from_ayah,
        data.to_ayah,
        data.evaluation ?? 100,
        data.note || null,
        recordedBy,
      ]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving memorization:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTeacherNoteToParent(data: {
  student_id: string;
  teacher_id: string;
  category: 'EDUCATIONAL' | 'BEHAVIORAL' | 'ADMINISTRATIVE' | 'FOLLOW_UP';
  content: string;
}) {
  try {
    await query(
      `INSERT INTO notes (student_id, teacher_id, category, content)
       VALUES ($1, $2, $3, $4)`,
      [data.student_id, data.teacher_id, data.category, data.content]
    );

    revalidatePath('/teacher-portal');
    revalidatePath('/parent-portal');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving note:', error);
    return { success: false, error: error.message };
  }
}

export async function submitParentExcuse(data: {
  student_id: string;
  date: string;
  reason: string;
}) {
  try {
    // Find active enrollment
    const enrollment = await queryOne<{ id: string }>(
      `SELECT id FROM student_enrollments WHERE student_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [data.student_id]
    );

    if (enrollment) {
      const fallbackUser = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`
      );
      await query(
        `INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
         VALUES ($1, $2, 'EXCUSED', $3, $4)
         ON CONFLICT (student_enrollment_id, attendance_date)
         DO UPDATE SET status = 'EXCUSED', note = EXCLUDED.note`,
        [enrollment.id, data.date, `عذر من ولي الأمر: ${data.reason}`, fallbackUser?.id || '00000000-0000-0000-0000-000000000000']
      );
    }

    revalidatePath('/parent-portal');
    revalidatePath('/teacher-portal');
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting excuse:', error);
    return { success: false, error: error.message };
  }
}
