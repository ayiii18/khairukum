import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

export type StudentRow = {
  id: string;
  full_name: string;
  gender: 'MALE' | 'FEMALE';
  phone: string | null;
  is_active: boolean;
  account_enabled: boolean;
  halaqa_name: string | null;
  mosque_name: string | null;
  parent_name: string | null;
  enrollment_id: string | null;
  attendance_rate: number | null;
};

const STUDENTS_WITH_CONTEXT = `
  SELECT
    s.id,
    s.full_name,
    s.gender,
    s.phone,
    s.is_active,
    s.account_enabled,
    h.name            AS halaqa_name,
    m.name            AS mosque_name,
    p.full_name       AS parent_name,
    e.id              AS enrollment_id,
    att.rate::float   AS attendance_rate
  FROM students s
  LEFT JOIN student_enrollments e
    ON e.student_id = s.id AND e.status = 'ACTIVE'
  LEFT JOIN halaqat h
    ON h.id = e.halaqa_id
  LEFT JOIN mosques m
    ON m.id = h.mosque_id
  LEFT JOIN parent_students ps
    ON ps.student_id = s.id AND ps.is_primary = TRUE
  LEFT JOIN parents p
    ON p.id = ps.parent_id
  LEFT JOIN LATERAL (
    SELECT ROUND(
             COUNT(*) FILTER (WHERE a.status IN ('PRESENT', 'LATE'))::NUMERIC * 100
             / NULLIF(COUNT(*) FILTER (WHERE a.status <> 'EXCUSED'), 0),
             1
           ) AS rate
    FROM attendance a
    WHERE a.student_enrollment_id = e.id
  ) att ON TRUE
`;

export const getStudents = cache(async (): Promise<StudentRow[]> => {
  return query<StudentRow>(`${STUDENTS_WITH_CONTEXT} ORDER BY s.full_name`);
});

export const getStudentById = cache(async (id: string): Promise<StudentRow | null> => {
  return queryOne<StudentRow>(`${STUDENTS_WITH_CONTEXT} WHERE s.id = $1`, [id]);
});

export const getMosqueOptions = cache(async () => {
  return query<{ id: string; name: string }>(
    `SELECT id, name FROM mosques WHERE is_active = TRUE ORDER BY name`
  );
});

export const getHalaqatOptions = cache(async () => {
  return query<{ id: string; name: string; mosque_name: string; student_count: number }>(
    `
    SELECT h.id, h.name, m.name AS mosque_name, COUNT(se.id)::int AS student_count
    FROM halaqat h
    JOIN mosques m ON m.id = h.mosque_id
    LEFT JOIN student_enrollments se
      ON se.halaqa_id = h.id AND se.status = 'ACTIVE'
    WHERE h.is_active = TRUE
    GROUP BY h.id, h.name, m.name
    ORDER BY m.name, h.name
  `
  );
});