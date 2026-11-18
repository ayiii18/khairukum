'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarCheck,
  Brain,
  MessageSquare,
  Send,
  LogOut,
  Building2,
  GraduationCap,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { submitParentExcuse } from '@/lib/actions/portal';
import { logoutUser } from '@/lib/actions/auth';
import { errorMessage } from '@/lib/logger';
import { ParentPortalPayload, ParentChildData } from '@/lib/queries/portal';

type ParentTab = 'overview' | 'attendance' | 'memorization' | 'notes' | 'excuse';

const PARENT_TABS: {
  id: ParentTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'overview', label: 'مسيرة الحفظ والإنجاز', icon: Brain },
  { id: 'attendance', label: 'سجل الحضور والغياب', icon: CalendarCheck },
  { id: 'memorization', label: 'سجل التسميع والمراجعة', icon: BookOpen },
  { id: 'notes', label: 'ملاحظات المعلم', icon: MessageSquare },
  { id: 'excuse', label: 'تقديم عذر غياب', icon: Send },
];

export default function ParentPortalClient({ data }: { data: ParentPortalPayload }) {
  const router = useRouter();
  const toast = useToast();

  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ParentTab>('overview');

  // Excuse Form State
  const [excuseDate, setExcuseDate] = useState(new Date().toISOString().slice(0, 10));
  const [excuseReason, setExcuseReason] = useState('');
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);

  const currentChild: ParentChildData | undefined = data.children[selectedChildIndex] || data.children[0];

  const handleExcuseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChild) return;
    if (!excuseReason.trim()) {
      toast.warning('تنبيه', 'يرجى كتابة سبب العذر');
      return;
    }

    setIsSubmittingExcuse(true);
    try {
      const res = await submitParentExcuse({
        student_id: currentChild.student_id,
        date: excuseDate,
        reason: excuseReason.trim(),
      });

      setIsSubmittingExcuse(false);
      if (res.success) {
        toast.success('تم إرسال العذر', 'تم إرسال عذر الغياب إلى معلم الحلقة بنجاح.');
        setExcuseReason('');
        router.refresh();
      } else {
        toast.error('خطأ', res.error || 'تعذر إرسال العذر');
      }
    } catch (err) {
      setIsSubmittingExcuse(false);
      toast.error('خطأ', errorMessage(err));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  if (!currentChild) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] p-8 rounded-3xl max-w-md text-center shadow-xl">
          <AlertCircle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2 text-charcoal-900">لا يوجد أبناء مرتبطين بهذا الحساب</h2>
          <p className="text-sm text-charcoal-600 mb-6 font-medium">يرجى مراجعة إدارة الجمعية لربط بيانات الأبناء برقم هاتفك.</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 font-bold text-sm shadow-sm transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 font-sans selection:bg-accent/30 selection:text-charcoal-900 relative overflow-hidden" dir="rtl">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[170px] pointer-events-none -z-10" />

      {/* 1. Ivory Header */}
      <header className="sticky top-0 z-40 bg-[#FCFBF8]/85 backdrop-blur-2xl border-b border-[#E2DBD0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center shadow-xs font-black">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-charcoal-900">خَيْرُكُم</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-beige-100 text-charcoal-800 border border-beige-300 font-bold">
                  بوابة ولي الأمر
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-medium mt-0.5">
                مرحباً بك: <strong className="text-charcoal-800">{data.parent.full_name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-charcoal-700 hover:text-charcoal-950 hover:bg-beige-100 transition-colors border border-[#E2DBD0]"
            >
              الصفحة الرئيسية
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-beige-100 hover:bg-beige-200 text-charcoal-800 text-xs font-bold transition-all border border-beige-300 flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Child Selector Tabs (If multiple children exist) */}
        {data.children.length > 1 && (
          <div className="bg-[#F4EFE6] border-t border-[#E2DBD0] px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-charcoal-600 ps-2">اختر الابن:</span>
            {data.children.map((child, idx) => (
              <button
                key={child.student_id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedChildIndex === idx
                    ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                    : 'bg-white text-charcoal-700 border border-beige-300 hover:bg-beige-100'
                }`}
              >
                <User size={13} />
                <span>{child.full_name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Child Banner Card */}
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-beige-100 text-primary border border-beige-300 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                {currentChild.full_name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-charcoal-900">{currentChild.full_name}</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-beige-100 text-charcoal-700 border border-beige-300 font-bold">
                    {currentChild.relationship || 'ابن'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-charcoal-600 flex-wrap font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} className="text-primary" />
                    <span>{currentChild.mosque_name}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} className="text-primary" />
                    <span>{currentChild.halaqa_name}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} className="text-primary" />
                    <span>المعلم: {currentChild.teacher_name || 'غير محدد'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Rate Dial */}
            <div className="flex items-center gap-3 bg-beige-50 px-5 py-3.5 rounded-2xl border border-beige-200 shrink-0">
              <div className="text-start">
                <span className="text-[11px] text-charcoal-500 block font-bold">نسبة الانتظام بالحلقة</span>
                <span className="text-2xl font-black text-charcoal-900" dir="ltr">
                  {currentChild.attendance_stats.attendance_rate}%
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-beige-200 text-primary border border-beige-300 flex items-center justify-center font-bold">
                <CalendarCheck size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Portal Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E2DBD0] pb-2 overflow-x-auto">
          {PARENT_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-beige-100'
                }`}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FCFBF8] p-5 rounded-2xl border border-[#E2DBD0] shadow-card">
                <span className="text-xs text-charcoal-500 font-bold block mb-1">أيام الحضور</span>
                <div className="text-3xl font-black text-charcoal-900" dir="ltr">
                  {currentChild.attendance_stats.present_days}
                </div>
                <span className="text-[11px] text-primary font-bold mt-1 block">يوم حضور مسجل</span>
              </div>

              <div className="bg-[#FCFBF8] p-5 rounded-2xl border border-[#E2DBD0] shadow-card">
                <span className="text-xs text-charcoal-500 font-bold block mb-1">مرات الغياب</span>
                <div className="text-3xl font-black text-rose-600" dir="ltr">
                  {currentChild.attendance_stats.absent_days}
                </div>
                <span className="text-[11px] text-rose-600 font-bold mt-1 block">غياب بدون عذر</span>
              </div>

              <div className="bg-[#FCFBF8] p-5 rounded-2xl border border-[#E2DBD0] shadow-card">
                <span className="text-xs text-charcoal-500 font-bold block mb-1">جلسات التسميع الموثقة</span>
                <div className="text-3xl font-black text-charcoal-900" dir="ltr">
                  {currentChild.recent_memorization.length}
                </div>
                <span className="text-[11px] text-primary font-bold mt-1 block">ورد حفظ جديد</span>
              </div>

              <div className="bg-[#FCFBF8] p-5 rounded-2xl border border-[#E2DBD0] shadow-card">
                <span className="text-xs text-charcoal-500 font-bold block mb-1">توجيهات المعلم</span>
                <div className="text-3xl font-black text-charcoal-900" dir="ltr">
                  {currentChild.notes.length}
                </div>
                <span className="text-[11px] text-primary font-bold mt-1 block">ملاحظة ورسالة</span>
              </div>
            </div>

            {/* Last Recitation & Teacher Guidance Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Last Recitation */}
              <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4 border-b border-[#E2DBD0] pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="text-primary" size={20} />
                    <h3 className="font-bold text-base text-charcoal-900">آخر وِرد تم تسميعه</h3>
                  </div>
                  <span className="text-xs text-charcoal-500 font-bold">الحفظ الجديد</span>
                </div>

                {currentChild.recent_memorization.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-beige-50 p-4 rounded-2xl border border-beige-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-black text-charcoal-900">
                          سورة {currentChild.recent_memorization[0].surah}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-beige-200 text-charcoal-800 border border-beige-300 text-xs font-bold">
                          درجة: {currentChild.recent_memorization[0].evaluation || 100}%
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-600 font-medium">
                        من الآية ({currentChild.recent_memorization[0].from_ayah}) إلى الآية ({currentChild.recent_memorization[0].to_ayah})
                      </p>
                      {currentChild.recent_memorization[0].note && (
                        <p className="text-xs text-charcoal-700 bg-white p-2.5 rounded-xl border border-beige-200 mt-3 font-medium">
                          ملاحظة المعلم: {currentChild.recent_memorization[0].note}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-charcoal-500 text-center py-6 font-medium">
                    لم يُرصد تسميع حديث بعد.
                  </p>
                )}
              </div>

              {/* Teacher Contact and Notes */}
              <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4 border-b border-[#E2DBD0] pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="text-primary" size={20} />
                    <h3 className="font-bold text-base text-charcoal-900">معلم الحلقة والتواصل</h3>
                  </div>
                  <span className="text-xs text-charcoal-500 font-bold">الكادر التعليمي</span>
                </div>

                <div className="bg-beige-50 p-4 rounded-2xl border border-beige-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-charcoal-600 font-medium">اسم المعلم:</span>
                    <span className="text-sm font-bold text-charcoal-900">{currentChild.teacher_name || 'الأستاذ خالد العتيبي'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-charcoal-600 font-medium">رقم التواصل:</span>
                    <span className="text-sm font-mono text-primary font-bold" dir="ltr">
                      {currentChild.teacher_phone || '0551111111'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-charcoal-600 font-medium">المسجد والمقر:</span>
                    <span className="text-xs font-bold text-charcoal-900">{currentChild.mosque_name}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('excuse')}
                      className="w-full py-2.5 rounded-xl bg-charcoal-800 text-beige-50 font-bold text-xs hover:bg-charcoal-900 transition-colors shadow-xs"
                    >
                      إرسال رسالة أو عذر غياب للمعلم
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">سجل الحضور والغياب للابن</h3>
                <p className="text-xs text-charcoal-500 font-medium">
                  سجل تفصيلي لجميع الأيام المرصودة في الحلقة
                </p>
              </div>
              <button
                onClick={() => setActiveTab('excuse')}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-beige-50 font-bold text-xs hover:bg-charcoal-900 transition-colors shadow-xs"
              >
                تقديم عذر غياب
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E2DBD0]">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#F4EFE6] text-charcoal-700 font-bold border-b border-[#E2DBD0]">
                  <tr>
                    <th className="p-3.5 text-start">التاريخ</th>
                    <th className="p-3.5 text-start">الحالة</th>
                    <th className="p-3.5 text-start">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DBD0] font-medium">
                  {currentChild.recent_attendance.map((row) => {
                    const statusConfig = {
                      PRESENT: { label: 'حاضر', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                      ABSENT: { label: 'غائب', color: 'bg-rose-50 text-rose-800 border-rose-300' },
                      LATE: { label: 'متأخر', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                      EXCUSED: { label: 'معذور', color: 'bg-beige-100 text-charcoal-700 border-beige-300' },
                    }[row.status] || { label: row.status, color: 'bg-beige-50 text-charcoal-800' };

                    return (
                      <tr key={row.id} className="hover:bg-beige-50/50 transition-colors">
                        <td className="p-3.5 text-charcoal-900 font-mono" dir="ltr">
                          {row.date}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-charcoal-600">
                          {row.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {currentChild.recent_attendance.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-charcoal-400">
                        لا توجد سجلات حضور حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MEMORIZATION */}
        {activeTab === 'memorization' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">سجل التسميع والحفظ والمراجعة</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                رصد دقيق لأوراد التسميع اليومية والدرجات الممنوحة من المحفّظ
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E2DBD0]">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#F4EFE6] text-charcoal-700 font-bold border-b border-[#E2DBD0]">
                  <tr>
                    <th className="p-3.5 text-start">السورة</th>
                    <th className="p-3.5 text-start">نطاق الآيات</th>
                    <th className="p-3.5 text-start">الدرجة</th>
                    <th className="p-3.5 text-start">ملاحظات المعلم</th>
                    <th className="p-3.5 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DBD0] font-medium">
                  {currentChild.recent_memorization.map((m) => (
                    <tr key={m.id} className="hover:bg-beige-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-charcoal-900">سورة {m.surah}</td>
                      <td className="p-3.5 text-charcoal-600">
                        من آية {m.from_ayah} إلى {m.to_ayah}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-beige-100 text-charcoal-800 border border-beige-300 font-bold">
                          {m.evaluation || 100}%
                        </span>
                      </td>
                      <td className="p-3.5 text-charcoal-600">{m.note || 'متقن ولله الحمد'}</td>
                      <td className="p-3.5 text-charcoal-500 font-mono text-[11px]" dir="ltr">
                        {m.recorded_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                  {currentChild.recent_memorization.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-charcoal-400">
                        لا توجد سجلات تسميع مسجلة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TEACHER NOTES */}
        {activeTab === 'notes' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">ملاحظات وتوجيهات المعلم</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                توجيهات تربوية وملاحظات أداء مرسلة خصيصاً لولي الأمر
              </p>
            </div>

            <div className="space-y-3">
              {currentChild.notes.map((n) => (
                <div key={n.id} className="bg-beige-50 p-5 rounded-2xl border border-beige-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-beige-200 text-charcoal-800 border border-beige-300 text-[11px] font-bold">
                      {n.category || 'توجيه تربوي'}
                    </span>
                    <span className="text-[11px] text-charcoal-400 font-mono" dir="ltr">
                      {n.created_at.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-800 font-normal leading-relaxed">{n.content}</p>
                  <p className="text-xs text-primary font-bold mt-2">المعلم: {n.teacher_name}</p>
                </div>
              ))}
              {currentChild.notes.length === 0 && (
                <div className="p-8 text-center text-charcoal-500 bg-beige-50 rounded-2xl border border-beige-200 font-medium">
                  لا توجد ملاحظات مرسلة حتى الآن. الابن يسير بخطة منتظمة.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SUBMIT EXCUSE */}
        {activeTab === 'excuse' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card max-w-2xl mx-auto space-y-5">
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-1">تقديم عذر غياب عن الحلقة</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                إرسال إشعار فوري لمعلم الحلقة بعذر الغياب لتوثيقه في السجل
              </p>
            </div>

            <form onSubmit={handleExcuseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الابن المعني <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={currentChild.full_name}
                  className="w-full h-11 px-3 rounded-xl border border-beige-300 bg-beige-100/60 text-charcoal-900 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  تاريخ الغياب <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={excuseDate}
                  onChange={(e) => setExcuseDate(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-mono focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  سبب الغياب / تفاصيل العذر <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  placeholder="مثال: ظرف صحي طارئ، سفر عائلي، ارتباط دراسي..."
                  required
                  className="w-full p-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm placeholder:text-charcoal-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingExcuse}
                disabled={isSubmittingExcuse}
                className="w-full !h-12 !rounded-xl font-bold !text-sm shadow-xs"
              >
                تأكيد وإرسال العذر للمعلم
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
