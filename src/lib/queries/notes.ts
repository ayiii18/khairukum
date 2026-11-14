import { cache } from 'react';
import { query } from '@/lib/db';

export type NoteRow = {
  id: string;
  student_name: string;
  teacher_name: string;
  category: 'EDUCATIONAL' | 'BEHAVIORAL' | 'ADMINISTRATIVE' | 'FOLLOWUP';
  content: string;
  created_at: Date;
};

export const getNotes = cache(async (): Promise<NoteRow[]> => {
  return query<NoteRow>(`
    SELECT 
      n.id,
      s.full_name AS student_name,
      t.full_name AS teacher_name,
      n.category,
      n.content,
      n.created_at
    FROM notes n
    JOIN students s ON s.id = n.student_id
    JOIN teachers t ON t.id = n.teacher_id
    ORDER BY n.created_at DESC
  `);
});
