'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, UserPlus, Filter, X, RotateCcw,
  UsersRound, CheckCircle2, AlertTriangle, Star,
  Download, Printer, Phone, MessageSquare, LayoutGrid,
  List, ChevronLeft, ChevronRight, Eye, ShieldCheck,
  Building2, BookOpen, User, Sparkles
} from 'lucide-react';
import { StudentRow } from '@/lib/queries/students';

interface Props {
  initialStudents: StudentRow[];
  mosques: { id: string; name: string }[];
  halaqat: { id: string; name: string; mosque_name: string }[];
  initialSearch?: string;
  initialFilter?: string;
  initialMosque?: string;
  initialHalaqa?: string;
}

type QuickFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'URGENT' | 'EXCELLENT' | 'MALE' | 'FEMALE' | 'UNASSIGNED';

export default function StudentsClient({
  initialStudents,
  mosques,
  halaqat,
  initialSearch = '',
  initialFilter = '',
  initialMosque = '',
  initialHalaqa = '',
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedMosque, setSelectedMosque] = useState(initialMosque);
  const [selectedHalaqa, setSelectedHalaqa] = useState(initialHalaqa);
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>(() => {
    if (initialFilter === 'urgent') return 'URGENT';
    if (initialFilter === 'excellent') return 'EXCELLENT';
    if (initialFilter === 'active') return 'ACTIVE';
    return 'ALL';
  });

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync if initial props change
  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
    if (initialFilter === 'urgent') setQuickFilter('URGENT');
    if (initialFilter === 'excellent') setQuickFilter('EXCELLENT');
    if (initialMosque) setSelectedMosque(initialMosque);
    if (initialHalaqa) setSelectedHalaqa(initialHalaqa);
  }, [initialSearch, initialFilter, initialMosque, initialHalaqa]);

  // Overall Statistics calculated from initial data
  const stats = useMemo(() => {
    const total = initialStudents.length;
    const active = initialStudents.filter(s => s.is_active).length;
    const urgent = initialStudents.filter(s => s.attendance_rate !== null && s.attendance_rate < 75).length;
    const excellent = initialStudents.filter(s => s.attendance_rate !== null && s.attendance_rate >= 90).length;
    
    const studentsWithRate = initialStudents.filter(s => s.attendance_rate !== null);
    const avgAttendance = studentsWithRate.length > 0
      ? (studentsWithRate.reduce((acc, curr) => acc + (curr.attendance_rate || 0), 0) / studentsWithRate.length).toFixed(1)
      : '0.0';

    return { total, active, urgent, excellent, avgAttendance };
  }, [initialStudents]);

  // Filter halaqat options when a mosque is selected
  const availableHalaqat = useMemo(() => {
    if (!selectedMosque) return halaqat;
    return halaqat.filter((h) => h.mosque_name === selectedMosque);
  }, [halaqat, selectedMosque]);

  // Handle mosque change
  const handleMosqueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mosqueName = e.target.value;
    setSelectedMosque(mosqueName);
    if (mosqueName && selectedHalaqa) {
      const exists = halaqat.some(
        (h) => h.name === selectedHalaqa && h.mosque_name === mosqueName
      );
      if (!exists) setSelectedHalaqa('');
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMosque('');
    setSelectedHalaqa('');
    setQuickFilter('ALL');
    setCurrentPage(1);
  };

  const isFiltered = Boolean(
    searchQuery || selectedMosque || selectedHalaqa || quickFilter !== 'ALL'
  );

  // Main Filtered list
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((s) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = s.full_name?.toLowerCase().includes(q);
        const matchesPhone = s.phone?.includes(q);
        const matchesParent = s.parent_name?.toLowerCase().includes(q);
        const matchesId = s.id?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesParent && !matchesId) {
          return false;
        }
      }

      // 2. Mosque Filter
      if (selectedMosque && s.mosque_name !== selectedMosque) {
        return false;
      }

      // 3. Halaqa Filter
      if (selectedHalaqa && s.halaqa_name !== selectedHalaqa) {
        return false;
      }

      // 4. Quick Filters
      if (quickFilter === 'ACTIVE' && !s.is_active) return false;
      if (quickFilter === 'INACTIVE' && s.is_active) return false;
      if (quickFilter === 'URGENT') {
        if (s.attendance_rate === null || s.attendance_rate >= 75) return false;
      }
      if (quickFilter === 'EXCELLENT') {
        if (s.attendance_rate === null || s.attendance_rate < 90) return false;
      }
      if (quickFilter === 'MALE' && s.gender !== 'MALE') return false;
      if (quickFilter === 'FEMALE' && s.gender !== 'FEMALE') return false;
      if (quickFilter === 'UNASSIGNED' && s.halaqa_name) return false;

      return true;
    });
  }, [initialStudents, searchQuery, selectedMosque, selectedHalaqa, quickFilter]);

  // Paginated Results
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // CSV Export functionality (with UTF-8 BOM for proper Arabic display in Excel)
  const handleExportCSV = () => {
    const headers = ['المعرف', 'الاسم الكامل', 'الجنس', 'الهاتف', 'المسجد', 'الحلقة', 'ولي الأمر', 'نسبة الحضور', 'الحالة'];
    const rows = filteredStudents.map(s => [
      `"${s.id}"`,
      `"${s.full_name || ''}"`,
      `"${s.gender === 'MALE' ? 'ذكر' : 'أنثى'}"`,
      `"${s.phone || 'غير مسجل'}"`,
      `"${s.mosque_name || 'غير محدد'}"`,
      `"${s.halaqa_name || 'غير محدد'}"`,
      `"${s.parent_name || 'غير مسجل'}"`,
      `"${s.attendance_rate !== null ? s.attendance_rate + '%' : 'غير متوفر'}"`,
      `"${s.is_active ? 'نشط' : 'غير نشط'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `قائمة_الطلاب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print list
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral/40 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles size={14} />
            <span>نظام إدارة شؤون الطلاب</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-dark">سجل الطلاب والحلقات</h1>
          <p className="text-sm text-neutral-500 mt-1">
            إدارة بيانات الطلاب، الحضور والغياب، وتفاصيل التواصل مع أولياء الأمور.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-primary-dark rounded-xl text-xs font-bold transition-all border border-neutral/50 shadow-xs"
            title="تصدير إلى Excel / CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-primary-dark rounded-xl text-xs font-bold transition-all border border-neutral/50 shadow-xs"
            title="طباعة التقرير"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          <Link href="/students/add">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-primary-dark hover:bg-accent-hover rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg">
              <UserPlus size={16} />
              <span>+ تسجيل طالب جديد</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <button
          onClick={() => { setQuickFilter('ALL'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl text-start transition-all border flex items-start gap-3.5 ${
            quickFilter === 'ALL'
              ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20'
              : 'bg-white hover:border-primary/50 border-neutral/40 shadow-xs'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            quickFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
          }`}>
            <UsersRound size={22} />
          </div>
          <div>
            <span className={`text-xs font-semibold block ${quickFilter === 'ALL' ? 'text-white/80' : 'text-neutral-500'}`}>
              إجمالي الطلاب
            </span>
            <span className="text-2xl font-extrabold mt-0.5 block" dir="ltr">
              {stats.total.toLocaleString('ar-SA')}
            </span>
            <span className={`text-[10px] mt-1 inline-block ${quickFilter === 'ALL' ? 'text-accent' : 'text-primary'}`}>
              انقر للعرض الكامل
            </span>
          </div>
        </button>

        {/* Active Students */}
        <button
          onClick={() => { setQuickFilter('ACTIVE'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl text-start transition-all border flex items-start gap-3.5 ${
            quickFilter === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white hover:border-emerald-500/50 border-neutral/40 shadow-xs'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            quickFilter === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className={`text-xs font-semibold block ${quickFilter === 'ACTIVE' ? 'text-white/80' : 'text-neutral-500'}`}>
              الطلاب النشطون
            </span>
            <span className="text-2xl font-extrabold mt-0.5 block" dir="ltr">
              {stats.active.toLocaleString('ar-SA')}
            </span>
            <span className={`text-[10px] mt-1 inline-block ${quickFilter === 'ACTIVE' ? 'text-emerald-200' : 'text-emerald-600'}`}>
              {stats.total ? `${Math.round((stats.active / stats.total) * 100)}% من الإجمالي` : ''}
            </span>
          </div>
        </button>

        {/* Average Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-neutral/40 shadow-xs flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Star size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-neutral-500 block">متوسط الحضور</span>
            <span className="text-2xl font-extrabold text-primary-dark mt-0.5 block" dir="ltr">
              {stats.avgAttendance}%
            </span>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, parseFloat(stats.avgAttendance))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Urgent Follow-up */}
        <button
          onClick={() => { setQuickFilter('URGENT'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl text-start transition-all border flex items-start gap-3.5 ${
            quickFilter === 'URGENT'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-600/20'
              : 'bg-white hover:border-rose-500/50 border-neutral/40 shadow-xs'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            quickFilter === 'URGENT' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
          }`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className={`text-xs font-semibold block ${quickFilter === 'URGENT' ? 'text-white/80' : 'text-neutral-500'}`}>
              يحتاجون متابعة عاجلة
            </span>
            <span className="text-2xl font-extrabold mt-0.5 block" dir="ltr">
              {stats.urgent.toLocaleString('ar-SA')}
            </span>
            <span className={`text-[10px] mt-1 inline-block ${quickFilter === 'URGENT' ? 'text-rose-200' : 'text-rose-600'}`}>
              حضور أقل من 75%
            </span>
          </div>
        </button>
      </div>

      {/* Control Panel: Filters & Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral/40 space-y-4">
        {/* Quick Filter Chips (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <span className="text-neutral-400 text-xs shrink-0 flex items-center gap-1">
            <Filter size={13} />
            تصفية سريعة:
          </span>
          {[
            { id: 'ALL', label: 'جميع الطلاب', count: stats.total },
            { id: 'ACTIVE', label: 'النشطون فقط', count: stats.active },
            { id: 'URGENT', label: 'حضور ضعيف (< 75%)', count: stats.urgent, alert: true },
            { id: 'EXCELLENT', label: 'متميزون (≥ 90%)', count: stats.excellent },
            { id: 'MALE', label: 'بنين' },
            { id: 'FEMALE', label: 'بنات' },
            { id: 'UNASSIGNED', label: 'بدون حلقة' },
          ].map((chip) => {
            const isSelected = quickFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  setQuickFilter(chip.id as QuickFilterType);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : chip.alert
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 border border-neutral/40'
                }`}
              >
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Dynamic Selectors */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Box */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ابحث بالاسم الكامل، رقم الهاتف، اسم ولي الأمر، أو معرف الطالب..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 ps-10 pe-9 rounded-xl border border-neutral/60 bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary text-xs md:text-sm transition-all"
            />
            <Search className="w-4 h-4 absolute top-3.5 start-3 text-neutral-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute top-3 end-3 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
                title="مسح البحث"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Mosque Dropdown */}
          <div className="min-w-[180px]">
            <select
              value={selectedMosque}
              onChange={handleMosqueChange}
              className="w-full h-11 text-xs md:text-sm border border-neutral/60 rounded-xl bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary px-3 text-primary-dark font-medium"
            >
              <option value="">جميع المساجد ({mosques.length})</option>
              {mosques.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Halaqa Dropdown */}
          <div className="min-w-[180px]">
            <select
              value={selectedHalaqa}
              onChange={(e) => { setSelectedHalaqa(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 text-xs md:text-sm border border-neutral/60 rounded-xl bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary px-3 text-primary-dark font-medium"
            >
              <option value="">جميع الحلقات ({availableHalaqat.length})</option>
              {availableHalaqat.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name} {h.mosque_name && !selectedMosque ? `(${h.mosque_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 border border-neutral/50 p-1 rounded-xl bg-neutral-50/80 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-primary font-bold' : 'text-neutral-500 hover:text-primary-dark'
              }`}
              title="عرض الجدول"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-primary font-bold' : 'text-neutral-500 hover:text-primary-dark'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="h-11 px-3 text-xs border border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
              title="مسح كافة معايير التصفية"
            >
              <RotateCcw size={14} />
              <span>مسح الفلاتر</span>
            </button>
          )}
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral/30">
          <div>
            تم العثور على <strong className="text-primary font-bold text-sm">{filteredStudents.length}</strong> طالب
            {isFiltered && <span> (مطابق لمعايير البحث والتصفية)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>عدد العناصر بالصفحة:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-neutral/50 rounded-lg px-2 py-0.5 bg-white text-xs text-primary-dark font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-neutral/40 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-primary-dark">لم يتم العثور على أي نتائج</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            لا يوجد أي طالب يطابق معايير البحث أو التصفية الحالية. جرب تغيير كلمة البحث أو إعادة تعيين الفلاتر.
          </p>
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all shadow-sm"
            >
              إلغاء التصفية وإظهار كل الطلاب
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-neutral/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-start">
              <thead className="bg-[#F8FAFC] text-primary-dark font-bold border-b border-neutral/50">
                <tr>
                  <th className="px-5 py-4 text-start">الطالب والاتصال</th>
                  <th className="px-5 py-4 text-start">المسجد والحلقة</th>
                  <th className="px-5 py-4 text-start">نسبة الحضور</th>
                  <th className="px-5 py-4 text-start">الحالة</th>
                  <th className="px-5 py-4 text-start">ولي الأمر</th>
                  <th className="px-5 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/30">
                {paginatedStudents.map((s) => {
                  const rate = s.attendance_rate;
                  const rateColor =
                    rate === null
                      ? 'text-neutral-400'
                      : rate >= 85
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : rate >= 70
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  const cleanPhone = s.phone?.replace(/[^0-9]/g, '') || '';
                  const whatsappPhone = cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Student Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs ${
                            s.gender === 'FEMALE'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {s.full_name?.trim().charAt(0) || 'ط'}
                          </div>
                          <div>
                            <div className="font-bold text-primary-dark group-hover:text-primary transition-colors text-sm">
                              {s.full_name}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono mt-0.5" dir="ltr">
                              ID: {s.id.slice(0, 10)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mosque & Halaqa */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-primary-dark font-medium">
                            <BookOpen size={14} className="text-primary/70 shrink-0" />
                            <span>{s.halaqa_name || 'غير مسجل بحلقة'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <Building2 size={13} className="text-neutral-400 shrink-0" />
                            <span>{s.mosque_name || 'غير محدد'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance Rate */}
                      <td className="px-5 py-4">
                        {rate === null ? (
                          <span className="text-xs text-neutral-400 font-medium">لا توجد بيانات</span>
                        ) : (
                          <div className="space-y-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between text-xs font-bold" dir="ltr">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] border ${rateColor}`}>
                                {rate}%
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {rate >= 85 ? 'ممتاز' : rate >= 70 ? 'جيد' : 'إنذار غياب'}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rate >= 85 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, rate)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                          {s.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>

                      {/* Parent & Phone */}
                      <td className="px-5 py-4">
                        <div className="text-xs">
                          <div className="font-semibold text-primary-dark">{s.parent_name || '—'}</div>
                          {s.phone ? (
                            <span className="text-[11px] text-neutral-500 font-mono" dir="ltr">
                              {s.phone}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">لا يوجد رقم</span>
                          )}
                        </div>
                      </td>

                      {/* Quick Communication Actions */}
                      <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {s.phone && (
                            <>
                              <a
                                href={`tel:${s.phone}`}
                                className="p-2 rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-600 transition-colors"
                                title="اتصال هاتفي"
                              >
                                <Phone size={15} />
                              </a>
                              <a
                                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                                  `السلام عليكم ورحمة الله، ولي أمر الطالب ${s.full_name} في حلقة ${s.halaqa_name || ''} - جمعية خيركم.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-600 text-neutral-600 transition-colors"
                                title="مراسلة عبر واتساب"
                              >
                                <MessageSquare size={15} />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="p-2 rounded-lg bg-neutral-100 hover:bg-primary/10 hover:text-primary text-neutral-600 transition-colors"
                            title="عرض بطاقة التفاصيل"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-4 bg-[#F8FAFC] border-t border-neutral/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              عرض من {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, filteredStudents.length)} من إجمالي {filteredStudents.length} طالب
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-neutral/50 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="الصفحة السابقة"
              >
                <ChevronRight size={16} />
              </button>

              <span className="px-3 py-1 text-xs font-bold text-primary-dark">
                صفحة {currentPage} من {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-neutral/50 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="الصفحة التالية"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedStudents.map((s) => {
              const rate = s.attendance_rate;
              const cleanPhone = s.phone?.replace(/[^0-9]/g, '') || '';
              const whatsappPhone = cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white rounded-2xl p-5 border border-neutral/40 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:border-primary/40"
                >
                  <div>
                    {/* Header: Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 border ${
                          s.gender === 'FEMALE'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {s.full_name?.trim().charAt(0) || 'ط'}
                        </div>
                        <div>
                          <h4 className="font-bold text-primary-dark group-hover:text-primary transition-colors text-sm">
                            {s.full_name}
                          </h4>
                          <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                            {s.id.slice(0, 10)}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {s.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 py-3 border-y border-neutral/30 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <BookOpen size={13} className="text-primary/70" />
                          الحلقة:
                        </span>
                        <span className="font-semibold text-primary-dark">{s.halaqa_name || 'بدون حلقة'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <Building2 size={13} className="text-neutral-400" />
                          المسجد:
                        </span>
                        <span className="font-medium text-neutral-700 truncate max-w-[150px]">{s.mosque_name || 'غير محدد'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <User size={13} className="text-neutral-400" />
                          ولي الأمر:
                        </span>
                        <span className="font-medium text-neutral-700">{s.parent_name || 'غير مسجل'}</span>
                      </div>
                    </div>

                    {/* Attendance Indicator */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-neutral-500 font-medium">نسبة الحضور:</span>
                        <span className={`font-bold ${
                          rate === null ? 'text-neutral-400' : rate >= 85 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {rate !== null ? `${rate}%` : 'لا توجد بيانات'}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rate === null ? 'bg-neutral-300' : rate >= 85 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, rate || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-neutral/30 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye size={14} />
                      <span>عرض البطاقة</span>
                    </button>

                    {s.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${s.phone}`}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-700 transition-colors"
                          title="اتصال"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                            `السلام عليكم ورحمة الله، ولي أمر الطالب ${s.full_name} في حلقة ${s.halaqa_name || ''}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-600 transition-colors"
                          title="واتساب"
                        >
                          <MessageSquare size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards Pagination */}
          <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral/40">
            <span className="text-xs text-neutral-500">
              عرض {paginatedStudents.length} من أصل {filteredStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral/50 hover:bg-neutral-100 disabled:opacity-40 transition-colors font-medium"
              >
                السابق
              </button>
              <span className="text-xs font-bold text-primary-dark">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral/50 hover:bg-neutral-100 disabled:opacity-40 transition-colors font-medium"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Student Quick-View Modal / Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-neutral/40 overflow-hidden relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-primary-dark to-primary text-white p-6 relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 start-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="إغلاق"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold border border-white/30 text-white shrink-0">
                  {selectedStudent.full_name?.trim().charAt(0) || 'ط'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStudent.is_active ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'
                    }`}>
                      {selectedStudent.is_active ? 'حساب نشط' : 'حساب معطل'}
                    </span>
                    <span className="text-[11px] text-white/70">
                      {selectedStudent.gender === 'MALE' ? 'طالب (بنين)' : 'طالبة (بنات)'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 truncate">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-xs text-white/80 font-mono mt-0.5" dir="ltr">
                    المعرف: {selectedStudent.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Academic Placement */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <BookOpen size={15} className="text-primary" />
                    اسم الحلقة المقيد بها:
                  </span>
                  <span className="font-bold text-primary-dark text-sm">{selectedStudent.halaqa_name || 'غير مسجل بحلقة'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Building2 size={15} className="text-primary" />
                    المسجد:
                  </span>
                  <span className="font-semibold text-primary-dark">{selectedStudent.mosque_name || 'غير محدد'}</span>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="bg-white rounded-2xl p-4 border border-neutral/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-dark">مؤشر الانضباط والحضور العام</span>
                  <span className={`text-base font-extrabold ${
                    selectedStudent.attendance_rate === null
                      ? 'text-neutral-400'
                      : selectedStudent.attendance_rate >= 85
                      ? 'text-emerald-600'
                      : selectedStudent.attendance_rate >= 70
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {selectedStudent.attendance_rate !== null ? `${selectedStudent.attendance_rate}%` : 'غير متوفر'}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedStudent.attendance_rate === null
                        ? 'bg-neutral-300'
                        : selectedStudent.attendance_rate >= 85
                        ? 'bg-emerald-500'
                        : selectedStudent.attendance_rate >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, selectedStudent.attendance_rate || 0)}%` }}
                  />
                </div>
              </div>

              {/* Parent & Contact Details */}
              <div className="bg-white rounded-2xl p-4 border border-neutral/40 space-y-3">
                <h4 className="text-xs font-bold text-primary-dark">بيانات الاتصال وولي الأمر</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">اسم ولي الأمر:</span>
                    <span className="font-semibold text-primary-dark mt-0.5 block">{selectedStudent.parent_name || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[11px]">رقم هاتف الطالب/ولي الأمر:</span>
                    <span className="font-semibold text-primary-dark mt-0.5 block font-mono" dir="ltr">{selectedStudent.phone || 'غير مسجل'}</span>
                  </div>
                </div>

                {/* Instant Action Contact Buttons */}
                {selectedStudent.phone && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`tel:${selectedStudent.phone}`}
                      className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-primary-dark font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-neutral/50"
                    >
                      <Phone size={14} className="text-primary" />
                      <span>اتصال هاتفي</span>
                    </a>
                    <a
                      href={`https://wa.me/${(selectedStudent.phone.replace(/[^0-9]/g, '').startsWith('0') ? '966' + selectedStudent.phone.replace(/[^0-9]/g, '').slice(1) : selectedStudent.phone.replace(/[^0-9]/g, ''))}?text=${encodeURIComponent(
                        `السلام عليكم ورحمة الله وبركاته، نود التواصل معكم بخصوص الطالب ${selectedStudent.full_name} في حلقة ${selectedStudent.halaqa_name || ''} - جمعية خيركم.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <MessageSquare size={14} />
                      <span>محادثة واتساب</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Route Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/attendance"
                  className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-primary-dark text-xs font-semibold text-center transition-colors"
                >
                  سجل الحضور والغياب
                </Link>
                <Link
                  href="/memorization"
                  className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-primary-dark text-xs font-semibold text-center transition-colors"
                >
                  سجل الحفظ والتسميع
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral/30 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 text-primary-dark font-bold text-xs rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility exports
export const AddStudentButton: React.FC = () => null;
export const StudentsFilters: React.FC<any> = () => null;