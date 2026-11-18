'use client';

import { Printer, FileText } from 'lucide-react';

export default function ReportActions({ start, end }: { start: string; end: string }) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/reports/attendance?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral/50 text-charcoal-800 text-xs font-bold hover:bg-beige-50 transition-colors"
      >
        <FileText size={15} className="text-primary" />
        <span>تصدير CSV</span>
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
      >
        <Printer size={15} />
        <span>طباعة</span>
      </button>
    </div>
  );
}
