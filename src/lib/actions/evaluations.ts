'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function addEvaluation(formData: FormData) {
  const student_enrollment_id = formData.get('enrollment_id')?.toString();
  const memorization_score = parseInt(formData.get('memorization_score')?.toString() || '5');
  const revision_score = parseInt(formData.get('revision_score')?.toString() || '5');
  const recitation_score = parseInt(formData.get('recitation_score')?.toString() || '5');
  const overall_score = parseInt(formData.get('overall_score')?.toString() || '5');
  const note = formData.get('note')?.toString() || null;

  if (!student_enrollment_id) {
    throw new Error('الرجاء إكمال البيانات الأساسية');
  }

  await query(
    `INSERT INTO evaluations (student_enrollment_id, memorization_score, revision_score, recitation_score, overall_score, note, evaluated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [student_enrollment_id, memorization_score, revision_score, recitation_score, overall_score, note]
  );

  revalidatePath('/evaluations');
}
