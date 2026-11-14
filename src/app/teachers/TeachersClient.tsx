'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  Filter,
  ChevronLeft,
  MoreVertical,
  Star,
  ShieldCheck,
  X,
  Trash2,
  RotateCcw,
  Building2,
  BookOpen,
  Phone,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { TeacherRow } from '@/lib/queries/teachers';
import { addTeacher, deleteTeacher } from '@/lib/actions/teachers';

interface HalaqaOption {
  id: string;
  name: string;
  mosque_name: string;
}

interface Props {
  initialTeachers: TeacherRow[];
  mosques?: { id: string; name: string }[];
  halaqat?: HalaqaOption[];
}

export default function TeachersClient({
  initialTeachers,
  mosques = [],
  halaqat = [],
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const [teachers, setTeachers] = useState<TeacherRow[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMosque, setSelectedMosque] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addMosqueId, setAddMosqueId] = useState('');
  const [addHalaqaId, setAddHalaqaId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Keep state in sync with server revalidations
  useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);

  const isFiltered = Boolean(searchQuery || selectedMosque || selectedStatus !== 'ALL');

  const filteredTeachers = teachers.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesName = t.full_name?.toLowerCase().includes(q);
      const matchesIqama = t.iqama?.includes(q);
      const matchesPhone = t.phone?.includes(q);
      if (!matchesName && !matchesIqama && !matchesPhone) return false;
    }

    if (selectedMosque && t.mosque_name !== selectedMosque) {
      return false;
    }

    if (selectedStatus === 'ACTIVE' && !t.is_active) return false;
    if (selectedStatus === 'INACTIVE' && t.is_active) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMosque('');
    setSelectedStatus('ALL');
  };

  // Filter halaqat for Add Modal based on chosen mosque
  const selectedAddMosqueObj = mosques.find((m) => m.id === addMosqueId);
  const addFilteredHalaqat = halaqat.filter((h) => {
    if (!selectedAddMosqueObj) return false;
    return h.mosque_name === selectedAddMosqueObj.name;
  });

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('full_name')?.toString()?.trim();
    const phone = formData.get('phone')?.toString()?.trim();

    if (!fullName || fullName.length < 3) {
      setFormError('الرجاء إدخال الاسم الرباعي للمعلم كاملاً');
      setIsSubmitting(false);
      return;
    }

    if (!phone) {
      setFormError('رقم الجوال مطلوب');
      setIsSubmitting(false);
      return;
    }

    try {
      await addTeacher(formData);
      setIsAddModalOpen(false);
      setAddMosqueId('');
      setAddHalaqaId('');
      toast.success(
        'تمت إضافة المعلم بنجاح',
        addHalaqaId
          ? 'تم تسجيل المعلم وإسناد الحلقة المحددة له كحلقة أساسية.'
          : 'تم تسجيل المعلم في النظام، ويمكنك إسناد حلقات له لاحقاً.'
      );
      router.refresh();
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'تعذر حفظ بيانات المعلم';
      setFormError(msg);
      toast.error('حدث خطأ أثناء إضافة المعلم', msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      confirm(
        `هل أنت متأكد من حذف المعلم "${name}"؟\nسيتم فك ارتباطه بجميع الحلقات وحذف حسابه بشكل نهائي.`
      )
    ) {
      try {
        // Immediately remove from UI to prevent clicking a deleted teacher (which leads to 404)
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        await deleteTeacher(id);
        toast.success('تم حذف المعلم', `تم إزالة سجل المعلم "${name}" بنجاح`);
        router.refresh();
      } catch (err: any) {
        toast.error('خطأ أثناء الحذف', err.message || 'تعذر إتمام عملية الحذف');
        router.refresh();
      }
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
              <ShieldCheck className="text-primary" size={28} />
              المعلمون
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              إدارة معلمي الحلقات وتعيين المساجد ومتابعة بياناتهم وحلقاتهم
            </p>
          </div>
          <Button
            variant="primary"
            className="shadow-sm gap-2"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            <UserPlus size={18} />
            إضافة معلم جديد
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-card border border-neutral/30 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute top-2.5 start-3 text-neutral-400" />
            <input
              type="text"
              placeholder="البحث بالاسم أو رقم الجوال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 ps-10 pe-4 rounded-md border border-neutral focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-neutral-light text-primary-dark font-semibold border-b border-neutral">
                <tr>
                  <th className="px-6 py-4 text-start">المعلم</th>
                  <th className="px-6 py-4 text-start">رقم الجوال</th>
                  <th className="px-6 py-4 text-start">الحلقة الأساسية</th>
                  <th className="px-6 py-4 text-start">المسجد</th>
                  <th className="px-6 py-4 text-start">الحالة</th>
                  <th className="px-6 py-4 text-start">التقييم</th>
                  <th className="px-6 py-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral/50">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {teacher.full_name?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <Link
                            href={`/teachers/${teacher.id}`}
                            className="font-bold text-primary-dark hover:text-primary hover:underline transition-colors block"
                          >
                            {teacher.full_name}
                          </Link>
                          {teacher.secondary_halaqat_names?.length > 0 && (
                            <span className="text-[11px] text-neutral-500">
                              + {teacher.secondary_halaqat_names.length} حلقات مساندة
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4" dir="ltr">
                      <span className="font-mono text-neutral-600">{teacher.phone || '-'}</span>
                    </td>

                    <td className="px-6 py-4">
                      {teacher.primary_halaqa_name ? (
                        <span className="font-quran text-base text-primary font-semibold">
                          {teacher.primary_halaqa_name}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                          غير مسند لحلقة
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-neutral-600">
                      {teacher.mosque_name || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {teacher.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full w-fit">
                        <Star size={14} className="fill-current" />
                        {teacher.evaluation_score
                          ? Number(teacher.evaluation_score).toFixed(1)
                          : 'جديد'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="حذف المعلم"
                          className="p-1.5 text-neutral-400 hover:text-semantic-error hover:bg-rose-50 rounded-lg transition-colors"
                          onClick={() => handleDelete(teacher.id, teacher.full_name)}
                        >
                          <Trash2 size={17} />
                        </button>
                        <Link href={`/teachers/${teacher.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-600 hover:text-primary bg-neutral-100/80 hover:bg-neutral-100 text-xs gap-1"
                          >
                            <ChevronLeft size={16} /> عرض وتعديل
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      لا يوجد معلمين مطابقين للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal with Mosque & Halaqa Assignment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral/30">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral/40 flex justify-between items-center bg-neutral-light/50">
              <div className="flex items-center gap-2 text-primary-dark">
                <UserPlus className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">إضافة معلم جديد</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* الاسم الرباعي */}
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  الاسم الرباعي <span className="text-semantic-error">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute top-3 start-3" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    placeholder="مثال: خالد بن إبراهيم العتيبي"
                    className="w-full h-11 ps-9 pe-3 rounded-lg border border-neutral/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-white"
                  />
                </div>
              </div>

              {/* رقم الجوال */}
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  رقم الجوال <span className="text-semantic-error">*</span>{' '}
                  <span className="text-xs text-neutral-400">(يستخدم لتسجيل الدخول)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute top-3 start-3" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    dir="ltr"
                    maxLength={20}
                    placeholder="05xxxxxxxx"
                    className="w-full h-11 ps-9 pe-3 rounded-lg border border-neutral/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-end bg-white font-mono"
                  />
                </div>
              </div>

              {/* اختيار المسجد (لتسهيل التسكين مباشرة) */}
              <div className="pt-2 border-t border-neutral/30">
                <div className="flex items-center gap-1.5 mb-2 text-primary font-semibold text-xs">
                  <Building2 size={14} />
                  <span>إسناد الحلقة والمسجد (اختياري - يمكنك تعيينها الآن أو لاحقاً)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      المسجد التابع له
                    </label>
                    <select
                      value={addMosqueId}
                      onChange={(e) => {
                        setAddMosqueId(e.target.value);
                        setAddHalaqaId('');
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-neutral/60 focus:border-primary text-xs bg-white"
                    >
                      <option value="">اختر المسجد...</option>
                      {mosques.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      الحلقة التابعة له
                    </label>
                    <select
                      name="halaqa_id"
                      value={addHalaqaId}
                      onChange={(e) => setAddHalaqaId(e.target.value)}
                      disabled={!addMosqueId}
                      className="w-full h-10 px-3 rounded-lg border border-neutral/60 focus:border-primary text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                      <option value="">
                        {addMosqueId
                          ? addFilteredHalaqat.length > 0
                            ? 'اختر الحلقة...'
                            : 'لا توجد حلقات مسجلة لهذا المسجد'
                          : 'اختر المسجد أولاً'}
                      </option>
                      {addFilteredHalaqat.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* حالة النشاط */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  id="is_active_t"
                  defaultChecked
                  className="w-4 h-4 text-primary rounded border-neutral"
                />
                <label htmlFor="is_active_t" className="text-sm font-medium text-primary-dark cursor-pointer">
                  حساب المعلم نشط في النظام
                </label>
              </div>

              {/* أزرار الإجراء */}
              <div className="pt-4 flex gap-2 justify-end border-t border-neutral/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة المعلم وحفظ البيانات'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
