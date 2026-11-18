import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User, Phone, UsersRound } from 'lucide-react';
import { getParentById } from '@/lib/queries/parents';

export const dynamic = 'force-dynamic';

function formatPercent(attended: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((attended / total) * 100)}%`;
}

export default async function ParentProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const parent = await getParentById(resolvedParams.id);

  if (!parent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/parents" className="text-neutral-500 hover:text-primary">
          أولياء الأمور
        </Link>
        <span className="text-neutral-500">/</span>
        <span className="font-semibold text-primary-dark">{parent.full_name}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary-dark">{parent.full_name}</h1>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  parent.is_active
                    ? 'bg-semantic-success/10 text-semantic-success'
                    : 'bg-semantic-error/10 text-semantic-error'
                }`}
              >
                {parent.is_active ? 'نشط' : 'موقوف'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="text-primary" />
                <span dir="ltr">{parent.phone || 'لا يوجد رقم مسجل'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children Table */}
      <div className="bg-white rounded-xl border border-neutral/30 shadow-card overflow-hidden">
        <div className="p-6 border-b border-neutral/30 flex justify-between items-center">
          <h3 className="font-semibold text-primary-dark text-lg flex items-center gap-2">
            <UsersRound size={20} className="text-primary" />
            الأبناء المسجلون ({parent.children.length})
          </h3>
          <Link
            href="/students/add"
            className="text-primary hover:bg-primary/5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            إضافة طالب
          </Link>
        </div>

        {parent.children.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            لا يوجد أبناء مرتبطون بهذا الحساب بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral/30">
                <tr>
                  <th className="px-6 py-4 text-start">اسم الطالب</th>
                  <th className="px-6 py-4 text-start">المسجد</th>
                  <th className="px-6 py-4 text-start">الحلقة / المعلم</th>
                  <th className="px-6 py-4 text-center">الحضور</th>
                  <th className="px-6 py-4 text-start">الحفظ</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {parent.children.map((child) => {
                  const attendanceLabel = formatPercent(
                    child.attendance_attended,
                    child.attendance_total
                  );
                  return (
                    <tr key={child.student_id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-primary-dark">{child.full_name}</div>
                        {child.relationship && (
                          <div className="text-xs text-neutral-500">{child.relationship}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {child.mosque_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-primary-dark font-medium">
                          {child.halaqa_name || 'غير مسجل في حلقة'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          بإشراف: {child.teacher_name || 'لم يُسند معلم'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden"
                            dir="ltr"
                          >
                            <div
                              className="h-full bg-semantic-success"
                              style={{ width: attendanceLabel }}
                            />
                          </div>
                          <span className="text-xs font-bold text-primary-dark">
                            {attendanceLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                          {child.last_surah
                            ? `${child.last_surah} · ${child.memorization_count} تسميع`
                            : 'لا يوجد تسميع'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            child.is_active
                              ? 'bg-semantic-success/10 text-semantic-success'
                              : 'bg-semantic-error/10 text-semantic-error'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              child.is_active ? 'bg-semantic-success' : 'bg-semantic-error'
                            }`}
                          />
                          {child.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
