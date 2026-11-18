import Link from 'next/link';
import { queryOne } from '@/lib/db';
import {
  Building2, BookOpen, GraduationCap, UsersRound,
  TrendingUp, AlertCircle, ArrowUpRight, UserPlus,
  CalendarCheck, Brain, Sparkles, ChevronLeft, RotateCcw, Star,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Totals {
  students: number;
  halaqat: number;
  teachers: number;
  mosques: number;
  new_students: number;
  at_risk: number;
}

interface AttendanceToday {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface Weekly {
  memorization: number;
  revision: number;
  evaluations: number;
  excellent: number;
}

export default async function DashboardPage() {
  const [totals, today, weekly, recentNotes] = await Promise.all([
    queryOne<Totals>(`
      SELECT
        (SELECT COUNT(*)::int FROM students WHERE is_active) AS students,
        (SELECT COUNT(*)::int FROM halaqat WHERE is_active) AS halaqat,
        (SELECT COUNT(*)::int FROM teachers WHERE is_active) AS teachers,
        (SELECT COUNT(*)::int FROM mosques WHERE is_active) AS mosques,
        (SELECT COUNT(*)::int FROM students WHERE created_at > NOW() - INTERVAL '30 days') AS new_students,
        (SELECT COUNT(*)::int FROM (
           SELECT e.id
           FROM student_enrollments e
           LEFT JOIN attendance a ON a.student_enrollment_id = e.id
           GROUP BY e.id
           HAVING COUNT(a.id) > 0
              AND COUNT(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::numeric
                  / NULLIF(COUNT(a.id), 0) < 0.75
        ) risk) AS at_risk
    `),
    queryOne<AttendanceToday>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PRESENT')::int AS present,
        COUNT(*) FILTER (WHERE status = 'ABSENT')::int AS absent,
        COUNT(*) FILTER (WHERE status = 'LATE')::int AS late,
        COUNT(*) FILTER (WHERE status = 'EXCUSED')::int AS excused,
        COUNT(*)::int AS total
      FROM attendance
      WHERE attendance_date = CURRENT_DATE
    `),
    queryOne<Weekly>(`
      SELECT
        (SELECT COUNT(*)::int FROM memorization WHERE recorded_at > NOW() - INTERVAL '7 days') AS memorization,
        (SELECT COUNT(*)::int FROM revision WHERE recorded_at > NOW() - INTERVAL '7 days') AS revision,
        (SELECT COUNT(*)::int FROM evaluations WHERE evaluated_at > NOW() - INTERVAL '30 days') AS evaluations,
        (SELECT COUNT(*)::int FROM evaluations WHERE overall_score >= 90 AND evaluated_at > NOW() - INTERVAL '30 days') AS excellent
    `),
    queryOne<{ count: number }>(`
      SELECT COUNT(*)::int AS count FROM notes WHERE created_at > NOW() - INTERVAL '7 days'
    `),
  ]);

  const attendance = today ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  const attendanceRate =
    attendance.total > 0
      ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100)
      : 0;

  const kpis = [
    {
      label: 'الطلاب المسجلون',
      value: totals?.students ?? 0,
      icon: UsersRound,
      color: 'bg-primary text-white',
      accentBorder: 'hover:border-primary',
      change: `${totals?.new_students ?? 0} خلال 30 يوماً`,
      href: '/students',
      hint: 'عرض كافة الطلاب',
      featured: true,
    },
    {
      label: 'الحلقات النشطة',
      value: totals?.halaqat ?? 0,
      icon: BookOpen,
      color: 'bg-accent text-primary-dark',
      accentBorder: 'hover:border-accent',
      change: 'حلقة قائمة',
      href: '/halaqat',
      hint: 'عرض الحلقات',
    },
    {
      label: 'المعلمون',
      value: totals?.teachers ?? 0,
      icon: GraduationCap,
      color: 'bg-primary-dark text-white',
      accentBorder: 'hover:border-primary-dark',
      change: 'معلم نشط',
      href: '/teachers',
      hint: 'عرض الكادر',
    },
    {
      label: 'إجمالي المساجد',
      value: totals?.mosques ?? 0,
      icon: Building2,
      color: 'bg-emerald-600 text-white',
      accentBorder: 'hover:border-emerald-600',
      change: 'مسجد مسجل',
      href: '/mosques',
      hint: 'عرض المساجد',
    },
  ];

  const quickActions = [
    { label: 'دليل الطلاب والبحث', href: '/students', icon: UsersRound, desc: 'عرض وتصفية الطلاب وسجلاتهم', primary: true },
    { label: 'تسجيل طالب جديد', href: '/students/add', icon: UserPlus, desc: 'إضافة طالب وتعيين الحلقة والمسجد' },
    { label: 'رصد الحضور والغياب', href: '/attendance', icon: CalendarCheck, desc: 'تسجيل ومتابعة حضور اليوم' },
    { label: 'متابعة الحفظ والمراجعة', href: '/memorization', icon: Brain, desc: 'تسجيل التسميع والأجزاء المنجزة' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-charcoal-900 via-charcoal-800 to-charcoal-700 text-beige-50 p-6 md:p-8 rounded-2xl shadow-md border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 start-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-semibold mb-2 backdrop-blur-sm border border-white/10">
              <Sparkles size={14} />
              <span>لوحة التحكم الرئيسية لجمعية خيركم</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">مرحباً بك في لوحة الإدارة</h1>
            <p className="text-beige-200/80 mt-1 text-sm max-w-xl">
              مؤشرات حقيقية ومباشرة من قاعدة البيانات لحضور الطلاب والإنجاز القرآني.
            </p>
          </div>
          <Link
            href="/students/add"
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <UserPlus size={17} />
            <span>+ تسجيل طالب</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`group bg-white p-5 rounded-2xl shadow-sm border border-neutral/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${kpi.accentBorder} ${
                kpi.featured ? 'ring-2 ring-primary/20 bg-gradient-to-b from-white to-primary/5' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${kpi.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <div className="flex items-center gap-1 text-neutral-400 group-hover:text-primary transition-colors text-xs font-medium">
                  <span>{kpi.hint}</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-semibold">{kpi.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-primary-dark" dir="ltr">
                    {kpi.value.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral/30 text-xs">
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp size={12} />
                    {kpi.change}
                  </span>
                  <span className="text-neutral-400 text-[11px]">انقر للدخول</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Navigation Hub */}
      <div className="bg-white rounded-2xl p-5 border border-neutral/40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-primary-dark">روابط الوصول السريع</h2>
            <p className="text-xs text-neutral-500">انتقال سريع لأهم الأقسام والعمليات اليومية</p>
          </div>
          <Link href="/students" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            <span>عرض كل الطلاب</span>
            <ChevronLeft size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 group ${
                  action.primary
                    ? 'border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary shadow-xs'
                    : 'border-neutral/40 hover:border-primary/40 hover:bg-neutral-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  action.primary ? 'bg-primary text-white shadow-sm' : 'bg-neutral-100 text-primary-dark group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <ActionIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary-dark group-hover:text-primary transition-colors block truncate">{action.label}</span>
                    <ArrowUpRight size={13} className="text-neutral-300 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  <span className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{action.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Attendance + Weekly activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/40 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-primary-dark">حضور اليوم</h2>
            <Link href="/attendance" className="text-xs font-semibold text-primary hover:underline">
              تفاصيل الحضور ←
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center h-44 relative my-2">
            <svg viewBox="0 0 36 36" className="w-36 h-36 transform -rotate-90" aria-hidden="true">
              <path className="text-neutral-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-500" strokeDasharray={`${attendanceRate}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-primary-dark" dir="ltr">{attendanceRate}%</span>
              <span className="text-xs text-neutral-500 font-medium mt-0.5">معدل الحضور اليوم</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm pt-4 border-t border-neutral/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs text-neutral-600">حاضر: <strong className="text-primary-dark">{attendance.present}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-xs text-neutral-600">غائب: <strong className="text-primary-dark">{attendance.absent}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-xs text-neutral-600">متأخر: <strong className="text-primary-dark">{attendance.late}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <span className="text-xs text-neutral-600">بعذر: <strong className="text-primary-dark">{attendance.excused}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral/40 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-primary-dark">النشاط القرآني (آخر 7 أيام)</h2>
              <p className="text-xs text-neutral-500">أوراد التسميع والمراجعة المسجلة فعلياً</p>
            </div>
            <Link href="/reports" className="text-xs font-semibold text-primary hover:underline">
              التقارير الكاملة ←
            </Link>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/memorization" className="bg-amber-50/60 hover:bg-amber-50 p-5 rounded-2xl flex flex-col justify-between border border-amber-200/60 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><Brain size={15} /> الحفظ الجديد</span>
                <ArrowUpRight size={15} className="text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-amber-700" dir="ltr">{weekly?.memorization ?? 0}</span>
                <p className="text-xs text-amber-900/80 mt-1">جلسة تسميع مسجلة هذا الأسبوع</p>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold underline">عرض قائمة التسميع</span>
            </Link>

            <Link href="/revision" className="bg-primary/5 hover:bg-primary/10 p-5 rounded-2xl flex flex-col justify-between border border-primary/20 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5"><RotateCcw size={15} /> المراجعة</span>
                <ArrowUpRight size={15} className="text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-primary-dark" dir="ltr">{weekly?.revision ?? 0}</span>
                <p className="text-xs text-primary-dark/80 mt-1">جلسة مراجعة مسجلة هذا الأسبوع</p>
              </div>
              <span className="text-[11px] text-primary font-semibold underline">عرض مسار المراجعة</span>
            </Link>

            <Link href="/students?filter=EXCELLENT" className="bg-emerald-50/60 hover:bg-emerald-50 p-5 rounded-2xl flex flex-col justify-between border border-emerald-200/60 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><Star size={15} /> تقييمات ممتازة</span>
                <ArrowUpRight size={15} className="text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-emerald-700" dir="ltr">{weekly?.excellent ?? 0}</span>
                <p className="text-xs text-emerald-900/80 mt-1">تقييم بدرجة 90 أو أعلى خلال 30 يوماً</p>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold underline">عرض قائمة المتفوقين</span>
            </Link>

            <Link href="/students?filter=URGENT" className="bg-rose-50/70 hover:bg-rose-100/70 p-5 rounded-2xl flex flex-col justify-between border border-rose-200 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-rose-600" /> يحتاجون متابعة
                </span>
                <ArrowUpRight size={15} className="text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-rose-700" dir="ltr">{totals?.at_risk ?? 0}</span>
                <p className="text-xs text-rose-900/80 mt-1">نسبة حضور أقل من 75%</p>
              </div>
              <span className="text-[11px] text-rose-700 font-bold underline">تصفية هؤلاء الطلاب للتواصل</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral/30 text-xs text-neutral-500 flex flex-wrap gap-x-5 gap-y-1">
            <span>التقييمات (30 يوماً): <strong className="text-primary-dark">{weekly?.evaluations ?? 0}</strong></span>
            <span>ملاحظات (7 أيام): <strong className="text-primary-dark">{recentNotes?.count ?? 0}</strong></span>
            <span>سجلات حضور اليوم: <strong className="text-primary-dark">{attendance.total}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
