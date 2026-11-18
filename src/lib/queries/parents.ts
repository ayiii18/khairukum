import { cache } from 'react';
import { query } from '@/lib/db';

export type ParentRow = {
  id: string;
  full_name: string;
  phone: string | null;
  children_count: number;
  active_children_count: number;
};

const PARENTS_WITH_CONTEXT = `
  SELECT 
    p.id,
    p.full_name,
    u.phone,
    COUNT(DISTINCT ps.student_id)::int AS children_count,
    COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' THEN se.student_id END)::int AS active_children_count
  FROM parents p
  LEFT JOIN users u ON u.id = p.user_id
  LEFT JOIN parent_students ps ON ps.parent_id = p.id
  LEFT JOIN student_enrollments se ON se.student_id = ps.student_id
  GROUP BY p.id, u.phone
`;

export const getParents = cache(async (): Promise<ParentRow[]> => {
  return query<ParentRow>(`${PARENTS_WITH_CONTEXT} ORDER BY p.full_name`);
});

export type ParentChildRow = {
  student_id: string;
  full_name: string;
  gender: string;
  is_active: boolean;
  relationship: string | null;
  is_primary: boolean;
  mosque_name: string | null;
  halaqa_name: string | null;
  teacher_name: string | null;
  attendance_total: number;
  attendance_attended: number;
  memorization_count: number;
  last_surah: string | null;
};

export type ParentDetail = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  children: ParentChildRow[];
};

/**
 * Full parent record plus every child, the child's current halaqa and
 * attendance/memorization aggregates. Returns null when the id is unknown.
 */
export const getParentById = cache(async (id: string): Promise<ParentDetail | null> => {
  const parentRows = await query<{
    id: string;
    full_name: string;
    phone: string | null;
    is_active: boolean;
  }>(
    `SELECT p.id, p.full_name, u.phone, u.is_active
       FROM parents p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = $1`,
    [id]
  );

  const parent = parentRows[0];
  if (!parent) return null;

  const children = await query<ParentChildRow>(
    `SELECT
       s.id AS student_id,
       s.full_name,
       s.gender,
       s.is_active,
       ps.relationship,
       ps.is_primary,
       m.name AS mosque_name,
       h.name AS halaqa_name,
       t.full_name AS teacher_name,
       COALESCE(att.total, 0)::int AS attendance_total,
       COALESCE(att.attended, 0)::int AS attendance_attended,
       COALESCE(mem.total, 0)::int AS memorization_count,
       mem.last_surah
     FROM parent_students ps
     JOIN students s ON s.id = ps.student_id
     LEFT JOIN LATERAL (
       SELECT se.id, se.halaqa_id
         FROM student_enrollments se
        WHERE se.student_id = s.id AND se.status = 'ACTIVE'
        ORDER BY se.start_date DESC
        LIMIT 1
     ) se ON TRUE
     LEFT JOIN halaqat h ON h.id = se.halaqa_id
     LEFT JOIN mosques m ON m.id = h.mosque_id
     LEFT JOIN LATERAL (
       SELECT t.full_name
         FROM teacher_halaqas th
         JOIN teachers t ON t.id = th.teacher_id
        WHERE th.halaqa_id = h.id
        ORDER BY th.is_primary DESC, th.assigned_at ASC
        LIMIT 1
     ) t ON TRUE
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE a.status IN ('PRESENT', 'LATE'))::int AS attended
         FROM attendance a
        WHERE a.student_enrollment_id = se.id
     ) att ON TRUE
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*)::int AS total,
         (array_agg(mo.surah ORDER BY mo.recorded_at DESC))[1] AS last_surah
         FROM memorization mo
        WHERE mo.student_enrollment_id = se.id
     ) mem ON TRUE
     WHERE ps.parent_id = $1
     ORDER BY s.full_name`,
    [id]
  );

  return { ...parent, children };
});
