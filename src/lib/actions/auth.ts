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
import {
  homeForRole,
  safeNextPath,
  type Role,
  type SessionPayload,
} from '@/lib/auth/token';
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

  let destination = '/dashboard';

  try {
    // One round-trip instead of three sequential ones (user lookup, bcrypt
    // check, linked profile). The CASE keeps timing uniform for unknown phone
    // numbers by burning a dummy hash, so accounts cannot be enumerated.
    const account = await queryOne<{
      id: string;
      phone: string;
      role: Role;
      is_active: boolean;
      must_change_password: boolean;
      valid: boolean;
      teacher_id: string | null;
      teacher_name: string | null;
      parent_id: string | null;
      parent_name: string | null;
    }>(
      `SELECT
         u.id, u.phone, u.role, u.is_active,
         COALESCE(u.must_change_password, FALSE) AS must_change_password,
         CASE
           WHEN u.id IS NULL
             THEN (crypt($2, gen_salt('bf')) = crypt($2, gen_salt('bf')))
           ELSE (u.password_hash = crypt($2, u.password_hash))
         END AS valid,
         t.id AS teacher_id, t.full_name AS teacher_name,
         p.id AS parent_id, p.full_name AS parent_name
       FROM (SELECT 1) AS seed
       LEFT JOIN users u ON u.phone = $1
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN parents p ON p.user_id = u.id`,
      [phone, password]
    );

    if (!account?.id || !account.valid) {
      await recordLoginAttempt({
        phone,
        userId: account?.id ?? null,
        success: false,
        reason: account?.id ? 'BAD_PASSWORD' : 'UNKNOWN_PHONE',
      });
      return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' };
    }

    if (!account.is_active) {
      await recordLoginAttempt({
        phone,
        userId: account.id,
        success: false,
        reason: 'INACTIVE',
      });
      return {
        success: false,
        error: 'هذا الحساب غير نشط حالياً. يرجى مراجعة إدارة الجمعية.',
      };
    }

    if (targetRole && account.role !== targetRole) {
      await recordLoginAttempt({
        phone,
        userId: account.id,
        success: false,
        reason: 'ROLE_MISMATCH',
      });
      return {
        success: false,
        error: `هذا الحساب مسجل بصفة (${ROLE_NAMES[account.role] || account.role}). يرجى اختيار التبويب المطابق لصلاحيتك.`,
      };
    }

    let displayName = 'مستخدم النظام';
    let teacherId: string | undefined;
    let parentId: string | undefined;

    if (account.role === 'ADMIN') {
      displayName = 'مدير النظام';
    } else if (account.role === 'TEACHER') {
      if (!account.teacher_id || !account.teacher_name) {
        return { success: false, error: 'لا يوجد ملف معلم مرتبط بهذا الحساب. تواصل مع الإدارة.' };
      }
      displayName = account.teacher_name;
      teacherId = account.teacher_id;
    } else if (account.role === 'PARENT') {
      if (!account.parent_id || !account.parent_name) {
        return { success: false, error: 'لا يوجد ملف ولي أمر مرتبط بهذا الحساب. تواصل مع الإدارة.' };
      }
      displayName = account.parent_name;
      parentId = account.parent_id;
    }

    const payload: SessionPayload = {
      userId: account.id,
      role: account.role,
      name: displayName,
      phone: account.phone,
      teacherId,
      parentId,
      mustChangePassword: account.must_change_password,
    };

    // Independent writes — run them concurrently so the browser gets the
    // session cookie and the client can navigate as soon as possible.
    await Promise.all([
      setSessionCookie(payload),
      query(
        `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [account.id]
      ),
      recordLoginAttempt({
        phone,
        userId: account.id,
        success: true,
        reason: 'OK',
      }),
    ]);

    // An optional protected destination (e.g. /students/add) wins over the
    // role home, but only after server-side validation.
    const requested = safeNextPath(formData.get('next')?.toString());
    destination = account.must_change_password
      ? '/profile?change=1'
      : (requested ?? homeForRole(account.role));
  } catch (error) {
    logger.error('auth.login-failed', { message: errorMessage(error) });
    return {
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً.',
    };
  }

  // Redirect from the action itself: Next.js streams the destination's RSC
  // payload in the same response, so the router performs a single navigation
  // instead of re-rendering the current route and then navigating again.
  redirect(destination);
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
