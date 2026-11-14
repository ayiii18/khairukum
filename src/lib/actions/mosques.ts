'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function addMosque(formData: FormData) {
  const name = formData.get('name')?.toString();
  const address = formData.get('address')?.toString();
  const phone = formData.get('phone')?.toString();
  const description = formData.get('description')?.toString();
  const is_active = formData.get('is_active') === 'true';

  if (!name) {
    throw new Error('Name is required');
  }

  await query(
    `INSERT INTO mosques (name, address, phone, description, is_active)
     VALUES ($1, $2, $3, $4, $5)`,
    [name, address, phone, description, is_active]
  );

  revalidatePath('/mosques');
}

export async function deleteMosque(id: string) {
  await query(`DELETE FROM mosques WHERE id = $1`, [id]);
  revalidatePath('/mosques');
}
