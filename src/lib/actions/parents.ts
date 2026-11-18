'use server';

import { transaction, queryOne } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';
import { generateTempPassword, TEMP_PASSWORD_HINT } from '@/lib/auth/passwords';

export async function addParent(formData: FormData) {
  await requireAdmin();

  const full_name = formData.get('full_name')?.toString()?.trim();
  const phone = formData.get('phone')?.toString()?.replace(/\s+/g, '');

  if (!full_name || !phone) {
    throw new Error('الاسم ورقم الجوال مطلوبان');
  }

  const tempPassword = generateTempPassword();

  await transaction(async (client) => {
    const existing = await client.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (existing.rows.length > 0) {
      throw new Error(`رقم الهاتف (${phone}) مسجل بالفعل لمستخدم آخر.`);
    }

    const userRes = await client.query(
      `INSERT INTO users (phone, password_hash, role, is_active, must_change_password)
       VALUES ($1, crypt($2, gen_salt('bf')), 'PARENT', TRUE, TRUE) RETURNING id`,
      [phone, tempPassword]
    );

    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO parents (user_id, full_name)
       VALUES ($1, $2)`,
      [userId, full_name]
    );
  });

  revalidatePath('/parents');
  return {
    success: true,
    tempPassword,
    message: `تم إضافة ولي الأمر. كلمة المرور المؤقتة: ${tempPassword}. ${TEMP_PASSWORD_HINT}`,
  };
}

export async function deleteParent(id: string) {
  await requireAdmin();

  const linked = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM parent_students WHERE parent_id = $1`,
    [id]
  );
  if ((linked?.count ?? 0) > 0) {
    throw new Error('لا يمكن حذف ولي الأمر لارتباطه بطلاب. افصل الارتباط أولاً.');
  }

  await transaction(async (client) => {
    const res = await client.query(`SELECT user_id FROM parents WHERE id = $1`, [id]);
    const userId = res.rows[0]?.user_id;

    await client.query(`DELETE FROM parent_students WHERE parent_id = $1`, [id]);
    await client.query(`DELETE FROM parents WHERE id = $1`, [id]);

    if (userId) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
  });

  revalidatePath('/parents');
}
