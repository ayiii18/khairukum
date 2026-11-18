'use client';
import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, FileText, X, RotateCcw } from 'lucide-react';
import { AttendanceRow } from '@/lib/queries/attendance';

export default function AttendanceClient({ 
  historicalRecords,
  mosques,
  halaqat
}: { 
  historicalRecords: AttendanceRow[];
  mosques: {id: string, name: string}[];
  halaqat: {id: string, name: string, mosque_id: string}[];
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMosque, setSelectedMosque] = useState('');
  const [selectedHalaqa, setSelectedHalaqa] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-success/10 text-semantic-success"><CheckCircle size={14}/> حاضر</span>;
      case 'ABSENT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-error/10 text-semantic-error"><XCircle size={14}/> غائب</span>;
      case 'LATE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-semantic-warning/10 text-semantic-warning"><Clock size={14}/> متأخر</span>;
      case 'EXCUSED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-600"><FileText size={14}/> بعذر</span>;
      default: return null;
    }
  };

  const isFiltered = Boolean(searchQuery || selectedMosque || selectedHalaqa || selectedDate || selectedStatus !== 'ALL');

  const handleResetFilters = () => {
    setSelectedDate('');
    setSelectedMosque('');
    setSelectedHalaqa('');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  // Filter Historical Records
  const filteredHistory = historicalRecords.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchStudent = r.student_name?.toLowerCase().includes(q);
      const matchHalaqa = r.halaqa_name?.toLowerCase().includes(q);
      const matchTeacher = r.teacher_name?.toLowerCase().includes(q);
      if (!matchStudent && !matchHalaqa && !matchTeacher) return false;
    }

    if (selectedMosque) {
      const mosqueHalaqatNames = halaqat.filter(h => h.mosque_id === selectedMosque).map(h => h.name);
      if (!mosqueHalaqatNames.includes(r.halaqa_name)) return false;
    }

    if (selectedHalaqa) {
      const targetHalaqa = halaqat.find(h => h.id === selectedHalaqa);
      if (targetHalaqa && r.halaqa_name !== targetHalaqa.name) return false;
    }

    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) {
      return false;
    }

    if (selectedDate) {
      const recordDate = new Date(r.attendance_date).toISOString().split('T')[0];
      if (recordDate !== selectedDate) return false;
    }

    return true;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral/30 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark mb-1">سجل الحضور والانصراف</h1>
            <p className="text-sm text-neutral-500">متابعة حضور الطلاب في جميع الحلقات</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-lg border border-neutral/30 shadow-sm w-full md:w-auto overflow-x-auto">
            <span className="px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap bg-primary/10 text-primary">
              السجل التاريخي (للاطلاع فقط)
            </span>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-neutral-600" 
              title="تصفية بالتاريخ"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute top-2.5 end-2 text-neutral-400 hover:text-neutral-600 bg-white"
                title="مسح التاريخ"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <select 
            value={selectedMosque} 
            onChange={e => { setSelectedMosque(e.target.value); setSelectedHalaqa(''); }}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="">جميع المساجد</option>
            {mosques.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select 
            value={selectedHalaqa}
            onChange={e => setSelectedHalaqa(e.target.value)}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="">جميع الحلقات</option>
            {halaqat.filter(h => !selectedMosque || h.mosque_id === selectedMosque).map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="PRESENT">حاضر</option>
            <option value="LATE">متأخر</option>
            <option value="ABSENT">غائب</option>
            <option value="EXCUSED">بعذر</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
            <input 
              type="text" 
              placeholder="اسم الطالب أو الحلقة أو المعلم..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 ps-9 pe-8 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm" 
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

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="p-4 border-b border-neutral/30 flex justify-between items-center bg-neutral-light/50">
            <h3 className="font-semibold text-primary-dark">
              السجل التاريخي للحضور والانصراف
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral">
                <tr>
                  <th className="px-6 py-4 text-start">الطالب</th>
                  <th className="px-6 py-4 text-start">الحلقة</th>
                  <th className="px-6 py-4 text-start">المعلم</th>
                  <th className="px-6 py-4 text-start">التاريخ</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                  <th className="px-6 py-4 text-start">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-dark">{record.student_name}</td>
                      <td className="px-6 py-4 text-neutral-600">{record.halaqa_name}</td>
                      <td className="px-6 py-4 text-neutral-600">{record.teacher_name || '-'}</td>
                      <td className="px-6 py-4 text-neutral-600" dir="ltr">{new Date(record.attendance_date).toLocaleDateString('ar-SA')}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-xs">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center py-8 text-neutral-500">لا توجد سجلات تاريخية مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
