'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export default function MosqueDetailsPage() {
  return (
    <>
      <div className="space-y-6">
        {/* Top Bar / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-neutral-500 hover:text-primary">إدارة المحتوى</Link>
          <span className="text-neutral-500">/</span>
          <Link href="/mosques" className="text-neutral-500 hover:text-primary">المساجد</Link>
          <span className="text-neutral-500">/</span>
          <span className="font-semibold text-primary-dark">جامع الملك فهد</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/mosques">
              <Button variant="outline" size="sm" className="px-2">
                <ArrowRight size={20} className="rtl:-scale-x-100" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary-dark">جامع الملك فهد</h1>
            <span className="bg-semantic-success/10 text-semantic-success px-2.5 py-1 rounded-full text-xs font-medium">نشط</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">تعديل</Button>
            <Button variant="outline" className="flex-1 sm:flex-none border-semantic-error text-semantic-error hover:bg-semantic-error/10">تعطيل المسجد</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-neutral/30 shadow-card flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><BookOpen size={24} /></div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">إجمالي الحلقات</p>
              <p className="text-xl font-bold text-primary-dark">12</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-neutral/30 shadow-card flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg text-accent"><Users size={24} /></div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">إجمالي الطلاب</p>
              <p className="text-xl font-bold text-primary-dark">150</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-neutral/30 shadow-card h-fit">
            <h3 className="font-semibold text-primary-dark text-lg mb-4 border-b border-neutral/30 pb-4">المعلومات الأساسية</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-neutral-500 mb-1">الموقع</p>
                <p className="font-medium text-primary-dark">حي العليا، الرياض</p>
              </div>
              <div>
                <p className="text-neutral-500 mb-1">رقم التواصل</p>
                <p className="font-medium text-primary-dark" dir="ltr">+966 50 123 4567</p>
              </div>
              <div>
                <p className="text-neutral-500 mb-1">الوصف</p>
                <p className="font-medium text-neutral-600 leading-relaxed">
                  جامع رئيسي يضم العديد من الحلقات المسائية لمختلف المستويات العمرية.
                </p>
              </div>
            </div>
          </div>

          {/* Halaqat List within Mosque */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral/30 shadow-card overflow-hidden">
            <div className="p-6 border-b border-neutral/30 flex justify-between items-center">
              <h3 className="font-semibold text-primary-dark text-lg">الحلقات التابعة (12)</h3>
              <button className="text-primary text-sm font-medium hover:underline">عرض الكل</button>
            </div>
            <div className="divide-y divide-neutral/50">
              {/* Example item */}
              <div className="p-4 hover:bg-neutral-50 flex justify-between items-center transition-colors cursor-pointer" onClick={() => window.location.href = '/halaqat'}>
                <div>
                  <p className="font-medium text-primary-dark mb-1">حلقة الإمام الشاطبي</p>
                  <p className="text-xs text-neutral-500">المعلم: أحمد عبدالله • 15 طالب</p>
                </div>
                <span className="bg-semantic-success/10 text-semantic-success px-2 py-1 rounded text-xs font-medium">نشط</span>
              </div>
              <div className="p-4 hover:bg-neutral-50 flex justify-between items-center transition-colors cursor-pointer" onClick={() => window.location.href = '/halaqat'}>
                <div>
                  <p className="font-medium text-primary-dark mb-1">حلقة ابن كثير</p>
                  <p className="text-xs text-neutral-500">المعلم: محمد صالح • 20 طالب</p>
                </div>
                <span className="bg-semantic-success/10 text-semantic-success px-2 py-1 rounded text-xs font-medium">نشط</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
