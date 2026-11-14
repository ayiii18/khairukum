import { cookies } from 'next/headers';
import { getParentPortalData } from '@/lib/queries/portal';
import ParentPortalClient from './ParentPortalClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ParentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ parent_id?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  let identifier = params.parent_id;

  if (!identifier && sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      identifier = parsed.parentId || parsed.userId || parsed.phone;
    } catch {
      // ignore
    }
  }

  // Fallback to default demo parent if no session yet
  if (!identifier) {
    identifier = '0500000004';
  }

  const payload = await getParentPortalData(identifier);

  if (!payload) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] p-8 rounded-3xl max-w-md text-center shadow-xl">
          <h2 className="text-xl font-bold mb-2 text-charcoal-900">تعذر العثور على بيانات ولي الأمر</h2>
          <p className="text-sm text-charcoal-600 mb-6 font-medium">يرجى تسجيل الدخول عبر البوابة الرسمية.</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 font-bold text-sm shadow-sm transition-all">
            العودة للرئيسية وتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return <ParentPortalClient data={payload} />;
}
