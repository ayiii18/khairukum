import { cache } from 'react';
import { query } from '@/lib/db';

export type AttendanceRow = {
  id: string;
  student_name: string;
  halaqa_name: string;
  teacher_name: string | null;
  attendance_date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes: string | null;
};

const ATTENDANCE_WITH_CONTEXT = `
  SELECT 
    a.id,
    s.full_name AS student_name,
    h.name AS halaqa_name,
    t.full_name AS teacher_name,
    a.attendance_date,
    a.status,
    a.note as notes
  FROM attendance a
  JOIN student_enrollments e ON e.id = a.student_enrollment_id
  JOIN students s ON s.id = e.student_id
  JOIN halaqat h ON h.id = e.halaqa_id
  LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id AND th.is_primary = TRUE
  LEFT JOIN teachers t ON t.id = th.teacher_id
`;

export const getAttendance = cache(async (): Promise<AttendanceRow[]> => {
  return query<AttendanceRow>(`${ATTENDANCE_WITH_CONTEXT} ORDER BY a.attendance_date DESC LIMIT 500`);
});

export type AttendanceStudentRow = {
  enrollment_id: string;
  student_name: string;
  halaqa_name: string;
  halaqa_id: string;
  mosque_id: string;
};

export const getStudentsForAttendance = cache(async (): Promise<AttendanceStudentRow[]> => {
  return query<AttendanceStudentRow>(`
    SELECT 
      e.id AS enrollment_id,
      s.full_name AS student_name,
      h.name AS halaqa_name,
      h.id AS halaqa_id,
      h.mosque_id
    FROM student_enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN halaqat h ON h.id = e.halaqa_id
    WHERE e.status = 'ACTIVE'
    ORDER BY h.name, s.full_name
  `);
});
