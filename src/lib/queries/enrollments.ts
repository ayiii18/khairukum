import { cache } from 'react';
import { query, queryOne } from '@/lib/db';

export type EnrollmentRow = {
  id: string;
  student_name: string;
  halaqa_name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED' | 'SUSPENDED';
  start_date: Date;
};

const ENROLLMENTS_WITH_CONTEXT = `
  SELECT 
    e.id,
    s.full_name AS student_name,
    h.name AS halaqa_name,
    e.status,
    e.start_date
  FROM student_enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN halaqat h ON h.id = e.halaqa_id
`;

export const getEnrollments = cache(async (): Promise<EnrollmentRow[]> => {
  return query<EnrollmentRow>(`${ENROLLMENTS_WITH_CONTEXT} ORDER BY s.full_name`);
});
