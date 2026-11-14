import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

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
