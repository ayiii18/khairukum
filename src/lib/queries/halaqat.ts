import { cache } from 'react';
import { query } from '@/lib/db';

export type HalaqaRow = {
  id: string;
  name: string;
  mosque_name: string;
  description: string | null;
  is_active: boolean;
  students_count: number;
  primary_teacher_name: string | null;
};

const HALAQAT_BASE = `
  SELECT 
    h.id,
    h.name,
    m.name AS mosque_name,
    h.description,
    h.is_active,
    COUNT(DISTINCT se.student_id)::int AS students_count,
    COALESCE(
      MAX(CASE WHEN th.is_primary = TRUE THEN t.full_name END),
      MAX(t.full_name)
    ) AS primary_teacher_name
  FROM halaqat h
  JOIN mosques m ON m.id = h.mosque_id
  LEFT JOIN student_enrollments se ON se.halaqa_id = h.id AND se.status = 'ACTIVE'
  LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id
  LEFT JOIN teachers t ON t.id = th.teacher_id
`;

export const getHalaqat = cache(async (): Promise<HalaqaRow[]> => {
  return query<HalaqaRow>(
    `${HALAQAT_BASE} GROUP BY h.id, m.name ORDER BY m.name, h.name`
  );
});

export const getHalaqatByMosque = cache(
  async (mosqueId: string): Promise<HalaqaRow[]> => {
    return query<HalaqaRow>(
      `${HALAQAT_BASE} WHERE h.mosque_id = $1 GROUP BY h.id, m.name ORDER BY h.name`,
      [mosqueId]
    );
  }
);
