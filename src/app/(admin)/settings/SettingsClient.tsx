'use client';

import React, { useState, useTransition } from 'react';
import { Settings, Shield, UserCog, Sliders, Bell, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { updateSettings } from '@/lib/actions/settings';
import type { AppSettings } from '@/lib/queries/settings';

const TABS = [
  { id: 'general', label: 'الإعدادات العامة', icon: Sliders },
  { id: 'permissions', label: 'الأمان والجلسات', icon: Shield },
  { id: 'students', label: 'إعدادات الطلاب', icon: UserCog },
  { id: 'notifications', label: 'إعدادات الإشعارات', icon: Bell },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsClient({ settings }: { settings: AppSettings }) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success('تم الحفظ', result.message);
      } else {
        toast.error('تعذر الحفظ', result.error);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
            <Settings className="text-primary" size={28} />
            إعدادات النظام
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            إدارة وضبط إعدادات الجمعية والإشعارات والأمان — تُحفظ في قاعدة البيانات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1 space-y-1" aria-label="أقسام الإعدادات">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-start ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-charcoal-700 hover:bg-beige-50 border border-neutral/30'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl border border-neutral/40 shadow-sm p-6 space-y-5">
          {activeTab === 'general' && (
            <>
              <h2 className="text-base font-bold text-primary-dark">بيانات الجمعية</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="organization_name" className="block text-xs font-bold text-neutral-600 mb-1.5">اسم الجمعية</label>
                  <input id="organization_name" name="organization_name" defaultValue={settings.organization.name} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" required />
                </div>
                <div>
                  <label htmlFor="organization_email" className="block text-xs font-bold text-neutral-600 mb-1.5">البريد الإلكتروني</label>
                  <input id="organization_email" name="organization_email" type="email" dir="ltr" defaultValue={settings.organization.email} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
                </div>
                <div>
                  <label htmlFor="organization_phone" className="block text-xs font-bold text-neutral-600 mb-1.5">هاتف التواصل</label>
                  <input id="organization_phone" name="organization_phone" type="tel" dir="ltr" defaultValue={settings.organization.phone} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'permissions' && (
            <>
              <h2 className="text-base font-bold text-primary-dark">الأمان والجلسات</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sessionDays" className="block text-xs font-bold text-neutral-600 mb-1.5">مدة الجلسة (أيام)</label>
                  <input id="sessionDays" name="sessionDays" type="number" min={1} max={30} defaultValue={settings.security.sessionDays} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
                </div>
                <div>
                  <label htmlFor="maxLoginAttempts" className="block text-xs font-bold text-neutral-600 mb-1.5">حد محاولات الدخول</label>
                  <input id="maxLoginAttempts" name="maxLoginAttempts" type="number" min={3} max={20} defaultValue={settings.security.maxLoginAttempts} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                كلمات المرور مشفرة عبر pgcrypto، والجلسات موقعة بـ JWT داخل كوكي httpOnly، وكل إجراء إداري يتحقق من الصلاحية على الخادم.
              </p>
            </>
          )}

          {activeTab === 'students' && (
            <>
              <h2 className="text-base font-bold text-primary-dark">إعدادات الطلاب</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="defaultEnrollmentStatus" className="block text-xs font-bold text-neutral-600 mb-1.5">حالة التسجيل الافتراضية</label>
                  <select id="defaultEnrollmentStatus" name="defaultEnrollmentStatus" defaultValue={settings.students.defaultEnrollmentStatus} className="w-full h-11 px-3 rounded-xl border border-neutral/50 bg-white text-sm">
                    <option value="ACTIVE">نشط</option>
                    <option value="SUSPENDED">موقوف</option>
                    <option value="COMPLETED">مكتمل</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 mt-6 text-sm text-charcoal-700">
                  <input type="checkbox" name="requireParentPhone" defaultChecked={settings.students.requireParentPhone} className="w-4 h-4 accent-primary" />
                  إلزام رقم ولي الأمر عند التسجيل
                </label>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2 className="text-base font-bold text-primary-dark">إعدادات الإشعارات</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-charcoal-700">
                  <input type="checkbox" name="absenceAlerts" defaultChecked={settings.notifications.absenceAlerts} className="w-4 h-4 accent-primary" />
                  تنبيهات الغياب المتكرر
                </label>
                <label className="flex items-center gap-3 text-sm text-charcoal-700">
                  <input type="checkbox" name="weeklyReport" defaultChecked={settings.notifications.weeklyReport} className="w-4 h-4 accent-primary" />
                  التقرير الأسبوعي للإدارة
                </label>
                <label className="flex items-center gap-3 text-sm text-charcoal-700">
                  <input type="checkbox" name="newStudentAlert" defaultChecked={settings.notifications.newStudentAlert} className="w-4 h-4 accent-primary" />
                  إشعار عند تسجيل طالب جديد
                </label>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-neutral/30 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              <span>{isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
