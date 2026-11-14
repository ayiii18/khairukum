'use server';

import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

export type TeacherRow = {
  id: string;
  full_name: string;
  phone: string | null;
  iqama: string | null;
  is_active: boolean;
  primary_halaqa_name: string | null;
  secondary_halaqat_names: string[];
  mosque_name: string | null;
  evaluation_score: number | null;
};

export type TeacherHalaqaAssignment = {
  assignment_id: string;
  halaqa_id: string;
  halaqa_name: string;
  mosque_name: string;
  is_primary: boolean;
  assigned_at: string;
};

const TEACHERS_WITH_CONTEXT = `
  SELECT 
    t.id,
    t.full_name,
    t.phone,
    u.phone AS iqama,
    t.is_active,
    ph.name AS primary_halaqa_name,
    m.name AS mosque_name,
    COALESCE(
      (SELECT array_agg(sh.name) 
       FROM teacher_halaqas th2 
       JOIN halaqat sh ON sh.id = th2.halaqa_id 
       WHERE th2.teacher_id = t.id AND th2.is_primary = FALSE),
      '{}'
    ) AS secondary_halaqat_names,
    (SELECT AVG(overall_score) FROM evaluations e JOIN student_enrollments se ON se.id = e.student_enrollment_id JOIN teacher_halaqas th3 ON th3.halaqa_id = se.halaqa_id WHERE th3.teacher_id = t.id) AS evaluation_score
  FROM teachers t
  LEFT JOIN users u ON u.id = t.user_id
  LEFT JOIN teacher_halaqas th ON th.teacher_id = t.id AND th.is_primary = TRUE
  LEFT JOIN halaqat ph ON ph.id = th.halaqa_id
  LEFT JOIN mosques m ON m.id = ph.mosque_id
`;

export const getTeachers = cache(async (): Promise<TeacherRow[]> => {
  return query<TeacherRow>(`${TEACHERS_WITH_CONTEXT} ORDER BY t.full_name`);
});

export const getTeacherById = cache(async (id: string): Promise<TeacherRow | null> => {
  return queryOne<TeacherRow>(`${TEACHERS_WITH_CONTEXT} WHERE t.id = $1`, [id]);
});

export const getTeacherHalaqat = cache(async (teacherId: string): Promise<TeacherHalaqaAssignment[]> => {
  return query<TeacherHalaqaAssignment>(
    `
    SELECT
      th.id AS assignment_id,
      th.halaqa_id,
      h.name AS halaqa_name,
      m.name AS mosque_name,
      th.is_primary,
      th.assigned_at
    FROM teacher_halaqas th
    JOIN halaqat h ON h.id = th.halaqa_id
    JOIN mosques m ON m.id = h.mosque_id
    WHERE th.teacher_id = $1
    ORDER BY th.is_primary DESC, h.name ASC
    `,
    [teacherId]
  );
});
