'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';
import { logger, errorMessage } from '@/lib/logger';

export async function updateSettings(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const session = await requireAdmin();

  const organization = {
    name: formData.get('organization_name')?.toString()?.trim() || '',
    email: formData.get('organization_email')?.toString()?.trim() || '',
    phone: formData.get('organization_phone')?.toString()?.trim() || '',
  };
  const notifications = {
    absenceAlerts: formData.get('absenceAlerts') === 'on',
    weeklyReport: formData.get('weeklyReport') === 'on',
    newStudentAlert: formData.get('newStudentAlert') === 'on',
  };
  const students = {
    defaultEnrollmentStatus:
      formData.get('defaultEnrollmentStatus')?.toString() || 'ACTIVE',
    requireParentPhone: formData.get('requireParentPhone') === 'on',
  };
  const security = {
    sessionDays: Math.min(30, Math.max(1, Number(formData.get('sessionDays')) || 7)),
    maxLoginAttempts: Math.min(20, Math.max(3, Number(formData.get('maxLoginAttempts')) || 8)),
  };

  if (organization.name.length < 3) {
    return { success: false, error: 'اسم الجمعية مطلوب' };
  }
  if (organization.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organization.email)) {
    return { success: false, error: 'البريد الإلكتروني غير صحيح' };
  }

  try {
    const entries: [string, object][] = [
      ['organization', organization],
      ['notifications', notifications],
      ['students', students],
      ['security', security],
    ];

    for (const [key, value] of entries) {
      await query(
        `INSERT INTO app_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [key, JSON.stringify(value), session.userId]
      );
    }

    revalidatePath('/settings');
    return { success: true, message: 'تم حفظ الإعدادات بنجاح' };
  } catch (error) {
    logger.error('settings.update-failed', { message: errorMessage(error) });
    return { success: false, error: 'تعذر حفظ الإعدادات. يرجى المحاولة لاحقاً.' };
  }
}
