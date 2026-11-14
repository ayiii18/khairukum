'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { User, Mail, Phone, Lock, ShieldCheck, Activity } from 'lucide-react';

export default function ProfilePage() {
  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">الملف الشخصي</h1>
            <p className="text-sm text-neutral-500 mt-1">إدارة حسابك الشخصي وإعدادات الأمان</p>
          </div>
          <Button variant="primary" className="shadow-sm">حفظ التعديلات</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card text-center">
              <div className="w-24 h-24 mx-auto bg-primary-dark text-white rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                م
              </div>
              <h2 className="text-xl font-bold text-primary-dark mb-1">مدير النظام</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-4">
                <ShieldCheck size={14} /> سوبر أدمن
              </span>
              
              <div className="flex flex-col gap-3 text-sm text-start border-t border-neutral/30 pt-4">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-primary" />
                  <span dir="ltr" className="font-medium text-primary-dark">+966 50 000 0000</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-primary" />
                  <span className="font-medium text-primary-dark text-left" dir="ltr">admin@quran.local</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings & Activity */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Details Form */}
            <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card space-y-4">
              <h3 className="font-semibold text-primary-dark text-lg border-b border-neutral/30 pb-3">البيانات الشخصية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600">الاسم الكامل</label>
                  <input type="text" defaultValue="مدير النظام" className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600">رقم الجوال</label>
                  <input type="tel" defaultValue="0500000000" className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-left" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral/30 pb-3">
                <Lock size={20} className="text-primary" />
                <h3 className="font-semibold text-primary-dark text-lg">تغيير كلمة المرور</h3>
              </div>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600">كلمة المرور الحالية</label>
                  <input type="password" placeholder="••••••••" className="w-full sm:w-1/2 h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-left" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600">كلمة المرور الجديدة</label>
                  <input type="password" placeholder="••••••••" className="w-full sm:w-1/2 h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-left" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl border border-neutral/30 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral/30 pb-3">
                <Activity size={20} className="text-primary" />
                <h3 className="font-semibold text-primary-dark text-lg">آخر النشاطات</h3>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary-dark font-medium">تسجيل الدخول للنظام</span>
                  <span className="text-neutral-500" dir="ltr">2023-10-25 10:00 AM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary-dark font-medium">تغيير إعدادات صلاحيات المشرفين</span>
                  <span className="text-neutral-500" dir="ltr">2023-10-24 02:15 PM</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
