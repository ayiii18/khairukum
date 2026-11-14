'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Users,
  CalendarCheck,
  Brain,
  MessageSquare,
  Send,
  LogOut,
  Building2,
  GraduationCap,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle,
  Sparkles,
  Check,
  X,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { recordTeacherAttendance, recordTeacherMemorization, sendTeacherNoteToParent } from '@/lib/actions/portal';
import { logoutUser } from '@/lib/actions/auth';
import { TeacherPortalPayload, TeacherPortalHalaqa } from '@/lib/queries/portal';

export default function TeacherPortalClient({ data }: { data: TeacherPortalPayload }) {
  const router = useRouter();
  const toast = useToast();

  const [selectedHalaqaIndex, setSelectedHalaqaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'attendance' | 'memorization' | 'students' | 'notes'>('attendance');

  const currentHalaqa: TeacherPortalHalaqa | undefined = data.halaqat[selectedHalaqaIndex] || data.halaqat[0];

  // Attendance Form State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note: string }>>(() => {
    const initial: Record<string, any> = {};
    currentHalaqa?.students.forEach((st) => {
      initial[st.enrollment_id] = {
        status: st.today_attendance.status || 'PRESENT',
        note: st.today_attendance.note || '',
      };
    });
    return initial;
  });
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Memorization Form State
  const [memoStudentId, setMemoStudentId] = useState(currentHalaqa?.students[0]?.enrollment_id || '');
  const [surahName, setSurahName] = useState('النبأ');
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(20);
  const [evaluationScore, setEvaluationScore] = useState(95);
  const [memoNote, setMemoNote] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // Note to Parent Form State
  const [noteStudentId, setNoteStudentId] = useState(currentHalaqa?.students[0]?.student_id || '');
  const [noteCategory, setNoteCategory] = useState<'EDUCATIONAL' | 'BEHAVIORAL' | 'FOLLOW_UP' | 'ADMINISTRATIVE'>('EDUCATIONAL');
  const [noteContent, setNoteContent] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);

  const setStudentStatus = (enrollmentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceState((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || { note: '' }),
        status,
      },
    }));
  };

  const handleSaveAllAttendance = async () => {
    if (!currentHalaqa) return;
    setIsSavingAttendance(true);

    try {
      const records = Object.entries(attendanceState).map(([enrollment_id, state]) => ({
        student_enrollment_id: enrollment_id,
        date: attendanceDate,
        status: state.status,
        note: state.note || undefined,
      }));

      const res = await recordTeacherAttendance({
        halaqa_id: currentHalaqa.id,
        date: attendanceDate,
        records,
      });

      setIsSavingAttendance(false);
      if (res.success) {
        toast.success('تم حفظ التحضير', `تم تسجيل حضور طلاب حلقة ${currentHalaqa.name} بنجاح.`);
        router.refresh();
      } else {
        toast.error('خطأ', res.error || 'تعذر حفظ التحضير');
      }
    } catch (err: any) {
      setIsSavingAttendance(false);
      toast.error('خطأ', err.message);
    }
  };

  const handleSaveMemorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoStudentId) {
      toast.warning('تنبيه', 'يرجى اختيار الطالب');
      return;
    }
    if (!surahName.trim()) {
      toast.warning('تنبيه', 'يرجى كتابة اسم السورة');
      return;
    }

    setIsSavingMemo(true);
    try {
      const res = await recordTeacherMemorization({
        student_enrollment_id: memoStudentId,
        surah: surahName.trim(),
        from_ayah: Number(fromAyah),
        to_ayah: Number(toAyah),
        evaluation: Number(evaluationScore),
        note: memoNote.trim() || undefined,
      });

      setIsSavingMemo(false);
      if (res.success) {
        toast.success('تم رصد التسميع', `تم تسجيل تسميع سورة ${surahName} بنجاح وظهرت في حساب ولي الأمر.`);
        setMemoNote('');
        router.refresh();
      } else {
        toast.error('خطأ', res.error || 'تعذر حفظ التسميع');
      }
    } catch (err: any) {
      setIsSavingMemo(false);
      toast.error('خطأ', err.message);
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteStudentId) {
      toast.warning('تنبيه', 'يرجى اختيار الطالب');
      return;
    }
    if (!noteContent.trim()) {
      toast.warning('تنبيه', 'يرجى كتابة نص الملاحظة');
      return;
    }

    setIsSendingNote(true);
    try {
      const res = await sendTeacherNoteToParent({
        student_id: noteStudentId,
        teacher_id: data.teacher.id,
        category: noteCategory,
        content: noteContent.trim(),
      });

      setIsSendingNote(false);
      if (res.success) {
        toast.success('تم إرسال الملاحظة', 'تم إرسال الرسالة إلى ولي أمر الطالب بنجاح.');
        setNoteContent('');
        router.refresh();
      } else {
        toast.error('خطأ', res.error || 'تعذر إرسال الملاحظة');
      }
    } catch (err: any) {
      setIsSendingNote(false);
      toast.error('خطأ', err.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  if (!currentHalaqa) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-charcoal-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] p-8 rounded-3xl max-w-md text-center shadow-xl">
          <AlertCircle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2 text-charcoal-900">لا توجد حلقات مسندة لهذا المعلم</h2>
          <p className="text-sm text-charcoal-600 mb-6 font-medium">يرجى مراجعة إدارة الجمعية لإسناد حلقة إلى حسابك.</p>
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
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-charcoal-900">خَيْرُكُم</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-beige-100 text-charcoal-800 border border-beige-300 font-bold">
                  بوابة الكادر التعليمي
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-medium mt-0.5">
                مرحباً بك: <strong className="text-charcoal-800">{data.teacher.full_name}</strong>
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

        {/* Halaqat Switcher Bar */}
        <div className="bg-[#F4EFE6] border-t border-[#E2DBD0] px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-charcoal-600 ps-2">حلقاتي المسندة:</span>
          {data.halaqat.map((h, idx) => (
            <button
              key={h.id}
              onClick={() => setSelectedHalaqaIndex(idx)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                selectedHalaqaIndex === idx
                  ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                  : 'bg-white text-charcoal-700 border border-beige-300 hover:bg-beige-100'
              }`}
            >
              <BookOpen size={13} />
              <span>{h.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-beige-200 text-charcoal-800">
                {h.student_count} طالب
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Active Halaqa Summary Card */}
        <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-beige-100 text-primary border border-beige-300 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                <BookOpen size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-charcoal-900">{currentHalaqa.name}</h1>
                  {currentHalaqa.is_primary && (
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-beige-100 text-charcoal-700 border border-beige-300 font-bold">
                      حلقة أساسية
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-charcoal-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} className="text-primary" />
                    <span>المسجد: {currentHalaqa.mosque_name}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-primary" />
                    <span>عدد الطلاب المقيدين: {currentHalaqa.student_count}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'attendance'
                    ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                    : 'bg-white text-charcoal-700 hover:bg-beige-100 border border-beige-300'
                }`}
              >
                التحضير اليومي
              </button>
              <button
                onClick={() => setActiveTab('memorization')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'memorization'
                    ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                    : 'bg-white text-charcoal-700 hover:bg-beige-100 border border-beige-300'
                }`}
              >
                رصد التسميع
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E2DBD0] pb-2 overflow-x-auto">
          {[
            { id: 'attendance', label: 'التحضير السريع للطلاب', icon: CalendarCheck },
            { id: 'memorization', label: 'رصد الحفظ والمراجعة', icon: Brain },
            { id: 'students', label: 'قائمة طلاب الحلقة وأولياء الأمور', icon: Users },
            { id: 'notes', label: 'إرسال ملاحظة لولي الأمر', icon: MessageSquare },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        {/* TAB 1: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">تحضير طلاب الحلقة</h3>
                <p className="text-xs text-charcoal-500 font-medium">
                  حدد حالة حضور كل طالب بنقرة زر ثم اضغط حفظ لتحديث السجل
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  dir="ltr"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-xs font-mono focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
                <Button
                  variant="primary"
                  onClick={handleSaveAllAttendance}
                  isLoading={isSavingAttendance}
                  disabled={isSavingAttendance}
                  className="!h-10 !px-5 !rounded-xl font-bold !text-xs shadow-xs"
                >
                  حفظ سجل التحضير
                </Button>
              </div>
            </div>

            {/* Students Attendance List */}
            <div className="space-y-3">
              {currentHalaqa.students.map((st, i) => {
                const currentStatus = attendanceState[st.enrollment_id]?.status || 'PRESENT';

                return (
                  <div
                    key={st.enrollment_id}
                    className="bg-beige-50/70 p-4 rounded-2xl border border-beige-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-beige-200 text-charcoal-800 flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-charcoal-900">{st.full_name}</h4>
                        <span className="text-xs text-charcoal-500 font-medium">
                          ولي الأمر: {st.parent_name || 'غير مسجل'}
                        </span>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(st.enrollment_id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-white text-charcoal-600 border border-beige-300 hover:bg-beige-100'
                        }`}
                      >
                        ✓ حاضر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentStatus(st.enrollment_id, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'bg-white text-charcoal-600 border border-beige-300 hover:bg-beige-100'
                        }`}
                      >
                        ✕ غائب
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentStatus(st.enrollment_id, 'LATE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-600 text-white font-bold shadow-xs'
                            : 'bg-white text-charcoal-600 border border-beige-300 hover:bg-beige-100'
                        }`}
                      >
                        ⏳ متأخر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentStatus(st.enrollment_id, 'EXCUSED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          currentStatus === 'EXCUSED'
                            ? 'bg-charcoal-700 text-white font-bold shadow-xs'
                            : 'bg-white text-charcoal-600 border border-beige-300 hover:bg-beige-100'
                        }`}
                      >
                        📝 معذور
                      </button>
                    </div>
                  </div>
                );
              })}

              {currentHalaqa.students.length === 0 && (
                <div className="p-8 text-center text-charcoal-500 bg-beige-50 rounded-2xl border border-beige-200 font-medium">
                  لا يوجد طلاب مسكنين في هذه الحلقة حالياً.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMORIZATION */}
        {activeTab === 'memorization' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card max-w-2xl mx-auto space-y-5">
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-1">رصد الحفظ والمراجعة اليومية</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                تسجيل السورة والآيات والدرجة لتظهر في سجل الطالب وبوابة ولي أمره
              </p>
            </div>

            <form onSubmit={handleSaveMemorization} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الطالب <span className="text-rose-600">*</span>
                </label>
                <select
                  value={memoStudentId}
                  onChange={(e) => setMemoStudentId(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-bold focus:border-accent focus:ring-1 focus:ring-accent/20"
                >
                  {currentHalaqa.students.map((st) => (
                    <option key={st.enrollment_id} value={st.enrollment_id}>
                      {st.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  اسم السورة <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={surahName}
                  onChange={(e) => setSurahName(e.target.value)}
                  placeholder="مثال: البقرة، النبأ، النازعات..."
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    من الآية <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fromAyah}
                    onChange={(e) => setFromAyah(Number(e.target.value))}
                    required
                    className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-mono text-center focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    إلى الآية <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={fromAyah}
                    value={toAyah}
                    onChange={(e) => setToAyah(Number(e.target.value))}
                    required
                    className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-mono text-center focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  درجة الإتقان والتجويد (من 100) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={evaluationScore}
                  onChange={(e) => setEvaluationScore(Number(e.target.value))}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-mono text-center font-bold focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  ملاحظة المحفّظ / التوجيه التربوي (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={memoNote}
                  onChange={(e) => setMemoNote(e.target.value)}
                  placeholder="مثال: أحسنت، يرجى التركيز على الغنة ومخارج الحروف..."
                  className="w-full p-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingMemo}
                disabled={isSavingMemo}
                className="w-full !h-12 !rounded-xl font-bold !text-sm shadow-xs"
              >
                تأكيد ورصد التسميع
              </Button>
            </form>
          </div>
        )}

        {/* TAB 3: STUDENTS DIRECTORY */}
        {activeTab === 'students' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">طلاب {currentHalaqa.name}</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                بيانات التواصل مع أولياء الأمور وآخر حفظ مسجل
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E2DBD0]">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#F4EFE6] text-charcoal-700 font-bold border-b border-[#E2DBD0]">
                  <tr>
                    <th className="p-3.5 text-start">اسم الطالب</th>
                    <th className="p-3.5 text-start">ولي الأمر</th>
                    <th className="p-3.5 text-start">هاتف التواصل</th>
                    <th className="p-3.5 text-start">آخر تسميع</th>
                    <th className="p-3.5 text-start">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DBD0] font-medium">
                  {currentHalaqa.students.map((st) => (
                    <tr key={st.enrollment_id} className="hover:bg-beige-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-charcoal-900">{st.full_name}</td>
                      <td className="p-3.5 text-charcoal-700">{st.parent_name || 'غير محدد'}</td>
                      <td className="p-3.5 font-mono text-primary font-bold" dir="ltr">
                        {st.parent_phone || st.phone || '—'}
                      </td>
                      <td className="p-3.5 text-charcoal-600">
                        {st.last_memorization
                          ? `سورة ${st.last_memorization.surah} (${st.last_memorization.evaluation}%)`
                          : 'لم يرصد بعد'}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setNoteStudentId(st.student_id);
                            setActiveTab('notes');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-beige-100 hover:bg-beige-200 text-charcoal-800 text-xs font-bold transition-colors border border-beige-300"
                        >
                          إرسال ملاحظة
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentHalaqa.students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-charcoal-400">
                        لا يوجد طلاب في هذه الحلقة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SEND NOTE TO PARENT */}
        {activeTab === 'notes' && (
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl p-6 shadow-card max-w-2xl mx-auto space-y-5">
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-1">إرسال ملاحظة لولي الأمر</h3>
              <p className="text-xs text-charcoal-500 font-medium">
                تصل هذه الرسالة مباشرة إلى بوابة ولي أمر الطالب المحدد
              </p>
            </div>

            <form onSubmit={handleSendNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الطالب <span className="text-rose-600">*</span>
                </label>
                <select
                  value={noteStudentId}
                  onChange={(e) => setNoteStudentId(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm font-bold focus:border-accent focus:ring-1 focus:ring-accent/20"
                >
                  {currentHalaqa.students.map((st) => (
                    <option key={st.student_id} value={st.student_id}>
                      {st.full_name} (ولي الأمر: {st.parent_name || 'غير محدد'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  نوع الملاحظة <span className="text-rose-600">*</span>
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20"
                >
                  <option value="EDUCATIONAL">توجيه تعليمي وإتقان تلاوة</option>
                  <option value="BEHAVIORAL">توجيه سلوكي وتربوي</option>
                  <option value="FOLLOW_UP">متابعة ومواظبة على الورد</option>
                  <option value="ADMINISTRATIVE">إشعار إداري / عام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  نص الملاحظة <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="اكتب التوجيه أو الملاحظة التي تريد إيصالها لولي الأمر..."
                  required
                  className="w-full p-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 text-sm placeholder:text-charcoal-400 focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSendingNote}
                disabled={isSendingNote}
                className="w-full !h-12 !rounded-xl font-bold !text-sm shadow-xs"
              >
                إرسال الملاحظة لولي الأمر
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
