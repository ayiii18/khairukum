'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export async function addHalaqa(formData: FormData) {
  const name = formData.get('name') as string;
  const mosque_id = formData.get('mosque_id') as string;
  const description = formData.get('description') as string;
  const is_active = formData.get('is_active') === 'true';

  await query(
    `INSERT INTO halaqat (name, mosque_id, description, is_active) VALUES ($1, $2, $3, $4)`,
    [name, mosque_id, description, is_active]
  );
  revalidatePath('/halaqat');
}

export async function deleteHalaqa(id: string) {
  await query(`DELETE FROM halaqat WHERE id = $1`, [id]);
  revalidatePath('/halaqat');
}
