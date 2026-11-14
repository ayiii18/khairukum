import { cache } from 'react';
import { query } from '@/lib/db';

export type MemorizationRow = {
  id: string;
  student_name: string;
  halaqa_name: string;
  teacher_name: string | null;
  surah: string;
  from_ayah: number;
  to_ayah: number;
  evaluation: number;
  note: string | null;
  recorded_at: Date;
};

export const getMemorizationRecords = cache(async (): Promise<MemorizationRow[]> => {
  return query<MemorizationRow>(`
    SELECT 
      m.id,
      s.full_name AS student_name,
      h.name AS halaqa_name,
      t.full_name AS teacher_name,
      m.surah,
      m.from_ayah,
      m.to_ayah,
      m.evaluation,
      m.note,
      m.recorded_at
    FROM memorization m
    JOIN student_enrollments e ON e.id = m.student_enrollment_id
    JOIN students s ON s.id = e.student_id
    JOIN halaqat h ON h.id = e.halaqa_id
    LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id AND th.is_primary = TRUE
    LEFT JOIN teachers t ON t.id = th.teacher_id
    ORDER BY m.recorded_at DESC
    LIMIT 500
  `);
});
