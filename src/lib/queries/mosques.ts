import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

export type MosqueRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  is_active: boolean;
  halaqat_count: number;
  students_count: number;
};

const MOSQUES_WITH_CONTEXT = `
  SELECT 
    m.id,
    m.name,
    m.address,
    m.phone,
    m.description,
    m.is_active,
    COUNT(DISTINCT h.id)::int AS halaqat_count,
    COUNT(DISTINCT se.student_id)::int AS students_count
  FROM mosques m
  LEFT JOIN halaqat h ON h.mosque_id = m.id AND h.is_active = TRUE
  LEFT JOIN student_enrollments se ON se.halaqa_id = h.id AND se.status = 'ACTIVE'
  GROUP BY m.id
`;

export const getMosques = cache(async (): Promise<MosqueRow[]> => {
  return query<MosqueRow>(`${MOSQUES_WITH_CONTEXT} ORDER BY m.name`);
});

export const getMosqueById = cache(async (id: string): Promise<MosqueRow | null> => {
  return queryOne<MosqueRow>(`${MOSQUES_WITH_CONTEXT} HAVING m.id = $1`, [id]);
});
