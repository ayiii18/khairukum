import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

export type HalaqaRow = {
  id: string;
  name: string;
  mosque_name: string;
  description: string | null;
  is_active: boolean;
  students_count: number;
  primary_teacher_name: string | null;
};

const HALAQAT_WITH_CONTEXT = `
  SELECT 
    h.id,
    h.name,
    m.name AS mosque_name,
    h.description,
    h.is_active,
    COUNT(DISTINCT se.student_id)::int AS students_count,
    MAX(CASE WHEN th.is_primary = TRUE THEN t.full_name ELSE NULL END) AS primary_teacher_name
  FROM halaqat h
  JOIN mosques m ON m.id = h.mosque_id
  LEFT JOIN student_enrollments se ON se.halaqa_id = h.id AND se.status = 'ACTIVE'
  LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id
  LEFT JOIN teachers t ON t.id = th.teacher_id
  GROUP BY h.id, m.name
`;

export const getHalaqat = cache(async (): Promise<HalaqaRow[]> => {
  return query<HalaqaRow>(`${HALAQAT_WITH_CONTEXT} ORDER BY m.name, h.name`);
});
