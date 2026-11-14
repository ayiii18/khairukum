'use server';

import { query, transaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveDailyAttendance(records: { enrollment_id: string; status: string; notes: string | null; date: string }[]) {
  if (records.length === 0) return;

  await transaction(async (client) => {
    for (const record of records) {
      // Upsert attendance record for the day
      await client.query(`
        INSERT INTO attendance (student_enrollment_id, attendance_date, status, notes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (student_enrollment_id, attendance_date)
        DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
      `, [record.enrollment_id, record.date, record.status, record.notes]);
    }
  });

  revalidatePath('/attendance');
}
