'use server';

import { query, queryOne } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';

export async function addMosque(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name')?.toString()?.trim();
  const address = formData.get('address')?.toString()?.trim();
  const phone = formData.get('phone')?.toString()?.trim();
  const description = formData.get('description')?.toString()?.trim();
  const is_active = formData.get('is_active') === 'true';

  if (!name) {
    throw new Error('اسم المسجد مطلوب');
  }

  await query(
    `INSERT INTO mosques (name, address, phone, description, is_active)
     VALUES ($1, $2, $3, $4, $5)`,
    [name, address || null, phone || null, description || null, is_active]
  );

  revalidatePath('/mosques');
  revalidatePath('/halaqat');
}

export async function deleteMosque(id: string) {
  await requireAdmin();

  const linked = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM halaqat WHERE mosque_id = $1`,
    [id]
  );
  if ((linked?.count ?? 0) > 0) {
    throw new Error('لا يمكن حذف المسجد لاحتوائه على حلقات. انقل الحلقات أو احذفها أولاً.');
  }

  await query(`DELETE FROM mosques WHERE id = $1`, [id]);
  revalidatePath('/mosques');
}
