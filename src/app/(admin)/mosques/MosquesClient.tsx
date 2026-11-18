'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Search, MapPin, X, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { MosqueRow } from '@/lib/queries/mosques';
import { addMosque, deleteMosque } from '@/lib/actions/mosques';
import { errorMessage } from '@/lib/logger';

export default function MosquesClient({ initialMosques }: { initialMosques: MosqueRow[] }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFiltered = Boolean(searchQuery || selectedStatus !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
  };
  
  const filteredMosques = initialMosques.filter(m => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchPhone = m.phone?.includes(q);
      const matchAddress = m.address?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAddress) return false;
    }

    if (selectedStatus === 'ACTIVE' && !m.is_active) return false;
    if (selectedStatus === 'INACTIVE' && m.is_active) return false;

    return true;
  });

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addMosque(formData);
      setIsAddModalOpen(false);
      toast.success('تمت إضافة المسجد', 'تم حفظ المسجد بنجاح وتحديث القائمة');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ', errorMessage(err) || 'تعذر إضافة المسجد');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا المسجد؟')) {
      try {
        await deleteMosque(id);
        toast.success('تم الحذف', 'تم حذف المسجد بنجاح');
      } catch (err) {
        toast.error('خطأ أثناء الحذف', errorMessage(err) || 'تعذر حذف المسجد');
      }
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">إدارة المساجد</h1>
            <p className="text-sm text-neutral-500 mt-1">
              إدارة جميع المساجد المسجلة في النظام. عدد المساجد:{' '}
              <span className="font-semibold text-primary">{filteredMosques.length}</span> من أصل{' '}
              <span className="font-semibold">{initialMosques.length}</span>
            </p>
          </div>
          <Button variant="primary" className="shadow-sm" onClick={() => setIsAddModalOpen(true)}>
            + إضافة مسجد جديد
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              placeholder="ابحث عن مسجد بالاسم، العنوان، أو الهاتف..." 
              className="w-full h-10 ps-10 pe-8 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 absolute top-3 start-3 text-neutral-400" />
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

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral">
                <tr>
                  <th className="px-6 py-4 text-start">اسم المسجد</th>
                  <th className="px-6 py-4 text-start">الموقع</th>
                  <th className="px-6 py-4 text-center">الحلقات</th>
                  <th className="px-6 py-4 text-center">الطلاب</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                  <th className="px-6 py-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {filteredMosques.map((mosque) => (
                  <tr key={mosque.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary-dark">
                      <Link href={`/mosques/${mosque.id}`} className="hover:text-primary hover:underline">
                        {mosque.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      {mosque.address || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-600">{mosque.halaqat_count}</td>
                    <td className="px-6 py-4 text-center text-accent font-semibold">{mosque.students_count}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${mosque.is_active ? 'bg-semantic-success/10 text-semantic-success' : 'bg-neutral-200 text-neutral-600'}`}>
                        {mosque.is_active && <span className="w-1.5 h-1.5 rounded-full bg-semantic-success"></span>}
                        {mosque.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <Button variant="ghost" size="sm" className="px-2 text-semantic-error hover:bg-semantic-error/10" onClick={() => handleDelete(mosque.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-neutral flex justify-between items-center">
              <h2 className="text-lg font-bold">إضافة مسجد جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-800">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم المسجد *</label>
                <input type="text" name="name" required className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <input type="text" name="address" className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                <input type="tel" name="phone" className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea name="description" className="w-full p-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none"></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" value="true" id="is_active" defaultChecked className="w-4 h-4 text-primary rounded border-neutral" />
                <label htmlFor="is_active" className="text-sm font-medium">المسجد نشط؟</label>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المسجد'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
