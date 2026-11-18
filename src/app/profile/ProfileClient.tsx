'use client';

import React, { useTransition } from 'react';
import { User, Phone, Lock, ShieldCheck, Activity, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { updateProfile, changePassword } from '@/lib/actions/auth';

interface ProfileSession {
  name: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'مدير النظام',
  TEACHER: 'معلم',
  PARENT: 'ولي أمر',
  STUDENT: 'طالب',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

export default function ProfileClient({ session }: { session: ProfileSession }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) toast.success('تم الحفظ', result.message);
      else toast.error('تعذر الحفظ', result.error);
    });
  };

  const handlePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.success) {
        toast.success('تم التحديث', result.message);
        form.reset();
      } else {
        toast.error('تعذر تغيير كلمة المرور', result.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm text-center">
          <div className="w-24 h-24 mx-auto bg-primary-dark text-white rounded-full flex items-center justify-center mb-4 text-3xl font-black">
            {session.name.charAt(0) || 'م'}
          </div>
          <h2 className="text-lg font-bold text-primary-dark">{session.name}</h2>
          <p className="text-sm text-primary font-semibold mt-1">{ROLE_NAMES[session.role] ?? session.role}</p>
          <p className="text-xs text-neutral-500 mt-2" dir="ltr">{session.phone}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral/40 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-2"><ShieldCheck size={14} /> حالة الأمان</span>
            <span className={`font-bold ${session.mustChangePassword ? 'text-amber-600' : 'text-emerald-600'}`}>
              {session.mustChangePassword ? 'يتطلب تغيير كلمة المرور' : 'محمي'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-2"><Activity size={14} /> آخر دخول</span>
            <span className="font-bold text-charcoal-800">{formatDate(session.lastLoginAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">تاريخ الإنشاء</span>
            <span className="font-bold text-charcoal-800">{formatDate(session.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-6">
        <form onSubmit={handleProfile} className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-primary-dark flex items-center gap-2">
            <User size={18} className="text-primary" /> البيانات الشخصية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-bold text-neutral-600 mb-1.5">الاسم الكامل</label>
              <input id="full_name" name="full_name" defaultValue={session.name} required minLength={3} maxLength={100} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-neutral-600 mb-1.5">رقم الهاتف</label>
              <div className="relative">
                <Phone size={15} className="absolute top-3.5 start-3 text-charcoal-400" />
                <input id="phone" name="phone" type="tel" dir="ltr" defaultValue={session.phone} required className="w-full h-11 ps-9 pe-3 rounded-xl border border-neutral/50 bg-white text-sm font-mono" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60">
              <Save size={16} />
              {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePassword} className="bg-white p-6 rounded-2xl border border-neutral/40 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-primary-dark flex items-center gap-2">
            <Lock size={18} className="text-primary" /> تغيير كلمة المرور
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="current_password" className="block text-xs font-bold text-neutral-600 mb-1.5">كلمة المرور الحالية</label>
              <input id="current_password" name="current_password" type="password" autoComplete="current-password" required className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-xs font-bold text-neutral-600 mb-1.5">كلمة المرور الجديدة</label>
              <input id="new_password" name="new_password" type="password" autoComplete="new-password" required minLength={8} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-xs font-bold text-neutral-600 mb-1.5">تأكيد كلمة المرور</label>
              <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required minLength={8} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
            </div>
          </div>
          <p className="text-xs text-neutral-500">يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حروف وأرقام.</p>
          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal-800 text-white font-bold text-sm hover:bg-charcoal-900 transition-colors disabled:opacity-60">
              <ShieldCheck size={16} />
              {isPending ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
