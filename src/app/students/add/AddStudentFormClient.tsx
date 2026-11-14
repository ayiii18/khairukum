'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { addStudent } from '@/lib/actions/students';
import {
  UserPlus,
  Building2,
  BookOpen,
  Phone,
  User,
  UsersRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface MosqueOption {
  id: string;
  name: string;
}

interface HalaqaOption {
  id: string;
  name: string;
  mosque_name: string;
}

interface Props {
  mosques: MosqueOption[];
  halaqat: HalaqaOption[];
}

export default function AddStudentFormClient({ mosques, halaqat }: Props) {
  const router = useRouter();
  const toast = useToast();

  // Form States
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [studentPhone, setStudentPhone] = useState('');
  const [selectedMosque, setSelectedMosque] = useState('');
  const [selectedHalaqa, setSelectedHalaqa] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [relationship, setRelationship] = useState('father');

  // UI / Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter halaqat based on selected mosque
  const selectedMosqueObj = mosques.find((m) => m.id === selectedMosque);
  const filteredHalaqat = halaqat.filter(
    (h) => selectedMosqueObj && h.mosque_name === selectedMosqueObj.name
  );

  // Helper to clear errors for a field when user modifies it
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  // Client-side validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Student full name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.full_name = 'الاسم الرباعي للطالب مطلوب';
    } else if (trimmedName.length < 3) {
      errors.full_name = 'اسم الطالب يجب أن يكون 3 أحرف على الأقل';
    } else if (trimmedName.split(/\s+/).length < 2) {
      errors.full_name = 'يرجى إدخال الاسم الأول واسم العائلة على الأقل';
    }

    // 2. Student phone (optional)
    if (studentPhone.trim()) {
      const cleanPhone = studentPhone.trim().replace(/\s+/g, '');
      if (cleanPhone.length > 20) {
        errors.phone = 'رقم الهاتف يجب ألا يتجاوز 20 رقماً';
      } else if (!/^[0-9+\-]+$/.test(cleanPhone) || cleanPhone.replace(/\D/g, '').length < 8) {
        errors.phone = 'صيغة رقم الهاتف غير صحيحة';
      }
    }

    // 3. Mosque & Halaqa
    if (!selectedMosque) {
      errors.mosque_id = 'الرجاء اختيار المسجد';
    }
    if (!selectedHalaqa) {
      errors.halaqa_id = 'الرجاء اختيار الحلقة التابعة للمسجد';
    }

    // 4. Parent phone
    const cleanParentPhone = parentPhone.trim().replace(/\s+/g, '');
    if (!cleanParentPhone) {
      errors.parent_phone = 'رقم جوال ولي الأمر مطلوب للتواصل';
    } else if (cleanParentPhone.length > 20) {
      errors.parent_phone = 'رقم الجوال يجب ألا يتجاوز 20 رقماً';
    } else if (
      !/^[0-9+\-]+$/.test(cleanParentPhone) ||
      cleanParentPhone.replace(/\D/g, '').length < 9
    ) {
      errors.parent_phone = 'يرجى إدخال رقم جوال صحيح (مثال: 05xxxxxxxx)';
    }

    // 5. Parent name
    if (!parentName.trim()) {
      errors.parent_name = 'اسم ولي الأمر مطلوب';
    } else if (parentName.trim().length < 3) {
      errors.parent_name = 'اسم ولي الأمر يجب أن يكون 3 أحرف على الأقل';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    // Run client validation first
    const isValid = validateForm();
    if (!isValid) {
      toast.error('بيانات غير مكتملة', 'يرجى التحقق من الحقول المحددة وتصحيح الأخطاء.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('full_name', fullName.trim());
    formData.append('gender', gender);
    if (studentPhone.trim()) {
      formData.append('phone', studentPhone.trim());
    }
    formData.append('halaqa_id', selectedHalaqa);
    formData.append('parent_phone', parentPhone.trim());
    formData.append('parent_name', parentName.trim());
    formData.append('relationship', relationship);

    try {
      const res = await addStudent(formData);

      if (!res.success) {
        setIsSubmitting(false);
        setGeneralError(res.error || 'فشلت عملية الحفظ.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.error('خطأ أثناء التسجيل', res.error || 'تعذر حفظ بيانات الطالب.');
        return;
      }

      // Success Feedback!
      setSuccessMessage(res.message || 'تم تسجيل الطالب بنجاح!');
      toast.success('تمت العملية بنجاح', res.message || 'تم تسجيل الطالب وربطه بالحلقة.');

      // Smooth redirection to students list
      setTimeout(() => {
        router.push('/students');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      const errMsg = err?.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.';
      setGeneralError(errMsg);
      toast.error('خطأ غير متوقع', errMsg);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-primary" />
            إضافة طالب جديد
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            إدخال وتوثيق بيانات الطالب الأكاديمية والشخصية وربطه بالحلقة وولي الأمر.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/students')}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-2 rounded-lg hover:bg-neutral-light"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة الطلاب
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-emerald-950">{successMessage}</p>
            <p className="text-xs text-emerald-700 mt-0.5">جاري التحويل تلقائياً لقائمة الطلاب...</p>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-start gap-3 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950">تنبيه أثناء حفظ البيانات</p>
            <p className="text-sm text-rose-800 mt-1">{generalError}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl shadow-card border border-neutral/30 p-6 md:p-8 space-y-8"
      >
        {/* القسم الأول: بيانات الطالب */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral/40 pb-2.5">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary-dark">البيانات الشخصية للطالب</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* الاسم الرباعي */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                الاسم الرباعي <span className="text-semantic-error">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('full_name');
                }}
                placeholder="مثال: أحمد محمد علي الغامدي"
                maxLength={100}
                disabled={isSubmitting || !!successMessage}
                className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white ${
                  fieldErrors.full_name
                    ? 'border-semantic-error focus:ring-semantic-error/30 text-rose-950'
                    : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                }`}
              />
              {fieldErrors.full_name && (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.full_name}
                </p>
              )}
            </div>

            {/* الجنس */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                الجنس <span className="text-semantic-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 h-11">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  disabled={isSubmitting || !!successMessage}
                  className={`flex items-center justify-center font-medium text-sm rounded-lg border transition-all ${
                    gender === 'MALE'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-neutral/60 bg-white text-neutral-600 hover:bg-neutral-light'
                  }`}
                >
                  ذكر (بنين)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  disabled={isSubmitting || !!successMessage}
                  className={`flex items-center justify-center font-medium text-sm rounded-lg border transition-all ${
                    gender === 'FEMALE'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-neutral/60 bg-white text-neutral-600 hover:bg-neutral-light'
                  }`}
                >
                  أنثى (بنات)
                </button>
              </div>
            </div>

            {/* رقم هاتف الطالب */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-primary-dark">
                رقم هاتف الطالب <span className="text-xs text-neutral-500 font-normal">(اختياري - للطلاب الكبار)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={studentPhone}
                  onChange={(e) => {
                    setStudentPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  placeholder="05xxxxxxxx"
                  maxLength={20}
                  disabled={isSubmitting || !!successMessage}
                  className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-end bg-white ${
                    fieldErrors.phone
                      ? 'border-semantic-error focus:ring-semantic-error/30 text-rose-950'
                      : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.phone}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* القسم الثاني: البيانات الأكاديمية والتسجيل */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral/40 pb-2.5">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary-dark">البيانات الأكاديمية والتسكين</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* اختيار المسجد */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                المسجد <span className="text-semantic-error">*</span>
              </label>
              <select
                value={selectedMosque}
                onChange={(e) => {
                  setSelectedMosque(e.target.value);
                  setSelectedHalaqa('');
                  clearFieldError('mosque_id');
                  clearFieldError('halaqa_id');
                }}
                disabled={isSubmitting || !!successMessage}
                className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white ${
                  fieldErrors.mosque_id
                    ? 'border-semantic-error focus:ring-semantic-error/30'
                    : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                }`}
              >
                <option value="">اختر المسجد أو المجمع</option>
                {mosques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {fieldErrors.mosque_id && (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.mosque_id}
                </p>
              )}
            </div>

            {/* اختيار الحلقة */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                الحلقة <span className="text-semantic-error">*</span>
              </label>
              <select
                value={selectedHalaqa}
                onChange={(e) => {
                  setSelectedHalaqa(e.target.value);
                  clearFieldError('halaqa_id');
                }}
                disabled={!selectedMosque || isSubmitting || !!successMessage}
                className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white disabled:bg-neutral-100 disabled:text-neutral-400 ${
                  fieldErrors.halaqa_id
                    ? 'border-semantic-error focus:ring-semantic-error/30'
                    : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                }`}
              >
                <option value="">
                  {selectedMosque
                    ? filteredHalaqat.length > 0
                      ? 'اختر الحلقة المناسبة'
                      : 'لا توجد حلقات مسجلة لهذا المسجد'
                    : 'اختر المسجد أولاً لعرض الحلقات'}
                </option>
                {filteredHalaqat.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {fieldErrors.halaqa_id && (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.halaqa_id}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* القسم الثالث: بيانات ولي الأمر */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral/40 pb-2.5">
            <UsersRound className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary-dark">بيانات ولي الأمر والاتصال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* جوال ولي الأمر */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                رقم جوال ولي الأمر <span className="text-semantic-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={parentPhone}
                  onChange={(e) => {
                    setParentPhone(e.target.value);
                    clearFieldError('parent_phone');
                  }}
                  placeholder="05xxxxxxxx"
                  maxLength={15}
                  disabled={isSubmitting || !!successMessage}
                  className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-end bg-white ${
                    fieldErrors.parent_phone
                      ? 'border-semantic-error focus:ring-semantic-error/30 text-rose-950'
                      : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {fieldErrors.parent_phone ? (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.parent_phone}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">يستخدم للدخول والتواصل مع ولي الأمر ومتابعة الحفظ.</p>
              )}
            </div>

            {/* اسم ولي الأمر */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-dark">
                اسم ولي الأمر <span className="text-semantic-error">*</span>
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => {
                  setParentName(e.target.value);
                  clearFieldError('parent_name');
                }}
                placeholder="مثال: محمد علي الغامدي"
                maxLength={100}
                disabled={isSubmitting || !!successMessage}
                className={`w-full h-11 px-3.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white ${
                  fieldErrors.parent_name
                    ? 'border-semantic-error focus:ring-semantic-error/30 text-rose-950'
                    : 'border-neutral/60 focus:border-primary focus:ring-primary/20'
                }`}
              />
              {fieldErrors.parent_name && (
                <p className="text-xs text-semantic-error flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.parent_name}
                </p>
              )}
            </div>

            {/* صلة القرابة */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-primary-dark">
                صلة القرابة بالطالب <span className="text-semantic-error">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'father', label: 'أب' },
                  { id: 'mother', label: 'أم' },
                  { id: 'brother', label: 'أخ / أخت' },
                  { id: 'other', label: 'ولي أمر آخر' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRelationship(item.id)}
                    disabled={isSubmitting || !!successMessage}
                    className={`h-10 text-sm font-medium rounded-lg border transition-all ${
                      relationship === item.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-neutral/60 bg-white text-neutral-600 hover:bg-neutral-light'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* أزرار الحفظ والإلغاء مع حالة التحميل */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral/40">
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting || !!successMessage}
            onClick={() => router.push('/students')}
          >
            إلغاء
          </Button>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting || !!successMessage}
            className="min-w-[140px]"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الطالب'}
          </Button>
        </div>
      </form>
    </div>
  );
}
