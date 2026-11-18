import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, MapPin, Phone, Users, UserCheck } from 'lucide-react';
import { getMosqueById } from '@/lib/queries/mosques';
import { getHalaqatByMosque } from '@/lib/queries/halaqat';

export const dynamic = 'force-dynamic';

export default async function MosqueDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const [mosque, halaqat] = await Promise.all([
    getMosqueById(resolvedParams.id),
    getHalaqatByMosque(resolvedParams.id),
  ]);

  if (!mosque) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/mosques" className="text-neutral-500 hover:text-primary">
          المساجد
        </Link>
        <span className="text-neutral-500">/</span>
        <span className="font-semibold text-primary-dark">{mosque.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/mosques"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-neutral/40 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <ArrowRight size={20} className="rtl:-scale-x-100" />
          </Link>
          <h1 className="text-2xl font-bold text-primary-dark">{mosque.name}</h1>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              mosque.is_active
                ? 'bg-semantic-success/10 text-semantic-success'
                : 'bg-semantic-error/10 text-semantic-error'
            }`}
          >
            {mosque.is_active ? 'نشط' : 'غير نشط'}
          </span>
        </div>
        <Link
          href="/halaqat"
          className="text-primary text-sm font-semibold hover:underline"
        >
          إدارة الحلقات
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral/30 shadow-card flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">إجمالي الحلقات</p>
            <p className="text-xl font-bold text-primary-dark">{mosque.halaqat_count}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral/30 shadow-card flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-lg text-accent">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">إجمالي الطلاب</p>
            <p className="text-xl font-bold text-primary-dark">{mosque.students_count}</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-neutral/30 shadow-card h-fit">
          <h3 className="font-semibold text-primary-dark text-lg mb-4 border-b border-neutral/30 pb-4">
            المعلومات الأساسية
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-neutral-500 mb-1 flex items-center gap-1.5">
                <MapPin size={14} /> الموقع
              </p>
              <p className="font-medium text-primary-dark">
                {mosque.address || 'لم يُسجل عنوان'}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 mb-1 flex items-center gap-1.5">
                <Phone size={14} /> رقم التواصل
              </p>
              <p className="font-medium text-primary-dark" dir="ltr">
                {mosque.phone || '—'}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 mb-1">الوصف</p>
              <p className="font-medium text-neutral-600 leading-relaxed">
                {mosque.description || 'لا يوجد وصف مسجل لهذا المسجد.'}
              </p>
            </div>
          </div>
        </div>

        {/* Halaqat List within Mosque */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral/30 shadow-card overflow-hidden">
          <div className="p-6 border-b border-neutral/30 flex justify-between items-center">
            <h3 className="font-semibold text-primary-dark text-lg">
              الحلقات التابعة ({halaqat.length})
            </h3>
            <Link href="/halaqat" className="text-primary text-sm font-medium hover:underline">
              عرض الكل
            </Link>
          </div>

          {halaqat.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">
              لا توجد حلقات مسجلة في هذا المسجد بعد.
            </p>
          ) : (
            <div className="divide-y divide-neutral/50">
              {halaqat.map((halaqa) => (
                <div
                  key={halaqa.id}
                  className="p-4 hover:bg-neutral-50 flex justify-between items-center transition-colors"
                >
                  <div>
                    <p className="font-medium text-primary-dark mb-1">{halaqa.name}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <UserCheck size={12} />
                        {halaqa.primary_teacher_name || 'لم يُسند معلم'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        {halaqa.students_count} طالب
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      halaqa.is_active
                        ? 'bg-semantic-success/10 text-semantic-success'
                        : 'bg-semantic-error/10 text-semantic-error'
                    }`}
                  >
                    {halaqa.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
