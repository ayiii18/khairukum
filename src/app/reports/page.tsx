'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BarChart3, Download, Printer, Filter, Calendar, FileText, CheckCircle2, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMosque, setSelectedMosque] = useState('');

  const reportConfigs: Record<string, {
    title: string;
    description: string;
    kpis: { label: string; value: string; unit?: string; color: string }[];
    chartTitle: string;
    chartLabels: string[];
    chartValues: number[];
    breakdownTitle: string;
    breakdownItems: { name: string; val: string; sub?: string }[];
  }> = {
    attendance: {
      title: 'تقرير الحضور والغياب',
      description: 'نظرة تحليلية على التزام الطلاب والمعلمين بالحضور في الحلقات',
      kpis: [
        { label: 'إجمالي أيام الحضور للفترة', value: '24', unit: 'يوم', color: 'text-primary-dark' },
        { label: 'متوسط نسبة الحضور', value: '92%', color: 'text-semantic-success' },
        { label: 'إجمالي الطلاب الغائبين بلا عذر', value: '15', unit: 'طالب', color: 'text-semantic-error' },
      ],
      chartTitle: 'مخطط الحضور الأسبوعي',
      chartLabels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      chartValues: [85, 92, 88, 70, 95],
      breakdownTitle: 'أقل الحلقات حضوراً',
      breakdownItems: [
        { name: 'حلقة ابن كثير', val: '75%', sub: 'جامع الملك فهد' },
        { name: 'حلقة أبو بكر', val: '80%', sub: 'مسجد الهدى' },
        { name: 'حلقة عثمان بن عفان', val: '82%', sub: 'مسجد النور' },
      ],
    },
    progress: {
      title: 'تقرير التقدم والإنجاز في الحفظ',
      description: 'تحليل معدلات الحفظ الجديد والمراجعة على مستوى الحلقات والطلاب',
      kpis: [
        { label: 'إجمالي الصفحات المسمعة', value: '348', unit: 'صفحة', color: 'text-primary' },
        { label: 'متوسط الإتقان والتقييم', value: '4.7', unit: 'من 5', color: 'text-semantic-success' },
        { label: 'الأجزاء المنجزة هذا الشهر', value: '18', unit: 'جزء', color: 'text-accent' },
      ],
      chartTitle: 'معدل الحفظ اليومي (عدد الصفحات)',
      chartLabels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      chartValues: [65, 80, 75, 90, 85],
      breakdownTitle: 'أعلى الحلقات إنجازاً',
      breakdownItems: [
        { name: 'حلقة حفص بن سليمان', val: '124 صفحة', sub: 'جامع الملك فهد' },
        { name: 'حلقة الإمام عاصم', val: '98 صفحة', sub: 'مسجد التقوى' },
        { name: 'حلقة الإمام نافع', val: '86 صفحة', sub: 'مسجد النور' },
      ],
    },
    teacher: {
      title: 'تقرير أداء المعلمين',
      description: 'تقييم شامل لانتظام المعلمين وإدارة الحلقات والتقييمات',
      kpis: [
        { label: 'المعلمون النشطون', value: '28', unit: 'معلم', color: 'text-primary-dark' },
        { label: 'نسبة رفع الحضور اليومي', value: '96%', color: 'text-semantic-success' },
        { label: 'متوسط تقييم المعلمين', value: '4.8', unit: 'من 5', color: 'text-primary' },
      ],
      chartTitle: 'نسبة اكتمال المهام اليومية للمعلمين (%)',
      chartLabels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      chartValues: [95, 98, 92, 94, 99],
      breakdownTitle: 'المعلمون المتميزون هذا الشهر',
      breakdownItems: [
        { name: 'أحمد عبدالله السعدي', val: '5.0 ★', sub: 'حلقة حفص - 100% حضور' },
        { name: 'محمد إبراهيم الشنقيطي', val: '4.9 ★', sub: 'حلقة عاصم - 98% حضور' },
        { name: 'عبدالرحمن خالد العتيبي', val: '4.8 ★', sub: 'حلقة نافع - 95% حضور' },
      ],
    },
  };

  const currentReport = reportConfigs[activeReport] || reportConfigs.attendance;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExport = () => {
    alert(`تم تجهيز ملف ${currentReport.title} بصيغة Excel/PDF بنجاح للتحميل.`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <BarChart3 className="text-primary" size={28} />
              {currentReport.title}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">{currentReport.description}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePrint} variant="outline" className="gap-2 text-primary-dark border-neutral/50">
              <Printer size={16} /> طباعة
            </Button>
            <Button onClick={handleExport} variant="primary" className="gap-2 shadow-sm">
              <Download size={16} /> تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-xl shadow-card border border-neutral/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral/30 pb-3">
            <Filter size={18} className="text-primary" />
            <h3 className="font-semibold text-primary-dark">خيارات التصفية وإعداد التقرير</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">نوع التقرير</label>
              <select 
                className="w-full h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3" 
                value={activeReport} 
                onChange={(e) => setActiveReport(e.target.value)}
              >
                <option value="attendance">تقرير الحضور والغياب</option>
                <option value="progress">تقرير التقدم والإنجاز</option>
                <option value="teacher">تقرير أداء المعلمين</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">من تاريخ</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-neutral-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">إلى تاريخ</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-neutral-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">المسجد</label>
              <select 
                value={selectedMosque}
                onChange={e => setSelectedMosque(e.target.value)}
                className="w-full h-10 text-sm border border-neutral rounded-md bg-white focus:ring-1 focus:ring-primary px-3"
              >
                <option value="">جميع المساجد</option>
                <option value="جامع الملك فهد">جامع الملك فهد</option>
                <option value="مسجد الهدى">مسجد الهدى</option>
                <option value="مسجد النور">مسجد النور</option>
                <option value="مسجد التقوى">مسجد التقوى</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Report Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
          
          {/* Summary Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentReport.kpis.map((kpi, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-neutral/30 shadow-card">
                <p className="text-sm text-neutral-500 mb-1">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.color}`}>
                  {kpi.value} {kpi.unit && <span className="text-sm font-medium text-neutral-500">{kpi.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Chart Mockup */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral/30 shadow-card min-h-[300px]">
            <h3 className="font-semibold text-primary-dark mb-6">{currentReport.chartTitle}</h3>
            <div className="h-48 flex items-end justify-between gap-3 px-2 mt-auto">
              {currentReport.chartValues.map((val, i) => (
                <div key={i} className="flex flex-col items-center w-full gap-2">
                  <div className="w-full bg-primary/20 rounded-t-sm relative group h-40 flex items-end">
                    <div 
                      className="w-full bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-primary-light" 
                      style={{ height: `${val}%` }}
                    />
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-primary-dark text-white text-xs px-2 py-1 rounded transition-opacity shadow-sm">
                      {val}%
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">{currentReport.chartLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Breakdown Table */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-neutral/30 shadow-card overflow-hidden">
             <div className="p-4 border-b border-neutral/30 bg-neutral-light/50">
               <h3 className="font-semibold text-primary-dark">{currentReport.breakdownTitle}</h3>
             </div>
             <div className="divide-y divide-neutral/30">
               {currentReport.breakdownItems.map((h, i) => (
                 <div key={i} className="p-4 flex justify-between items-center hover:bg-neutral-50">
                   <div className="flex items-center gap-2">
                     <FileText size={16} className="text-neutral-400" />
                     <div>
                       <div className="text-sm font-medium text-primary-dark">{h.name}</div>
                       {h.sub && <div className="text-xs text-neutral-400">{h.sub}</div>}
                     </div>
                   </div>
                   <span className="text-sm font-bold text-primary">{h.val}</span>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </>
  );
}
