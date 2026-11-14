'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Search, Calendar, Star, FileText, ClipboardList, BookOpen, Mic, X, RotateCcw } from 'lucide-react';
import { EvaluationRow } from '@/lib/queries/evaluations';
import { AttendanceStudentRow } from '@/lib/queries/attendance';
import { addEvaluation } from '@/lib/actions/evaluations';

export default function EvaluationsClient({
  initialRecords,
  activeStudents,
  halaqat
}: {
  initialRecords: EvaluationRow[];
  activeStudents: AttendanceStudentRow[];
  halaqat: {id: string, name: string}[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqa, setSelectedHalaqa] = useState('');
  const [selectedScore, setSelectedScore] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formHalaqaId, setFormHalaqaId] = useState('');
  
  const [memScore, setMemScore] = useState(5);
  const [revScore, setRevScore] = useState(5);
  const [recScore, setRecScore] = useState(5);

  const overallScoreCalc = Math.round((memScore + revScore + recScore) / 3);

  const isFiltered = Boolean(searchQuery || selectedHalaqa || selectedScore !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedHalaqa('');
    setSelectedScore('ALL');
  };

  const filteredRecords = initialRecords.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchStudent = r.student_name?.toLowerCase().includes(q);
      const matchHalaqa = r.halaqa_name?.toLowerCase().includes(q);
      const matchTeacher = r.teacher_name?.toLowerCase().includes(q);
      if (!matchStudent && !matchHalaqa && !matchTeacher) return false;
    }

    if (selectedHalaqa) {
      const target = halaqat.find(h => h.id === selectedHalaqa);
      if (target && r.halaqa_name !== target.name) return false;
    }

    if (selectedScore !== 'ALL' && String(r.overall_score) !== selectedScore) {
      return false;
    }

    return true;
  });

  const renderStars = (rating: number) => {
    let colorClass = 'text-semantic-success';
    if (rating === 4) { colorClass = 'text-primary'; }
    if (rating === 3) { colorClass = 'text-accent'; }
    if (rating === 2) { colorClass = 'text-semantic-warning'; }
    if (rating <= 1) { colorClass = 'text-semantic-error'; }

    return (
      <div className={`flex items-center gap-0.5 ${colorClass}`} title={rating.toString()}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={i < rating ? 'fill-current' : 'text-neutral-300'} />
        ))}
      </div>
    );
  };

  const getOverallBadge = (rating: number) => {
    if (rating === 5) return 'ممتاز';
    if (rating === 4) return 'جيد جداً';
    if (rating === 3) return 'جيد';
    if (rating === 2) return 'مقبول';
    return 'ضعيف';
  };

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('overall_score', overallScoreCalc.toString());
    
    try {
      await addEvaluation(formData);
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
              <ClipboardList className="text-primary" size={28} />
              التقييمات الشاملة
            </h1>
            <p className="text-sm text-neutral-500 mt-1">التقييم العام لأداء الطالب في الحفظ والمراجعة والتلاوة</p>
          </div>
          <div className="hidden"></div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
            <input 
              type="text" 
              placeholder="اسم الطالب أو الحلقة أو المعلم..." 
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
            value={selectedScore}
            onChange={e => setSelectedScore(e.target.value)}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="ALL">جميع التقييمات العامة</option>
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
                  <th className="px-6 py-4 text-start">الطالب / المعلم</th>
                  <th className="px-6 py-4 text-start">التاريخ</th>
                  <th className="px-6 py-4 text-start">
                    <div className="flex items-center gap-1.5"><BookOpen size={14} className="text-primary"/> الحفظ</div>
                  </th>
                  <th className="px-6 py-4 text-start">
                    <div className="flex items-center gap-1.5"><FileText size={14} className="text-primary"/> المراجعة</div>
                  </th>
                  <th className="px-6 py-4 text-start">
                    <div className="flex items-center gap-1.5"><Mic size={14} className="text-primary"/> التلاوة</div>
                  </th>
                  <th className="px-6 py-4 text-start">التقييم العام</th>
                  <th className="px-6 py-4 text-start">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/30">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-neutral-500">لا توجد سجلات مطابقة</td></tr>
                ) : filteredRecords.map((ev) => (
                  <tr key={ev.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary-dark">{ev.student_name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">مقيّم: {ev.teacher_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600" dir="ltr">{new Date(ev.evaluated_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4">{renderStars(ev.memorization_score)}</td>
                    <td className="px-6 py-4">{renderStars(ev.revision_score)}</td>
                    <td className="px-6 py-4">{renderStars(ev.recitation_score)}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary-dark bg-neutral-100 px-3 py-1 rounded-full border border-neutral/30">
                        {getOverallBadge(ev.overall_score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-xs">
                      {ev.note || '-'}
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
