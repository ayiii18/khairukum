'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Search, BookOpen, Calendar, FileText, Star, BookMarked, X, RotateCcw } from 'lucide-react';
import { MemorizationRow } from '@/lib/queries/memorization';
import { AttendanceStudentRow } from '@/lib/queries/attendance';
import { addMemorization } from '@/lib/actions/memorization';

export default function MemorizationClient({
  initialRecords,
  activeStudents,
  halaqat
}: {
  initialRecords: MemorizationRow[];
  activeStudents: AttendanceStudentRow[];
  halaqat: {id: string, name: string}[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqa, setSelectedHalaqa] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formHalaqaId, setFormHalaqaId] = useState('');

  const isFiltered = Boolean(searchQuery || selectedHalaqa || selectedEvaluation !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedHalaqa('');
    setSelectedEvaluation('ALL');
  };

  const filteredRecords = initialRecords.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchStudent = r.student_name?.toLowerCase().includes(q);
      const matchSurah = r.surah?.toLowerCase().includes(q);
      const matchTeacher = r.teacher_name?.toLowerCase().includes(q);
      if (!matchStudent && !matchSurah && !matchTeacher) return false;
    }

    if (selectedHalaqa) {
      const target = halaqat.find(h => h.id === selectedHalaqa);
      if (target && r.halaqa_name !== target.name) return false;
    }

    if (selectedEvaluation !== 'ALL' && String(r.evaluation) !== selectedEvaluation) {
      return false;
    }

    return true;
  });

  const getEvaluationBadge = (evaluation: number) => {
    switch (evaluation) {
      case 5: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-success/10 text-semantic-success"><Star size={14} className="fill-current"/> ممتاز</span>;
      case 4: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary"><Star size={14} className="fill-current" /> جيد جداً</span>;
      case 3: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent"><Star size={14} className="fill-current" /> جيد</span>;
      case 2: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-warning/10 text-semantic-warning"><Star size={14} className="fill-current" /> مقبول</span>;
      case 1: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-error/10 text-semantic-error"><Star size={14} className="fill-current" /> ضعيف</span>;
      default: return null;
    }
  };

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addMemorization(formData);
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <BookOpen className="text-primary" size={28} />
              متابعة الحفظ الجديد
            </h1>
            <p className="text-sm text-neutral-500 mt-1">سجل التسميع والحفظ الجديد للطلاب وتقييمهم</p>
          </div>
          <div className="hidden"></div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
            <input 
              type="text" 
              placeholder="اسم الطالب أو السورة أو المعلم..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 ps-9 pe-8 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm transition-colors" 
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 end-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <select 
            value={selectedHalaqa}
            onChange={e => setSelectedHalaqa(e.target.value)}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="">جميع الحلقات</option>
            {halaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select
            value={selectedEvaluation}
            onChange={e => setSelectedEvaluation(e.target.value)}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="ALL">جميع التقييمات</option>
            <option value="5">ممتاز (5)</option>
            <option value="4">جيد جداً (4)</option>
            <option value="3">جيد (3)</option>
            <option value="2">مقبول (2)</option>
            <option value="1">ضعيف (1)</option>
          </select>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="h-10 px-3 text-sm border border-neutral/60 rounded-md bg-white hover:bg-neutral-light text-primary flex items-center gap-1.5 transition-colors"
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw size={15} />
              <span>مسح التصفية</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral/50">
                <tr>
                  <th className="px-6 py-4 text-start">الطالب</th>
                  <th className="px-6 py-4 text-start">الحلقة / المعلم</th>
                  <th className="px-6 py-4 text-start">سورة الحفظ (الآيات)</th>
                  <th className="px-6 py-4 text-start">التاريخ</th>
                  <th className="px-6 py-4 text-start">التقييم</th>
                  <th className="px-6 py-4 text-start">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/30">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">لا توجد سجلات مطابقة</td></tr>
                ) : filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary-dark">{record.student_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-primary-dark">{record.halaqa_name}</div>
                      <div className="text-xs text-neutral-500">{record.teacher_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-accent" />
                        <span className="font-quran text-primary-dark text-lg">{record.surah}</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-1">
                        من آية <span className="font-bold">{record.from_ayah}</span> إلى <span className="font-bold">{record.to_ayah}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600" dir="ltr">{new Date(record.recorded_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4">
                      {getEvaluationBadge(record.evaluation)}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-xs max-w-[200px] truncate">
                      {record.note ? (
                        <div className="flex items-start gap-1">
                          <FileText size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                          <span title={record.note}>{record.note}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Read Only */}
    </>
  );
}
