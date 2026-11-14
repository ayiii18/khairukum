'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Search, Filter, MoreVertical, X, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { HalaqaRow } from '@/lib/queries/halaqat';
import { addHalaqa, deleteHalaqa } from '@/lib/actions/halaqat';

export default function HalaqatClient({ initialHalaqat, mosques }: { initialHalaqat: HalaqaRow[], mosques: {id: string, name: string}[] }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMosque, setSelectedMosque] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFiltered = Boolean(searchQuery || selectedMosque || selectedStatus !== 'ALL');

  const filteredHalaqat = initialHalaqat.filter(h => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesName = h.name?.toLowerCase().includes(q);
      const matchesMosque = h.mosque_name?.toLowerCase().includes(q);
      const matchesTeacher = h.primary_teacher_name?.toLowerCase().includes(q);
      if (!matchesName && !matchesMosque && !matchesTeacher) return false;
    }

    if (selectedMosque && h.mosque_name !== selectedMosque) {
      return false;
    }

    if (selectedStatus === 'ACTIVE' && !h.is_active) return false;
    if (selectedStatus === 'INACTIVE' && h.is_active) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMosque('');
    setSelectedStatus('ALL');
  };

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addHalaqa(formData);
      setIsAddModalOpen(false);
      toast.success('تمت إضافة الحلقة', 'تم إنشاء الحلقة بنجاح وتحديث القائمة');
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء إضافة الحلقة', err.message || 'تعذر إضافة الحلقة');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه الحلقة؟ (قد لا تتمكن من الحذف إذا كان هناك طلاب مرتبطين)')) {
      try {
        await deleteHalaqa(id);
        toast.success('تم الحذف', 'تم حذف الحلقة بنجاح');
      } catch(err: any) {
        toast.error('تعذر الحذف', 'لا يمكن حذف الحلقة لأنها مرتبطة بسجلات أو طلاب.');
      }
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">إدارة الحلقات</h1>
            <p className="text-sm text-neutral-500 mt-1">
              إدارة ومتابعة حلقات التحفيظ. عدد الحلقات:{' '}
              <span className="font-semibold text-primary">{filteredHalaqat.length}</span> من أصل{' '}
              <span className="font-semibold">{initialHalaqat.length}</span>
            </p>
          </div>
          <Button variant="primary" className="shadow-sm" onClick={() => setIsAddModalOpen(true)}>
            + إضافة حلقة جديدة
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              placeholder="ابحث عن حلقة، مسجد، أو معلم..." 
              className="w-full h-10 ps-10 pe-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 end-3 text-neutral-400 hover:text-neutral-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select 
            value={selectedMosque}
            onChange={(e) => setSelectedMosque(e.target.value)}
            className="h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm bg-white"
          >
            <option value="">جميع المساجد</option>
            {mosques.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm bg-white"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
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

        <div className="hidden sm:block bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral">
                <tr>
                  <th className="px-6 py-4 text-start">اسم الحلقة</th>
                  <th className="px-6 py-4 text-start">المسجد</th>
                  <th className="px-6 py-4 text-start">المعلم الأساسي</th>
                  <th className="px-6 py-4 text-center">عدد الطلاب</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                  <th className="px-6 py-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {filteredHalaqat.map((h) => (
                  <tr key={h.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4 font-quran text-lg text-primary">{h.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{h.mosque_name}</td>
                    <td className="px-6 py-4 text-neutral-600">{h.primary_teacher_name || 'غير محدد'}</td>
                    <td className="px-6 py-4 text-center font-medium text-accent">{h.students_count}</td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${h.is_active ? 'bg-semantic-success/10 text-semantic-success' : 'bg-neutral-200 text-neutral-600'}`}>
                        {h.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-semantic-error hover:bg-semantic-error/10" onClick={() => handleDelete(h.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHalaqat.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      لا توجد حلقات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-neutral flex justify-between items-center">
              <h2 className="text-lg font-bold">إضافة حلقة جديدة</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-800">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الحلقة *</label>
                <input type="text" name="name" required className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المسجد التابعة له *</label>
                <select name="mosque_id" required className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="">اختر المسجد...</option>
                  {mosques.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea name="description" className="w-full p-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" value="true" id="is_active_h" defaultChecked className="w-4 h-4 text-primary rounded border-neutral" />
                <label htmlFor="is_active_h" className="text-sm font-medium">الحلقة نشطة</label>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الحلقة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
