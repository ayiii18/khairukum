'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { User, Phone, CheckCircle, Info, ArrowRight, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function ParentProfilePage() {
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(true);

  // Mock Children Data
  const children = [
    { id: 101, name: 'عبدالله محمد القحطاني', mosque: 'جامع الراجحي', halaqa: 'حلقة الإمام عاصم', teacher: 'أحمد عبدالله', attendance: '95%', progress: '5 أجزاء', status: 'نشط' },
    { id: 102, name: 'سالم محمد القحطاني', mosque: 'جامع الملك فهد', halaqa: 'حلقة ابن كثير', teacher: 'محمد صالح', attendance: '88%', progress: '3 أجزاء', status: 'نشط' },
  ];

  return (
    <>
      <div className="space-y-6">
        
        {/* Mock Flow: Duplicate Parent Warning 
            (Demonstrating the UI for entering an existing phone number during Add/Edit) */}
        {showDuplicateWarning && (
          <div className="bg-semantic-info/10 border border-semantic-info/30 p-4 rounded-xl flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-semantic-info">
              <Info size={24} className="mt-0.5" />
              <div>
                <p className="font-bold text-primary-dark">ولي الأمر مسجّل مسبقاً</p>
                <p className="text-sm text-primary-dark mt-1">رقم الهاتف (0501112233) مسجل باسم "محمد القحطاني". سيتم ربط الطالب بحسابه بدلاً من إنشاء حساب جديد.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="primary" size="sm" onClick={() => setShowDuplicateWarning(false)}>ربط الحساب</Button>
            </div>
          </div>
        )}

        {/* Top Bar / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-neutral-500 hover:text-primary">المستخدمون</Link>
          <span className="text-neutral-500">/</span>
          <Link href="/parents" className="text-neutral-500 hover:text-primary">أولياء الأمور</Link>
          <span className="text-neutral-500">/</span>
          <span className="font-semibold text-primary-dark">محمد القحطاني</span>
        </div>

        {/* Profile Header */}
        <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-primary-dark">محمد القحطاني</h1>
                <span className="bg-semantic-success/10 text-semantic-success px-2.5 py-1 rounded-full text-xs font-medium">نشط</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-primary" />
                  <span dir="ltr">+966 50 111 2233</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none">تعديل البيانات</Button>
            <Button variant="outline" className="flex-1 md:flex-none">إدارة الصلاحيات</Button>
          </div>
        </div>

        {/* Children Table */}
        <div className="bg-white rounded-xl border border-neutral/30 shadow-card overflow-hidden">
          <div className="p-6 border-b border-neutral/30 flex justify-between items-center">
            <h3 className="font-semibold text-primary-dark text-lg">الأبناء المسجلون (2)</h3>
            <Button variant="ghost" className="text-primary hover:bg-primary/5 text-sm gap-2">
              <UserPlus size={18} />
              <span>إضافة طالب</span>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral/30">
                <tr>
                  <th className="px-6 py-4 text-start">اسم الطالب</th>
                  <th className="px-6 py-4 text-start">المسجد</th>
                  <th className="px-6 py-4 text-start">الحلقة / المعلم</th>
                  <th className="px-6 py-4 text-center">الحضور</th>
                  <th className="px-6 py-4 text-start">التقدم (الحفظ)</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {children.map((child) => (
                  <tr key={child.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary-dark">{child.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{child.mosque}</td>
                    <td className="px-6 py-4">
                      <div className="text-primary-dark font-medium">{child.halaqa}</div>
                      <div className="text-xs text-neutral-500">بإشراف: {child.teacher}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden" dir="ltr">
                          <div className="h-full bg-semantic-success" style={{ width: child.attendance }}></div>
                        </div>
                        <span className="text-xs font-bold text-primary-dark">{child.attendance}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">{child.progress}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-semantic-success/10 text-semantic-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-semantic-success"></span> {child.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
