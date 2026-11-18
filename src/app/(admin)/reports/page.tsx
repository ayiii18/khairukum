import { query, queryOne } from '@/lib/db';
import { BarChart3, CalendarCheck, Users, BookOpen, TrendingUp, Building2 } from 'lucide-react';
import ReportActions from './ReportActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ start?: string; end?: string; mosque?: string }>;
}

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const start = /^\d{4}-\d{2}-\d{2}$/.test(params.start || '') ? params.start! : firstOfMonth();
  const end = /^\d{4}-\d{2}-\d{2}$/.test(params.end || '') ? params.end! : today();
  const mosqueId = params.mosque || '';

  const [attendance, byMosque, progress, topStudents, mosques] = await Promise.all([
    queryOne<{
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE a.status = 'PRESENT')::int AS present,
         COUNT(*) FILTER (WHERE a.status = 'ABSENT')::int AS absent,
         COUNT(*) FILTER (WHERE a.status = 'LATE')::int AS late,
         COUNT(*) FILTER (WHERE a.status = 'EXCUSED')::int AS excused
       FROM attendance a
       JOIN student_enrollments e ON e.id = a.student_enrollment_id
       JOIN halaqat h ON h.id = e.halaqa_id
       WHERE a.attendance_date BETWEEN $1 AND $2
         AND ($3 = '' OR h.mosque_id::text = $3)`,
      [start, end, mosqueId]
    ),
    query<{
      mosque_name: string;
      total: number;
      present: number;
      rate: number;
    }>(
      `SELECT
         m.name AS mosque_name,
         COUNT(a.id)::int AS total,
         COUNT(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::int AS present,
         COALESCE(ROUND(
           COUNT(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::numeric * 100
           / NULLIF(COUNT(a.id), 0), 1), 0)::float AS rate
       FROM mosques m
       LEFT JOIN halaqat h ON h.mosque_id = m.id
       LEFT JOIN student_enrollments e ON e.halaqa_id = h.id
       LEFT JOIN attendance a ON a.student_enrollment_id = e.id
         AND a.attendance_date BETWEEN $1 AND $2
       WHERE ($3 = '' OR m.id::text = $3)
       GROUP BY m.id, m.name
       ORDER BY rate DESC, m.name`,
      [start, end, mosqueId]
    ),
    queryOne<{
      memorization: number;
      revision: number;
      evaluations: number;
      avg_score: number | null;
    }>(
      `SELECT
        (SELECT COUNT(*)::int FROM memorization mm
          JOIN student_enrollments e ON e.id = mm.student_enrollment_id
          JOIN halaqat h ON h.id = e.halaqa_id
          WHERE mm.recorded_at::date BETWEEN $1 AND $2 AND ($3 = '' OR h.mosque_id::text = $3)) AS memorization,
        (SELECT COUNT(*)::int FROM revision rr
          JOIN student_enrollments e ON e.id = rr.student_enrollment_id
          JOIN halaqat h ON h.id = e.halaqa_id
          WHERE rr.recorded_at::date BETWEEN $1 AND $2 AND ($3 = '' OR h.mosque_id::text = $3)) AS revision,
        (SELECT COUNT(*)::int FROM evaluations ev
          JOIN student_enrollments e ON e.id = ev.student_enrollment_id
          JOIN halaqat h ON h.id = e.halaqa_id
          WHERE ev.evaluated_at::date BETWEEN $1 AND $2 AND ($3 = '' OR h.mosque_id::text = $3)) AS evaluations,
        (SELECT ROUND(AVG(ev.overall_score), 1)::float FROM evaluations ev
          JOIN student_enrollments e ON e.id = ev.student_enrollment_id
          JOIN halaqat h ON h.id = e.halaqa_id
          WHERE ev.evaluated_at::date BETWEEN $1 AND $2 AND ($3 = '' OR h.mosque_id::text = $3)) AS avg_score`,
      [start, end, mosqueId]
    ),
    query<{
      full_name: string;
      halaqa_name: string;
      mosque_name: string;
      avg_score: number;
      sessions: number;
    }>(
      `SELECT s.full_name, h.name AS halaqa_name, m.name AS mosque_name,
              ROUND(AVG(ev.overall_score), 1)::float AS avg_score,
              COUNT(ev.id)::int AS sessions
       FROM evaluations ev
       JOIN student_enrollments e ON e.id = ev.student_enrollment_id
       JOIN students s ON s.id = e.student_id
       JOIN halaqat h ON h.id = e.halaqa_id
       JOIN mosques m ON m.id = h.mosque_id
       WHERE ev.evaluated_at::date BETWEEN $1 AND $2
         AND ($3 = '' OR h.mosque_id::text = $3)
       GROUP BY s.id, s.full_name, h.name, m.name
       ORDER BY avg_score DESC
       LIMIT 10`,
      [start, end, mosqueId]
    ),
    query<{ id: string; name: string }>(
      `SELECT id, name FROM mosques WHERE is_active ORDER BY name`
    ),
  ]);

  const total = attendance?.total ?? 0;
  const rate = total > 0 ? Math.round((((attendance?.present ?? 0) + (attendance?.late ?? 0)) / total) * 100) : 0;

  const kpis = [
    { label: 'سجلات الحضور', value: total, icon: CalendarCheck, hint: `${start} — ${end}` },
    { label: 'نسبة الحضور', value: `${rate}%`, icon: TrendingUp, hint: 'حاضر + متأخر' },
    { label: 'جلسات التسميع', value: progress?.memorization ?? 0, icon: BookOpen, hint: 'خلال الفترة' },
    { label: 'متوسط التقييم', value: progress?.avg_score ?? '—', icon: BarChart3, hint: `${progress?.evaluations ?? 0} تقييم` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
            <BarChart3 className="text-primary" size={28} />
            التقارير والإحصائيات
          </h1>
          <p className="text-sm text-neutral-500 mt-1">تقارير حقيقية من قاعدة البيانات حسب الفترة والمسجد</p>
        </div>
        <ReportActions start={start} end={end} />
      </div>

      <form className="bg-white rounded-2xl p-4 border border-neutral/40 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="start" className="block text-xs font-bold text-neutral-600 mb-1">من تاريخ</label>
          <input id="start" name="start" type="date" defaultValue={start} className="w-full h-10 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
        </div>
        <div>
          <label htmlFor="end" className="block text-xs font-bold text-neutral-600 mb-1">إلى تاريخ</label>
          <input id="end" name="end" type="date" defaultValue={end} className="w-full h-10 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
        </div>
        <div>
          <label htmlFor="mosque" className="block text-xs font-bold text-neutral-600 mb-1">المسجد</label>
          <select id="mosque" name="mosque" defaultValue={mosqueId} className="w-full h-10 px-3 rounded-xl border border-neutral/50 bg-white text-sm">
            <option value="">كل المساجد</option>
            {mosques.map((mosque) => (
              <option key={mosque.id} value={mosque.id}>{mosque.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-10 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors">
          تطبيق التصفية
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white p-5 rounded-2xl border border-neutral/40 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-500">{kpi.label}</span>
                <div className="w-9 h-9 rounded-lg bg-beige-100 text-primary flex items-center justify-center">
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-primary-dark" dir="ltr">{kpi.value}</div>
              <p className="text-[11px] text-neutral-400 mt-1">{kpi.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm">
          <h2 className="text-base font-bold text-primary-dark mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> الحضور حسب المسجد
          </h2>
          <div className="space-y-3">
            {byMosque.length === 0 && <p className="text-sm text-neutral-500">لا توجد بيانات.</p>}
            {byMosque.map((row) => (
              <div key={row.mosque_name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-charcoal-800">{row.mosque_name}</span>
                  <span className="text-neutral-500">{row.rate}% ({row.present}/{row.total})</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, row.rate)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm">
          <h2 className="text-base font-bold text-primary-dark mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" /> أفضل الطلاب تقييماً
          </h2>
          {topStudents.length === 0 ? (
            <p className="text-sm text-neutral-500">لا توجد تقييمات في هذه الفترة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-neutral-500 border-b border-neutral/40">
                  <tr>
                    <th className="text-start py-2 font-semibold">الطالب</th>
                    <th className="text-start py-2 font-semibold">الحلقة</th>
                    <th className="text-center py-2 font-semibold">المتوسط</th>
                    <th className="text-center py-2 font-semibold">الجلسات</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student) => (
                    <tr key={`${student.full_name}-${student.halaqa_name}`} className="border-b border-neutral/20 last:border-0">
                      <td className="py-2 font-semibold text-charcoal-800">{student.full_name}</td>
                      <td className="py-2 text-neutral-600">{student.halaqa_name}</td>
                      <td className="py-2 text-center font-bold text-primary" dir="ltr">{student.avg_score}</td>
                      <td className="py-2 text-center text-neutral-600">{student.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm">
        <h2 className="text-base font-bold text-primary-dark mb-4">ملخص الفترة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800">حاضر: <strong>{attendance?.present ?? 0}</strong></div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800">غائب: <strong>{attendance?.absent ?? 0}</strong></div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800">متأخر: <strong>{attendance?.late ?? 0}</strong></div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-700">بعذر: <strong>{attendance?.excused ?? 0}</strong></div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-beige-50">جلسات المراجعة: <strong>{progress?.revision ?? 0}</strong></div>
          <div className="p-3 rounded-xl bg-beige-50">التقييمات: <strong>{progress?.evaluations ?? 0}</strong></div>
          <div className="p-3 rounded-xl bg-beige-50">متوسط الدرجات: <strong>{progress?.avg_score ?? '—'}</strong></div>
        </div>
      </div>
    </div>
  );
}
