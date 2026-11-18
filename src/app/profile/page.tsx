import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db';
import { homeForRole } from '@/lib/auth/token';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ change?: string }>;
}) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};

  const user = await queryOne<{
    phone: string;
    role: string;
    created_at: string;
    last_login_at: string | null;
  }>(
    `SELECT phone, role::text AS role, created_at::text AS created_at,
            last_login_at::text AS last_login_at
     FROM users WHERE id = $1`,
    [session.userId]
  );

  return (
    <div className="min-h-screen bg-[#F7F4EE] py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">الملف الشخصي</h1>
            <p className="text-sm text-neutral-500 mt-1">إدارة حسابك الشخصي وإعدادات الأمان</p>
          </div>
          <Link
            href={homeForRole(session.role)}
            className="px-4 py-2 rounded-xl bg-white border border-neutral/50 text-charcoal-800 text-sm font-bold hover:bg-beige-50 transition-colors"
          >
            العودة للوحة الرئيسية
          </Link>
        </div>

        {params.change === '1' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
            يجب تغيير كلمة المرور المؤقتة قبل استخدام النظام.
          </div>
        )}

        <ProfileClient
          session={{
            name: session.name,
            phone: user?.phone ?? session.phone,
            role: session.role,
            mustChangePassword: Boolean(session.mustChangePassword),
            lastLoginAt: user?.last_login_at ?? null,
            createdAt: user?.created_at ?? null,
          }}
        />
      </div>
    </div>
  );
}
