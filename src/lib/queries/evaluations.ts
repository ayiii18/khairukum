import { cache } from 'react';
import { query } from '@/lib/db';

export type EvaluationRow = {
  id: string;
  student_name: string;
  halaqa_name: string;
  teacher_name: string | null;
  memorization_score: number;
  revision_score: number;
  recitation_score: number;
  overall_score: number;
  note: string | null;
  evaluated_at: Date;
};

export const getEvaluations = cache(async (): Promise<EvaluationRow[]> => {
  return query<EvaluationRow>(`
    SELECT 
      ev.id,
      s.full_name AS student_name,
      h.name AS halaqa_name,
      t.full_name AS teacher_name,
      ev.memorization_score,
      ev.revision_score,
      ev.recitation_score,
      ev.overall_score,
      ev.note,
      ev.evaluated_at
    FROM evaluations ev
    JOIN student_enrollments e ON e.id = ev.student_enrollment_id
    JOIN students s ON s.id = e.student_id
    JOIN halaqat h ON h.id = e.halaqa_id
    LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id AND th.is_primary = TRUE
    LEFT JOIN teachers t ON t.id = th.teacher_id
    ORDER BY ev.evaluated_at DESC
    LIMIT 500
  `);
});
