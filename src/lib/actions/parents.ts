'use server';

import { transaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function addParent(formData: FormData) {
  const full_name = formData.get('full_name')?.toString();
  const phone = formData.get('phone')?.toString();

  if (!full_name || !phone) {
    throw new Error('الاسم ورقم الجوال مطلوبان');
  }

  await transaction(async (client) => {
    const userRes = await client.query(
      `INSERT INTO users (phone, password_hash, role, is_active)
       VALUES ($1, $2, 'PARENT', TRUE) RETURNING id`,
      [phone, 'default_hash_123']
    );
    
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO parents (user_id, full_name)
       VALUES ($1, $2)`,
      [userId, full_name]
    );
  });

  revalidatePath('/parents');
}

export async function deleteParent(id: string) {
  await transaction(async (client) => {
    const res = await client.query(`SELECT user_id FROM parents WHERE id = $1`, [id]);
    const userId = res.rows[0]?.user_id;

    // Delete related records in parent_students first
    await client.query(`DELETE FROM parent_students WHERE parent_id = $1`, [id]);
    
    // Delete parent
    await client.query(`DELETE FROM parents WHERE id = $1`, [id]);

    // Delete user
    if (userId) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
  });
  
  revalidatePath('/parents');
}
