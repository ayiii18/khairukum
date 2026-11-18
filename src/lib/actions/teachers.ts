'use server';

import { query, queryOne, transaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';
import { generateTempPassword, TEMP_PASSWORD_HINT } from '@/lib/auth/passwords';

export async function addTeacher(formData: FormData) {
  await requireAdmin();

  const full_name = formData.get('full_name')?.toString()?.trim();
  const rawPhone = formData.get('phone')?.toString()?.trim();
  const phone = rawPhone ? rawPhone.replace(/\s+/g, '') : '';
  const is_active = formData.get('is_active') === 'true';
  const halaqa_id = formData.get('halaqa_id')?.toString()?.trim() || null;

  if (!full_name || full_name.length < 3) {
    throw new Error('الاسم الرباعي للمعلم مطلوب (3 أحرف على الأقل)');
  }
  if (!phone) {
    throw new Error('رقم الجوال مطلوب');
  }
  if (phone.length > 20) {
    throw new Error('رقم الجوال يجب ألا يتجاوز 20 رقماً');
  }

  // Use a transaction to create user, teacher, and optionally assign halaqa
  const tempPassword = generateTempPassword();

  await transaction(async (client) => {
    // 1. Check if phone is already registered
    const existing = await client.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (existing.rows.length > 0) {
      throw new Error(`رقم الهاتف (${phone}) مسجل بالفعل لمستخدم آخر في النظام.`);
    }

    // 2. Create User
    const userRes = await client.query(
      `INSERT INTO users (phone, password_hash, role, is_active, must_change_password)
       VALUES ($1, crypt($2, gen_salt('bf')), 'TEACHER', $3, TRUE) RETURNING id`,
      [phone, tempPassword, is_active]
    );
    const userId = userRes.rows[0].id;

    // 3. Create Teacher
    const teacherRes = await client.query(
      `INSERT INTO teachers (user_id, full_name, phone, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, full_name, phone, is_active]
    );
    const teacherId = teacherRes.rows[0].id;

    // 4. Optionally assign primary halaqa right upon creation
    if (halaqa_id) {
      await client.query(
        `INSERT INTO teacher_halaqas (teacher_id, halaqa_id, is_primary)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (teacher_id, halaqa_id)
         DO UPDATE SET is_primary = TRUE`,
        [teacherId, halaqa_id]
      );
    }
  });

  revalidatePath('/teachers');
  revalidatePath('/halaqat');
  return {
    success: true,
    tempPassword,
    message: `تم إضافة المعلم. كلمة المرور المؤقتة: ${tempPassword}. ${TEMP_PASSWORD_HINT}`,
  };
}

export async function updateTeacher(id: string, formData: FormData) {
  await requireAdmin();

  const full_name = formData.get('full_name')?.toString()?.trim();
  const rawPhone = formData.get('phone')?.toString()?.trim();
  const phone = rawPhone ? rawPhone.replace(/\s+/g, '') : '';
  const is_active = formData.get('is_active') === 'true';

  if (!full_name || full_name.length < 3) {
    throw new Error('الاسم مطلوب (3 أحرف على الأقل)');
  }

  await transaction(async (client) => {
    const tRes = await client.query(`SELECT user_id FROM teachers WHERE id = $1`, [id]);
    if (tRes.rows.length === 0) {
      throw new Error('المعلم غير موجود');
    }
    const userId = tRes.rows[0].user_id;

    if (phone) {
      if (phone.length > 20) {
        throw new Error('رقم الجوال يجب ألا يتجاوز 20 رقماً');
      }
      // Check phone uniqueness against other users
      const checkUser = await client.query(
        `SELECT id FROM users WHERE phone = $1 AND id <> $2`,
        [phone, userId]
      );
      if (checkUser.rows.length > 0) {
        throw new Error(`رقم الهاتف (${phone}) مستخدم من قِبل حساب آخر`);
      }

      await client.query(
        `UPDATE users SET phone = $1, is_active = $2, updated_at = NOW() WHERE id = $3`,
        [phone, is_active, userId]
      );
      await client.query(
        `UPDATE teachers SET full_name = $1, phone = $2, is_active = $3, updated_at = NOW() WHERE id = $4`,
        [full_name, phone, is_active, id]
      );
    } else {
      await client.query(
        `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`,
        [is_active, userId]
      );
      await client.query(
        `UPDATE teachers SET full_name = $1, is_active = $2, updated_at = NOW() WHERE id = $3`,
        [full_name, is_active, id]
      );
    }
  });

  revalidatePath(`/teachers/${id}`);
  revalidatePath('/teachers');
}

export async function deleteTeacher(id: string) {
  await requireAdmin();

  const assigned = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM teacher_halaqas WHERE teacher_id = $1`,
    [id]
  );
  if ((assigned?.count ?? 0) > 0) {
    throw new Error('لا يمكن حذف المعلم لارتباطه بحلقات. أزل التكليفات أولاً.');
  }

  await transaction(async (client) => {
    const res = await client.query(`SELECT user_id FROM teachers WHERE id = $1`, [id]);
    const userId = res.rows[0]?.user_id;

    // Delete teacher_halaqas first
    await client.query(`DELETE FROM teacher_halaqas WHERE teacher_id = $1`, [id]);
    
    // Delete teacher
    await client.query(`DELETE FROM teachers WHERE id = $1`, [id]);

    // Delete user
    if (userId) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
  });
  
  revalidatePath('/teachers');
  revalidatePath('/halaqat');
}

export async function assignTeacherToHalaqa(teacherId: string, halaqaId: string, isPrimary: boolean) {
  await requireAdmin();
  if (isPrimary) {
    // Unset any existing primary for this teacher
    await query(`UPDATE teacher_halaqas SET is_primary = FALSE WHERE teacher_id = $1`, [teacherId]);
  }

  // Insert or update
  await query(
    `INSERT INTO teacher_halaqas (teacher_id, halaqa_id, is_primary) 
     VALUES ($1, $2, $3)
     ON CONFLICT (teacher_id, halaqa_id) 
     DO UPDATE SET is_primary = EXCLUDED.is_primary`,
    [teacherId, halaqaId, isPrimary]
  );

  revalidatePath(`/teachers/${teacherId}`);
  revalidatePath('/teachers');
  revalidatePath('/halaqat');
}

export async function removeTeacherFromHalaqa(teacherId: string, halaqaId: string) {
  await requireAdmin();

  await query(
    `DELETE FROM teacher_halaqas WHERE teacher_id = $1 AND halaqa_id = $2`,
    [teacherId, halaqaId]
  );

  revalidatePath(`/teachers/${teacherId}`);
  revalidatePath('/teachers');
  revalidatePath('/halaqat');
}

export async function setPrimaryHalaqa(teacherId: string, halaqaId: string) {
  await requireAdmin();

  await transaction(async (client) => {
    await client.query(
      `UPDATE teacher_halaqas SET is_primary = FALSE WHERE teacher_id = $1`,
      [teacherId]
    );
    await client.query(
      `UPDATE teacher_halaqas SET is_primary = TRUE WHERE teacher_id = $1 AND halaqa_id = $2`,
      [teacherId, halaqaId]
    );
  });

  revalidatePath(`/teachers/${teacherId}`);
  revalidatePath('/teachers');
  revalidatePath('/halaqat');
}
