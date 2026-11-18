'use server';

import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/access';

export async function addHalaqa(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name')?.toString()?.trim();
  const mosque_id = formData.get('mosque_id')?.toString()?.trim();
  const description = formData.get('description')?.toString()?.trim();
  const is_active = formData.get('is_active') === 'true';

  if (!name || !mosque_id) {
    throw new Error('اسم الحلقة والمسجد مطلوبان');
  }

  await query(
    `INSERT INTO halaqat (name, mosque_id, description, is_active) VALUES ($1, $2, $3, $4)`,
    [name, mosque_id, description || null, is_active]
  );

  revalidatePath('/halaqat');
  revalidatePath('/mosques');
}

export async function deleteHalaqa(id: string) {
  await requireAdmin();

  const enrolled = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM student_enrollments WHERE halaqa_id = $1`,
    [id]
  );
  if ((enrolled?.count ?? 0) > 0) {
    throw new Error('لا يمكن حذف الحلقة لوجود طلاب مسجلين بها. انقل الطلاب أو أنهِ تسجيلهم أولاً.');
  }

  await query(`DELETE FROM halaqat WHERE id = $1`, [id]);
  revalidatePath('/halaqat');
}
