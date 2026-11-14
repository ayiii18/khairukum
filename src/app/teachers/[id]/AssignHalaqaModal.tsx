'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Plus, X, Building2, BookOpen } from 'lucide-react';
import { assignTeacherToHalaqa } from '@/lib/actions/teachers';

interface HalaqaOption {
  id: string;
  name: string;
  mosque_name?: string;
}

export default function AssignHalaqaModal({
  teacherId,
  halaqat,
}: {
  teacherId: string;
  halaqat: HalaqaOption[];
}) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<string>('ALL');

  // Extract distinct mosques from halaqat
  const uniqueMosques = Array.from(
    new Set(halaqat.map((h) => h.mosque_name).filter(Boolean))
  ) as string[];

  const filteredHalaqat = halaqat.filter((h) => {
    if (selectedMosque === 'ALL') return true;
    return h.mosque_name === selectedMosque;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const halaqaId = formData.get('halaqa_id')?.toString();
    const isPrimary = formData.get('is_primary') === 'true';

    if (!halaqaId) {
      toast.warning('تنبيه', 'الرجاء اختيار الحلقة المراد إسنادها');
      setIsSubmitting(false);
      return;
    }

    try {
      await assignTeacherToHalaqa(teacherId, halaqaId, isPrimary);
      toast.success(
        'تم إسناد الحلقة بنجاح',
        isPrimary ? 'تم تعيين الحلقة كحلقة أساسية للمعلم' : 'تم إضافة الحلقة كحلقة مساندة'
      );
      setIsOpen(false);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الإسناد', err.message || 'تعذر إسناد الحلقة للمعلم');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors"
      >
        <Plus size={16} /> إسناد حلقة جديدة
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral/30">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral/40 flex justify-between items-center bg-neutral-light/50">
              <div className="flex items-center gap-2 text-primary-dark">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">إسناد حلقة للمعلم</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* تصفية المسجد (لتسهيل الاختيار) */}
              {uniqueMosques.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-primary-dark flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    تصفية حسب المسجد
                  </label>
                  <select
                    value={selectedMosque}
                    onChange={(e) => setSelectedMosque(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-neutral/60 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-sm"
                  >
                    <option value="ALL">جميع المساجد ({uniqueMosques.length})</option>
                    {uniqueMosques.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* اختيار الحلقة */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-primary-dark">
                  اختر الحلقة المراد إسنادها <span className="text-semantic-error">*</span>
                </label>
                <select
                  name="halaqa_id"
                  required
                  className="w-full h-11 px-3.5 rounded-lg border border-neutral/60 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-sm"
                >
                  <option value="">-- اختر الحلقة من القائمة --</option>
                  {filteredHalaqat.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.mosque_name ? `(${h.mosque_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* تعيين كحلقة أساسية */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral/30 bg-neutral-light/40">
                <input
                  type="checkbox"
                  name="is_primary"
                  value="true"
                  id="is_primary_h"
                  className="w-4 h-4 text-primary rounded border-neutral focus:ring-primary"
                />
                <label htmlFor="is_primary_h" className="text-sm font-medium text-primary-dark cursor-pointer">
                  تعيين كحلقة أساسية للمعلم (ملاحظة: المعلم يمتلك حلقة أساسية واحدة فقط)
                </label>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="pt-3 flex gap-3 justify-end border-t border-neutral/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الإسناد...' : 'تأكيد وحفظ الإسناد'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
