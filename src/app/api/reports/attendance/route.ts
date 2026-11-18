import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await readSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('start') || '')
    ? url.searchParams.get('start')!
    : '1970-01-01';
  const end = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('end') || '')
    ? url.searchParams.get('end')!
    : new Date().toISOString().slice(0, 10);

  const rows = await query<{
    student_name: string;
    halaqa_name: string;
    mosque_name: string;
    attendance_date: string;
    status: string;
    note: string | null;
  }>(
    `SELECT s.full_name AS student_name,
            h.name AS halaqa_name,
            m.name AS mosque_name,
            a.attendance_date::text AS attendance_date,
            a.status::text AS status,
            a.note
     FROM attendance a
     JOIN student_enrollments e ON e.id = a.student_enrollment_id
     JOIN students s ON s.id = e.student_id
     JOIN halaqat h ON h.id = e.halaqa_id
     JOIN mosques m ON m.id = h.mosque_id
     WHERE a.attendance_date BETWEEN $1 AND $2
     ORDER BY a.attendance_date DESC, s.full_name`,
    [start, end]
  );

  const header = ['الطالب', 'الحلقة', 'المسجد', 'التاريخ', 'الحالة', 'ملاحظة'];
  const statusAr: Record<string, string> = {
    PRESENT: 'حاضر',
    ABSENT: 'غائب',
    LATE: 'متأخر',
    EXCUSED: 'بعذر',
  };

  const lines = [
    header.map(csvCell).join(','),
    ...rows.map((row) =>
      [
        csvCell(row.student_name),
        csvCell(row.halaqa_name),
        csvCell(row.mosque_name),
        csvCell(row.attendance_date),
        csvCell(statusAr[row.status] ?? row.status),
        csvCell(row.note),
      ].join(',')
    ),
  ];

  // UTF-8 BOM so Excel renders Arabic correctly.
  const body = `\uFEFF${lines.join('\r\n')}`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${start}-${end}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
