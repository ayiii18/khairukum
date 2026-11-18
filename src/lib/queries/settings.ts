import 'server-only';
import { query } from '@/lib/db';

export interface AppSettings {
  organization: {
    name: string;
    email: string;
    phone: string;
  };
  notifications: {
    absenceAlerts: boolean;
    weeklyReport: boolean;
    newStudentAlert: boolean;
  };
  students: {
    defaultEnrollmentStatus: string;
    requireParentPhone: boolean;
  };
  security: {
    sessionDays: number;
    maxLoginAttempts: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  organization: {
    name: 'جمعية خيركم لتحفيظ القرآن الكريم',
    email: 'info@khairukum.sa',
    phone: '0112345678',
  },
  notifications: {
    absenceAlerts: true,
    weeklyReport: true,
    newStudentAlert: false,
  },
  students: {
    defaultEnrollmentStatus: 'ACTIVE',
    requireParentPhone: true,
  },
  security: {
    sessionDays: 7,
    maxLoginAttempts: 8,
  },
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await query<{ key: keyof AppSettings; value: unknown }>(
    `SELECT key, value FROM app_settings`
  );

  const merged = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows) {
    if (row.key in merged && row.value && typeof row.value === 'object') {
      // Shallow-merge each section so newly added keys keep their defaults.
      Object.assign(merged[row.key], row.value as object);
    }
  }
  return merged;
}
