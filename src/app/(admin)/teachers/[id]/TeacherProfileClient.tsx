'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Building2,
  Trash2,
  Edit,
  X,
  Star,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/logger';
import { TeacherRow, TeacherHalaqaAssignment } from '@/lib/queries/teachers';
import {
  updateTeacher,
  deleteTeacher,
  removeTeacherFromHalaqa,
  setPrimaryHalaqa,
} from '@/lib/actions/teachers';
import AssignHalaqaModal from './AssignHalaqaModal';

interface Props {
  teacher: TeacherRow;
  assignments: TeacherHalaqaAssignment[];
  allHalaqat: { id: string; name: string; mosque_name?: string }[];
}

export default function TeacherProfileClient({
  teacher,
  assignments,
  allHalaqat,
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Handle Edit Teacher Data
  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateTeacher(teacher.id, formData);
      setIsEditModalOpen(false);
      toast.success('تم التحديث بنجاح', 'تم تحديث بيانات المعلم وتحديث الصفحة');
      router.refresh();
    } catch (err) {
      setEditError(errorMessage(err) || 'تعذر تعديل بيانات المعلم');
      toast.error('خطأ أثناء التعديل', errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Setting a Halaqa as Primary
  async function handleSetPrimary(halaqaId: string, halaqaName: string) {
    try {
      await setPrimaryHalaqa(teacher.id, halaqaId);
      toast.success('تم تغيير الحلقة الأساسية', `أصبحت "${halaqaName}" هي الحلقة الأساسية للمعلم.`);
      router.refresh();
    } catch (err) {
      toast.error('خطأ', errorMessage(err) || 'تعذر تغيير الحلقة الأساسية');
    }
  }

  // Handle Removing a Halaqa Assignment
  async function handleRemoveHalaqa(halaqaId: string, halaqaName: string) {
    if (
      confirm(
        `هل أنت متأكد من فك إسناد حلقة "${halaqaName}" من هذا المعلم؟\n(لن يتم حذف الحلقة، بل فك ارتباط المعلم بها فقط).`
      )
    ) {
      try {
        await removeTeacherFromHalaqa(teacher.id, halaqaId);
        toast.success('تم فك الإسناد', `تم إزالة حلقة "${halaqaName}" من سجل المعلم.`);
        router.refresh();
      } catch (err) {
        toast.error('خطأ أثناء الإلغاء', errorMessage(err) || 'تعذر فك ارتباط الحلقة');
      }
    }
  }

  // Handle Deleting Teacher
  async function handleDeleteTeacher() {
    if (
      confirm(
        `هل أنت متأكد من حذف المعلم "${teacher.full_name}"؟\nسيتم حذف حسابه وفك ارتباطه بجميع الحلقات، ولن يمكنك التراجع.`
      )
    ) {
      try {
        await deleteTeacher(teacher.id);
        toast.success('تم حذف المعلم', 'تم إزالة المعلم بنجاح.');
        router.push('/teachers');
        router.refresh();
      } catch (err) {
        toast.error('خطأ أثناء الحذف', errorMessage(err) || 'تعذر حذف المعلم');
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Back Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/teachers"
              className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
            >
              <ArrowRight size={14} /> العودة لقائمة المعلمين
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
            ملف المعلم: {teacher.full_name}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            إدارة بيانات المعلم وتعديل المساجد والحلقات المسندة إليه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditError(null);
              setIsEditModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Edit size={16} /> تعديل البيانات
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteTeacher}
            className="text-semantic-error hover:bg-rose-50 hover:text-rose-700 gap-1.5"
          >
            <Trash2 size={16} /> حذف المعلم
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teacher Info Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-neutral/30 shadow-card text-center">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary font-bold text-2xl border-2 border-primary/20">
              {teacher.full_name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-primary-dark">{teacher.full_name}</h2>
            <p className="text-neutral-500 text-xs mt-1 mb-4">معلم قرآن كريم معتمد</p>

            <div className="flex flex-col gap-3 text-sm text-start border-t border-neutral/30 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-xs flex items-center gap-1.5">
                  <Phone size={14} className="text-primary" /> رقم الجوال
                </span>
                <span dir="ltr" className="font-mono font-medium text-primary-dark text-xs">
                  {teacher.phone || 'غير مسجل'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" /> حالة الحساب
                </span>
                {teacher.is_active ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">
                    نشط
                  </span>
                ) : (
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold">
                    غير نشط
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-xs flex items-center gap-1.5">
                  <Star size={14} className="text-primary" /> تقييم الأداء
                </span>
                <span className="font-bold text-xs text-primary-dark">
                  {teacher.evaluation_score ? Number(teacher.evaluation_score).toFixed(1) : 'جديد'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Halaqat Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral/30 shadow-card">
            {/* Header with Assign Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-neutral/30">
              <div>
                <h3 className="font-bold text-primary-dark text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  الحلقات والمساجد المسندة ({assignments.length})
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  يمكنك تحديد وتعديل الحلقات والمساجد المسندة للمعلم في أي وقت.
                </p>
              </div>

              <AssignHalaqaModal teacherId={teacher.id} halaqat={allHalaqat} />
            </div>

            {/* List of Halaqat Cards */}
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((item) => (
                  <div
                    key={item.assignment_id}
                    className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      item.is_primary
                        ? 'border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20'
                        : 'border-neutral/40 bg-white hover:border-neutral/70 shadow-card'
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {item.is_primary ? (
                          <span className="inline-flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={12} /> الحلقة الأساسية
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-[11px] font-medium px-2 py-0.5 rounded-md">
                            حلقة مساندة
                          </span>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!item.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(item.halaqa_id, item.halaqa_name)}
                              className="text-[11px] text-primary hover:text-primary-dark font-semibold px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
                              title="جعل هذه الحلقة هي الحلقة الأساسية"
                            >
                              تعيين كأساسية
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveHalaqa(item.halaqa_id, item.halaqa_name)}
                            className="p-1 text-neutral-400 hover:text-semantic-error hover:bg-rose-50 rounded transition-colors"
                            title="فك إسناد الحلقة"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Halaqa & Mosque Info */}
                      <h4 className="font-quran text-xl font-bold text-primary-dark mt-1">
                        {item.halaqa_name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                        <Building2 size={13} className="text-primary" />
                        المسجد: <span className="font-medium text-neutral-700">{item.mosque_name}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-neutral/40 rounded-xl bg-neutral-light/40">
                <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-primary-dark">لا توجد حلقات مسندة لهذا المعلم حالياً</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  اضغط على زر &quot;إسناد حلقة جديدة&quot; بالأعلى لاختيار المسجد والحلقة وتعيينها له.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Teacher Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral/30">
            <div className="p-5 border-b border-neutral/40 flex justify-between items-center bg-neutral-light/50">
              <h2 className="text-lg font-bold text-primary-dark flex items-center gap-2">
                <Edit size={18} className="text-primary" /> تعديل بيانات المعلم
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  الاسم الرباعي <span className="text-semantic-error">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  defaultValue={teacher.full_name}
                  className="w-full h-11 px-3.5 rounded-lg border border-neutral/60 focus:border-primary text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  رقم الجوال <span className="text-semantic-error">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  dir="ltr"
                  defaultValue={teacher.phone || ''}
                  className="w-full h-11 px-3.5 rounded-lg border border-neutral/60 focus:border-primary text-sm text-end bg-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  id="edit_is_active"
                  defaultChecked={teacher.is_active}
                  className="w-4 h-4 text-primary rounded border-neutral"
                />
                <label htmlFor="edit_is_active" className="text-sm font-medium text-primary-dark cursor-pointer">
                  حساب المعلم نشط
                </label>
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-neutral/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
