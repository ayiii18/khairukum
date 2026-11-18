import { requireRole } from '@/lib/auth/session';
import { getParentPortalData } from '@/lib/queries/portal';
import ParentPortalClient from './ParentPortalClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ParentPortalPage() {
  const session = await requireRole('PARENT');
  const identifier = session.parentId || session.userId;
  const payload = await getParentPortalData(identifier);

  if (!payload) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] p-8 rounded-3xl max-w-md text-center shadow-xl">
          <h2 className="text-xl font-bold mb-2 text-charcoal-900">تعذر العثور على بيانات ولي الأمر</h2>
          <p className="text-sm text-charcoal-600 mb-6 font-medium">يرجى التواصل مع إدارة الجمعية لربط حسابك بأبنائك.</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 font-bold text-sm shadow-sm transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return <ParentPortalClient data={payload} />;
}
