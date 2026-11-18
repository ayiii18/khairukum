'use server';

import { transaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';

export async function saveDailyAttendance(
  records: { enrollment_id: string; status: string; notes: string | null; date: string }[]
) {
  if (records.length === 0) return { success: true };

  const session = await requireAdmin();
  const allowed = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

  await transaction(async (client) => {
    for (const record of records) {
      if (!allowed.includes(record.status)) {
        throw new Error('حالة حضور غير صحيحة');
      }
      await client.query(
        `INSERT INTO attendance (student_enrollment_id, attendance_date, status, note, recorded_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_enrollment_id, attendance_date)
         DO UPDATE SET status = EXCLUDED.status,
                       note = EXCLUDED.note,
                       recorded_by = EXCLUDED.recorded_by`,
        [record.enrollment_id, record.date, record.status, record.notes, session.userId]
      );
    }
  });

  revalidatePath('/attendance');
  revalidatePath('/teacher-portal');
  revalidatePath('/parent-portal');
  return { success: true };
}
