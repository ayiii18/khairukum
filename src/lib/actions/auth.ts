'use server';

import { queryOne, query } from '@/lib/db';
import { normalizePhone, isValidPassword, isValidName, sanitizeText } from '@/lib/validation';
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import {
  setSessionCookie,
  clearSessionCookie,
  readSession,
  requireSessionForAction,
} from '@/lib/auth/session';
import { homeForRole, type Role, type SessionPayload } from '@/lib/auth/token';
import { logger, errorMessage } from '@/lib/logger';
import { redirect } from 'next/navigation';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    phone: string;
    role: string;
    name: string;
    teacherId?: string;
    parentId?: string;
  };
  redirectTo?: string;
}

const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'مدير / مشرف',
  TEACHER: 'معلم',
  PARENT: 'ولي أمر',
  STUDENT: 'طالب',
};

export async function loginUser(formData: FormData): Promise<LoginResult> {
  const phone = normalizePhone(formData.get('phone')?.toString() || '');
  const password = formData.get('password')?.toString() || '';
  const targetRole = formData.get('role')?.toString() || '';

  if (!phone) return { success: false, error: 'الرجاء إدخال رقم الهاتف المسجل' };
  if (!password) return { success: false, error: 'الرجاء إدخال كلمة المرور' };

  const gate = await checkLoginRateLimit(phone);
  if (gate.blocked) {
    return {
      success: false,
      error: `تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد ${gate.retryAfterMinutes} دقيقة.`,
    };
  }

  try {
    const user = await queryOne<{
      id: string;
      phone: string;
      password_hash: string;
      role: Role;
      is_active: boolean;
      must_change_password: boolean;
    }>(
      `SELECT id, phone, password_hash, role, is_active,
              COALESCE(must_change_password, FALSE) AS must_change_password
       FROM users
       WHERE phone = $1`,
      [phone]
    );

    // Always run a hash comparison to keep response timing uniform, even when
    // the phone number is unknown (prevents user enumeration by timing).
    const check = user
      ? await queryOne<{ valid: boolean }>(
          `SELECT (password_hash = crypt($2, password_hash)) AS valid
           FROM users WHERE id = $1`,
          [user.id, password]
        )
      : await queryOne<{ valid: boolean }>(
          `SELECT (crypt($1, gen_salt('bf')) = crypt($1, gen_salt('bf'))) AS valid`,
          [password]
        );

    if (!user || !check?.valid) {
      await recordLoginAttempt({
        phone,
        userId: user?.id ?? null,
        success: false,
        reason: user ? 'BAD_PASSWORD' : 'UNKNOWN_PHONE',
      });
      return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' };
    }

    if (!user.is_active) {
      await recordLoginAttempt({
        phone,
        userId: user.id,
        success: false,
        reason: 'INACTIVE',
      });
      return {
        success: false,
        error: 'هذا الحساب غير نشط حالياً. يرجى مراجعة إدارة الجمعية.',
      };
    }

    if (targetRole && user.role !== targetRole) {
      await recordLoginAttempt({
        phone,
        userId: user.id,
        success: false,
        reason: 'ROLE_MISMATCH',
      });
      return {
        success: false,
        error: `هذا الحساب مسجل بصفة (${ROLE_NAMES[user.role] || user.role}). يرجى اختيار التبويب المطابق لصلاحيتك.`,
      };
    }

    let displayName = 'مستخدم النظام';
    let teacherId: string | undefined;
    let parentId: string | undefined;

    if (user.role === 'ADMIN') {
      displayName = 'مدير النظام';
    } else if (user.role === 'TEACHER') {
      const teacher = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM teachers WHERE user_id = $1`,
        [user.id]
      );
      if (!teacher) {
        return { success: false, error: 'لا يوجد ملف معلم مرتبط بهذا الحساب. تواصل مع الإدارة.' };
      }
      displayName = teacher.full_name;
      teacherId = teacher.id;
    } else if (user.role === 'PARENT') {
      const parent = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM parents WHERE user_id = $1`,
        [user.id]
      );
      if (!parent) {
        return { success: false, error: 'لا يوجد ملف ولي أمر مرتبط بهذا الحساب. تواصل مع الإدارة.' };
      }
      displayName = parent.full_name;
      parentId = parent.id;
    }

    const payload: SessionPayload = {
      userId: user.id,
      role: user.role,
      name: displayName,
      phone: user.phone,
      teacherId,
      parentId,
      mustChangePassword: user.must_change_password,
    };

    await setSessionCookie(payload);

    await query(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id]
    );
    await recordLoginAttempt({
      phone,
      userId: user.id,
      success: true,
      reason: 'OK',
    });

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: displayName,
        teacherId,
        parentId,
      },
      redirectTo: user.must_change_password
        ? '/profile?change=1'
        : homeForRole(user.role),
    };
  } catch (error) {
    logger.error('auth.login-failed', { message: errorMessage(error) });
    return {
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً.',
    };
  }
}

export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
  redirect('/?login=true');
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  return readSession();
}

export async function changePassword(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const session = await requireSessionForAction();
    const currentPassword = formData.get('current_password')?.toString() || '';
    const newPassword = formData.get('new_password')?.toString() || '';
    const confirmPassword = formData.get('confirm_password')?.toString() || '';

    if (!currentPassword) return { success: false, error: 'الرجاء إدخال كلمة المرور الحالية' };
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'كلمتا المرور الجديدتان غير متطابقتين' };
    }

    const strength = isValidPassword(newPassword);
    if (!strength.ok) return { success: false, error: strength.error };
    if (newPassword === currentPassword) {
      return { success: false, error: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية' };
    }

    const check = await queryOne<{ valid: boolean }>(
      `SELECT (password_hash = crypt($2, password_hash)) AS valid
       FROM users WHERE id = $1`,
      [session.userId, currentPassword]
    );
    if (!check?.valid) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }

    await query(
      `UPDATE users
       SET password_hash = crypt($2, gen_salt('bf')),
           must_change_password = FALSE,
           updated_at = NOW()
       WHERE id = $1`,
      [session.userId, newPassword]
    );

    // Refresh the cookie so the must-change-password gate is lifted.
    await setSessionCookie({ ...session, mustChangePassword: false });
    logger.info('auth.password-changed', { userId: session.userId });
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  } catch (error) {
    logger.error('auth.password-change-failed', { message: errorMessage(error) });
    return { success: false, error: 'تعذر تغيير كلمة المرور. يرجى المحاولة لاحقاً.' };
  }
}

export async function updateProfile(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const session = await requireSessionForAction();
    const fullName = sanitizeText(formData.get('full_name')?.toString() || '', 100);
    const rawPhone = formData.get('phone')?.toString() || '';
    const phone = normalizePhone(rawPhone);

    if (!isValidName(fullName)) {
      return { success: false, error: 'الاسم يجب أن يكون بين 3 و100 حرف' };
    }
    if (!/^\+?[0-9]{8,20}$/.test(phone)) {
      return { success: false, error: 'رقم الهاتف غير صحيح' };
    }

    const duplicate = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE phone = $1 AND id <> $2`,
      [phone, session.userId]
    );
    if (duplicate) {
      return { success: false, error: 'رقم الهاتف مستخدم بحساب آخر' };
    }

    await query(
      `UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1`,
      [session.userId, phone]
    );

    if (session.role === 'TEACHER' && session.teacherId) {
      await query(`UPDATE teachers SET full_name = $2, phone = $3 WHERE id = $1`, [
        session.teacherId,
        fullName,
        phone,
      ]);
    } else if (session.role === 'PARENT' && session.parentId) {
      await query(`UPDATE parents SET full_name = $2 WHERE id = $1`, [
        session.parentId,
        fullName,
      ]);
    }

    await setSessionCookie({ ...session, name: fullName, phone });
    logger.info('auth.profile-updated', { userId: session.userId });
    return { success: true, message: 'تم حفظ بيانات الملف الشخصي' };
  } catch (error) {
    logger.error('auth.profile-update-failed', { message: errorMessage(error) });
    return { success: false, error: 'تعذر حفظ البيانات. يرجى المحاولة لاحقاً.' };
  }
}
