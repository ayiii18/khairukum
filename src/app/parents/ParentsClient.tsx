'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Search, Filter, MoreVertical, Phone, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ParentRow } from '@/lib/queries/parents';
import { addParent, deleteParent } from '@/lib/actions/parents';

export default function ParentsClient({ initialParents }: { initialParents: ParentRow[] }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const filteredParents = initialParents.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const matchName = p.full_name?.toLowerCase().includes(q);
    const matchPhone = p.phone?.includes(q);
    return matchName || matchPhone;
  });

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addParent(formData);
      setIsAddModalOpen(false);
      toast.success('تمت الإضافة بنجاح', 'تم تسجيل ولي الأمر وتحديث السجلات');
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ', err.message || 'تعذر إضافة ولي الأمر');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('هل أنت متأكد من حذف ولي الأمر هذا وحسابه؟')) {
      try {
        await deleteParent(id);
        toast.success('تم الحذف', 'تم حذف ولي الأمر وسجلاته المرتبطة بنجاح');
      } catch(err: any) {
        toast.error('خطأ أثناء الحذف', err.message || 'تعذر إتمام عملية الحذف');
      }
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">أولياء الأمور</h1>
            <p className="text-sm text-neutral-500 mt-1">
              إدارة بيانات أولياء الأمور وربطهم بأبنائهم. عدد النتائج:{' '}
              <span className="font-semibold text-primary">{filteredParents.length}</span> من أصل{' '}
              <span className="font-semibold">{initialParents.length}</span>
            </p>
          </div>
          <div className="hidden"></div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو رقم الجوال..." 
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
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral">
                <tr>
                  <th className="px-6 py-4 text-start">اسم ولي الأمر</th>
                  <th className="px-6 py-4 text-start">رقم الهاتف</th>
                  <th className="px-6 py-4 text-center">كل الأبناء</th>
                  <th className="px-6 py-4 text-center">الأبناء (النشطين)</th>
                  <th className="px-6 py-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {filteredParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-primary-dark cursor-pointer hover:text-primary hover:underline">
                      <Link href={`/parents/${parent.id}`}>
                        {parent.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      <span dir="ltr">{parent.phone || 'غير محدد'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-neutral-500 font-semibold">{parent.children_count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-accent font-semibold">{parent.active_children_count}</span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <span className="text-xs text-neutral-400">للاطلاع فقط</span>
                    </td>
                  </tr>
                ))}
                {filteredParents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                      لا يوجد أولياء أمور
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden flex flex-col gap-4">
          {filteredParents.map((parent) => (
            <div key={parent.id} className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 relative group">
              <div className="flex justify-between items-start mb-3">
                <Link href={`/parents/${parent.id}`}>
                  <h3 className="font-bold text-primary-dark text-lg cursor-pointer hover:text-primary transition-colors">
                    {parent.full_name}
                  </h3>
                </Link>
                <button onClick={() => handleDelete(parent.id)} className="text-semantic-error p-1">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-2 text-sm text-neutral-600 mb-4">
                <div className="flex items-center gap-2"><Phone size={16} className="text-primary" /> <span dir="ltr">{parent.phone}</span></div>
              </div>
              <div className="flex justify-between border-t border-neutral/30 pt-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">الأبناء</p>
                  <p className="font-semibold text-accent">{parent.children_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-neutral flex justify-between items-center">
              <h2 className="text-lg font-bold">إضافة ولي أمر جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-800">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الرباعي *</label>
                <input type="text" name="full_name" required className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رقم الجوال * (يستخدم لتسجيل الدخول)</label>
                <input type="tel" name="phone" required className="w-full h-10 px-3 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary text-left" dir="ltr" />
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة ولي الأمر'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
