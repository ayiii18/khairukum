import { requireRole } from '@/lib/auth/session';
import { getTeacherPortalData } from '@/lib/queries/portal';
import TeacherPortalClient from './TeacherPortalClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TeacherPortalPage() {
  const session = await requireRole('TEACHER');
  const identifier = session.teacherId || session.userId;
  const payload = await getTeacherPortalData(identifier);

  if (!payload) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] p-8 rounded-3xl max-w-md text-center shadow-xl">
          <h2 className="text-xl font-bold mb-2 text-charcoal-900">تعذر العثور على بيانات المعلم</h2>
          <p className="text-sm text-charcoal-600 mb-6 font-medium">يرجى التواصل مع إدارة الجمعية لتكليفك بحلقة.</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 font-bold text-sm shadow-sm transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return <TeacherPortalClient data={payload} />;
}
