'use server';

import { queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
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

export async function loginUser(formData: FormData): Promise<LoginResult> {
  const rawPhone = formData.get('phone')?.toString()?.trim() || '';
  const phone = rawPhone.replace(/\s+/g, '');
  const password = formData.get('password')?.toString() || '';
  const targetRole = formData.get('role')?.toString() || '';

  if (!phone) {
    return { success: false, error: 'الرجاء إدخال رقم الهاتف المسجل' };
  }

  if (!password) {
    return { success: false, error: 'الرجاء إدخال كلمة المرور' };
  }

  try {
    // 1. Fetch user by phone
    const user = await queryOne<{
      id: string;
      phone: string;
      password_hash: string;
      role: string;
      is_active: boolean;
    }>(
      `SELECT id, phone, password_hash, role, is_active FROM users WHERE phone = $1`,
      [phone]
    );

    if (!user) {
      return {
        success: false,
        error: 'رقم الهاتف المدخل غير مسجل في النظام. تأكد من الرقم أو تواصل مع الإدارة.',
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        error: 'هذا الحساب غير نشط حالياً. يرجى مراجعة إدارة الجمعية.',
      };
    }

    // Role check if specific role tab was selected
    if (targetRole && user.role !== targetRole) {
      const roleNames: Record<string, string> = {
        ADMIN: 'مدير / مشرف',
        TEACHER: 'معلم',
        PARENT: 'ولي أمر',
        STUDENT: 'طالب',
      };
      return {
        success: false,
        error: `هذا الحساب مسجل بصفة (${roleNames[user.role] || user.role}). يرجى اختيار التبويب المطابق لصلاحيتك.`,
      };
    }

    // Verify Password (supports pgcrypto crypt hash, plain demo, or default demo password '123456')
    const passCheck = await queryOne<{ valid: boolean }>(
      `SELECT (
        password_hash = crypt($2, password_hash)
        OR password_hash = $2
        OR password_hash = 'default_hash_123'
        OR $2 = '123456'
      ) AS valid FROM users WHERE id = $1`,
      [user.id, password]
    );

    if (!passCheck || !passCheck.valid) {
      return {
        success: false,
        error: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.',
      };
    }

    // Get display name & role-specific IDs
    let displayName = 'مستخدم النظام';
    let teacherId: string | undefined;
    let parentId: string | undefined;
    let redirectTo = '/dashboard';

    if (user.role === 'ADMIN') {
      displayName = 'مدير النظام';
      redirectTo = '/dashboard';
    } else if (user.role === 'TEACHER') {
      const t = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM teachers WHERE user_id = $1`,
        [user.id]
      );
      if (t) {
        displayName = t.full_name;
        teacherId = t.id;
      }
      redirectTo = '/teacher-portal';
    } else if (user.role === 'PARENT') {
      const p = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM parents WHERE user_id = $1`,
        [user.id]
      );
      if (p) {
        displayName = p.full_name;
        parentId = p.id;
      }
      redirectTo = '/parent-portal';
    }

    // Set auth cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(
        'auth_session',
        JSON.stringify({
          userId: user.id,
          role: user.role,
          name: displayName,
          phone: user.phone,
          teacherId,
          parentId,
        }),
        {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
        }
      );
    } catch (cookieErr) {
      console.warn('Failed to set cookie in server action:', cookieErr);
    }

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
      redirectTo,
    };
  } catch (err: any) {
    console.error('Login error:', err);
    return {
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً.',
    };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  redirect('/');
}

export async function getCurrentSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}
