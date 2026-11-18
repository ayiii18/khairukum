'use client';
import React, { useState } from 'react';
import { Search, Book, UserX, Briefcase, Clock, MessageSquare, X, RotateCcw } from 'lucide-react';
import { NoteRow } from '@/lib/queries/notes';

export default function NotesClient({ initialNotes }: { initialNotes: NoteRow[] }) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Categories definition with icons
  const categories = [
    { id: 'الكل', label: 'جميع الملاحظات', dbValue: null, icon: MessageSquare, color: 'text-neutral-500', bg: 'bg-neutral-light' },
    { id: 'تعليمي', label: 'تعليمي', dbValue: 'EDUCATIONAL', icon: Book, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'سلوكي', label: 'سلوكي', dbValue: 'BEHAVIORAL', icon: UserX, color: 'text-semantic-error', bg: 'bg-semantic-error/10' },
    { id: 'إداري', label: 'إداري', dbValue: 'ADMINISTRATIVE', icon: Briefcase, color: 'text-semantic-warning', bg: 'bg-semantic-warning/10' },
    { id: 'متابعة', label: 'متابعة وتوجيه', dbValue: 'FOLLOWUP', icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const isFiltered = Boolean(searchQuery || selectedDate || activeCategory !== 'الكل');

  const handleResetFilters = () => {
    setActiveCategory('الكل');
    setSearchQuery('');
    setSelectedDate('');
  };

  const filteredNotes = initialNotes.filter(n => {
    if (activeCategory !== 'الكل') {
      const cat = categories.find(c => c.id === activeCategory);
      if (n.category !== cat?.dbValue) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchStudent = n.student_name?.toLowerCase().includes(q);
      const matchTeacher = n.teacher_name?.toLowerCase().includes(q);
      if (!matchContent && !matchStudent && !matchTeacher) return false;
    }
    if (selectedDate && new Date(n.created_at).toISOString().split('T')[0] !== selectedDate) return false;
    return true;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral/30 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <MessageSquare className="text-primary" size={28} />
              سجل الملاحظات الشامل
            </h1>
            <p className="text-sm text-neutral-500 mt-1">متابعة دقيقة لجميع ملاحظات المعلمين (للقراءة فقط)</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden sticky top-6">
              <div className="p-4 bg-neutral-light border-b border-neutral/30">
                <h3 className="font-semibold text-primary-dark">تصنيف الملاحظات</h3>
              </div>
              <div className="p-2 space-y-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors
                        ${isActive ? `${cat.bg} ${cat.color}` : 'hover:bg-neutral-50 text-neutral-600'}`}
                    >
                      <Icon size={18} className={isActive ? cat.color : 'text-neutral-400'} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:w-3/4 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="ابحث في نص الملاحظة، الطالب، المعلم..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="relative">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-neutral-600" 
                  title="تصفية حسب التاريخ"
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

            <div className="space-y-4">
              {filteredNotes.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-card border border-neutral/30 text-center text-neutral-500">
                  لا توجد ملاحظات
                </div>
              ) : filteredNotes.map((note) => {
                const categoryInfo = categories.find(c => c.dbValue === note.category) || categories[0];
                const Icon = categoryInfo.icon;
                return (
                  <div key={note.id} className="bg-white p-5 rounded-xl shadow-card border border-neutral/30 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${categoryInfo.bg} ${categoryInfo.color}`}>
                        <Icon size={14} />
                        {categoryInfo.label}
                      </div>
                      <span className="text-xs text-neutral-500 font-medium bg-neutral-light px-2 py-1 rounded" dir="ltr">{new Date(note.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    
                    <p className="text-primary-dark font-medium leading-relaxed mb-4">
                      «{note.content}»
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-neutral/30 pt-3">
                      <span className="flex items-center gap-1.5">
                        <span className="text-neutral-400">الطالب:</span>
                        <span className="text-primary-dark font-medium">{note.student_name}</span>
                      </span>
                      <span className="text-neutral-300">|</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-neutral-400">كتبها المعلم:</span>
                        <span className="text-primary-dark font-medium">{note.teacher_name}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
