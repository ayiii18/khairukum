'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';

export async function addMemorization(formData: FormData) {
  await requireAdmin();

  const student_enrollment_id = formData.get('enrollment_id')?.toString();
  const surah = formData.get('surah')?.toString()?.trim();
  const from_ayah = parseInt(formData.get('from_ayah')?.toString() || '0');
  const to_ayah = parseInt(formData.get('to_ayah')?.toString() || '0');
  const evaluation = parseInt(formData.get('evaluation')?.toString() || '5');
  const note = formData.get('note')?.toString() || null;

  if (!student_enrollment_id || !surah || !from_ayah || !to_ayah) {
    throw new Error('الرجاء إكمال البيانات الأساسية');
  }
  if (to_ayah < from_ayah) {
    throw new Error('آية النهاية يجب أن تكون بعد آية البداية');
  }

  await query(
    `INSERT INTO memorization (student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [student_enrollment_id, surah, from_ayah, to_ayah, evaluation, note]
  );

  revalidatePath('/memorization');
  revalidatePath('/parent-portal');
}
