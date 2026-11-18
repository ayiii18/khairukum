'use server';

import { transaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';
import { generateTempPassword, TEMP_PASSWORD_HINT } from '@/lib/auth/passwords';
import { logger } from '@/lib/logger';

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  studentId?: string;
  fieldErrors?: Record<string, string>;
}

export async function addStudent(formData: FormData): Promise<ActionResponse> {
  await requireAdmin();

  const full_name = formData.get('full_name')?.toString()?.trim() || '';
  const gender = (formData.get('gender')?.toString()?.trim() || 'MALE') as 'MALE' | 'FEMALE';
  const rawPhone = formData.get('phone')?.toString()?.trim() || '';
  const phone = rawPhone ? rawPhone.replace(/\s+/g, '') : null;
  const halaqa_id = formData.get('halaqa_id')?.toString()?.trim() || '';
  
  const rawParentPhone = formData.get('parent_phone')?.toString()?.trim() || '';
  const parent_phone = rawParentPhone.replace(/\s+/g, '');
  const parent_name = formData.get('parent_name')?.toString()?.trim() || '';
  const relationship = formData.get('relationship')?.toString()?.trim() || 'father';

  // --- Validation ---
  const fieldErrors: Record<string, string> = {};

  if (!full_name) {
    fieldErrors.full_name = 'اسم الطالب مطلوب';
  } else if (full_name.length < 3) {
    fieldErrors.full_name = 'اسم الطالب يجب أن يكون 3 أحرف على الأقل';
  } else if (full_name.length > 100) {
    fieldErrors.full_name = 'اسم الطالب طويل جداً (الحد الأقصى 100 حرف)';
  }

  if (phone) {
    if (phone.length > 20) {
      fieldErrors.phone = 'رقم هاتف الطالب يجب ألا يتجاوز 20 حرفاً';
    } else if (!/^[0-9+\-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8) {
      fieldErrors.phone = 'صيغة رقم هاتف الطالب غير صحيحة';
    }
  }

  if (!parent_phone) {
    fieldErrors.parent_phone = 'رقم هاتف ولي الأمر مطلوب';
  } else if (parent_phone.length > 20) {
    fieldErrors.parent_phone = 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً';
  } else if (!/^[0-9+\-]+$/.test(parent_phone) || parent_phone.replace(/\D/g, '').length < 9) {
    fieldErrors.parent_phone = 'الرجاء إدخال رقم هاتف صحيح لولي الأمر (مثال: 05xxxxxxxx)';
  }

  if (!halaqa_id) {
    fieldErrors.halaqa_id = 'الرجاء اختيار الحلقة الدراسية';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: 'يرجى تصحيح الأخطاء في الحقول المحددة',
      fieldErrors,
    };
  }

  try {
    let studentTempPassword: string | null = null;
    let parentTempPassword: string | null = null;

    const studentId = await transaction(async (client) => {
      let studentUserId: string | null = null;

      // 1. Handle Student User Account (Only if student phone is provided)
      if (phone) {
        const existingStudentUser = await client.query(
          `SELECT id, role FROM users WHERE phone = $1`,
          [phone]
        );

        if (existingStudentUser.rows.length > 0) {
          const existingUserId = existingStudentUser.rows[0].id;
          const studentCheck = await client.query(
            `SELECT id FROM students WHERE user_id = $1`,
            [existingUserId]
          );

          if (studentCheck.rows.length > 0) {
            throw new Error(`رقم الهاتف (${phone}) مسجل بالفعل لطالب آخر في النظام.`);
          }
          studentUserId = existingUserId;
        } else {
          studentTempPassword = generateTempPassword();
          const studentUserRes = await client.query(
            `INSERT INTO users (phone, password_hash, role, is_active, must_change_password)
             VALUES ($1, crypt($2, gen_salt('bf')), 'STUDENT', TRUE, TRUE) RETURNING id`,
            [phone, studentTempPassword]
          );
          studentUserId = studentUserRes.rows[0].id;
        }
      }

      // 2. Create Student Record
      const studentRes = await client.query(
        `INSERT INTO students (user_id, full_name, gender, phone, account_enabled, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
        [studentUserId, full_name, gender, phone, studentUserId !== null]
      );
      const newStudentId = studentRes.rows[0].id;

      // 3. Handle Parent Record and User
      let parentId: string | null = null;
      const existingParentUser = await client.query(
        `SELECT id, role FROM users WHERE phone = $1`,
        [parent_phone]
      );

      let pUserId: string;
      if (existingParentUser.rows.length > 0) {
        pUserId = existingParentUser.rows[0].id;
        const parentRes = await client.query(
          `SELECT id FROM parents WHERE user_id = $1`,
          [pUserId]
        );
        if (parentRes.rows.length > 0) {
          parentId = parentRes.rows[0].id;
        }
      } else {
        parentTempPassword = generateTempPassword();
        const pUserRes = await client.query(
          `INSERT INTO users (phone, password_hash, role, is_active, must_change_password)
           VALUES ($1, crypt($2, gen_salt('bf')), 'PARENT', TRUE, TRUE) RETURNING id`,
          [parent_phone, parentTempPassword]
        );
        pUserId = pUserRes.rows[0].id;
      }

      if (!parentId) {
        const pRes = await client.query(
          `INSERT INTO parents (user_id, full_name)
           VALUES ($1, $2) RETURNING id`,
          [pUserId, parent_name || 'ولي أمر']
        );
        parentId = pRes.rows[0].id;
      }

      // 4. Link Parent to Student
      await client.query(
        `INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (parent_id, student_id) DO NOTHING`,
        [parentId, newStudentId, relationship]
      );

      // 5. Enroll in Halaqa
      if (halaqa_id) {
        await client.query(
          `INSERT INTO student_enrollments (student_id, halaqa_id, start_date, status)
           VALUES ($1, $2, CURRENT_DATE, 'ACTIVE')`,
          [newStudentId, halaqa_id]
        );
      }

      return newStudentId;
    });

    revalidatePath('/students');
    revalidatePath('/parents');
    revalidatePath('/halaqat');

    const credentials: string[] = [];
    if (studentTempPassword) {
      credentials.push(`الطالب: ${studentTempPassword}`);
    }
    if (parentTempPassword) {
      credentials.push(`ولي الأمر: ${parentTempPassword}`);
    }

    return {
      success: true,
      message:
        credentials.length > 0
          ? `تم إضافة الطالب وربطه بالحلقة وولي الأمر بنجاح. كلمات المرور المؤقتة — ${credentials.join(' | ')}. ${TEMP_PASSWORD_HINT}`
          : 'تم إضافة الطالب وربطه بالحلقة وولي الأمر بنجاح!',
      studentId,
    };
  } catch (err) {
    const pgError = err as { message?: string; code?: string; constraint?: string };
    logger.error('students.add-failed', { message: pgError.message });
    let errorMsg = pgError.message || 'حدث خطأ غير متوقع أثناء حفظ البيانات.';
    if (pgError.code === '23505') {
      if (pgError.constraint?.includes('phone')) {
        errorMsg = 'رقم الهاتف المدخل مستخدم مسبقاً في النظام.';
      } else {
        errorMsg = 'توجد بيانات مكررة مسجلة مسبقاً في النظام.';
      }
    } else if (pgError.code === '22001') {
      errorMsg = 'أحد الحقول المدخلة يتجاوز الطول المسموح به في قاعدة البيانات.';
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}
