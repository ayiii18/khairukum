'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Settings, Shield, UserCog, Sliders, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'الإعدادات العامة', icon: Sliders },
    { id: 'permissions', label: 'إدارة الصلاحيات', icon: Shield },
    { id: 'students', label: 'إعدادات الطلاب', icon: UserCog },
    { id: 'notifications', label: 'إعدادات الإشعارات', icon: Bell },
  ];

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral/30 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <Settings className="text-primary" size={28} />
              إعدادات النظام
            </h1>
            <p className="text-sm text-neutral-500 mt-1">إدارة وضبط إعدادات وصلاحيات النظام الشاملة</p>
          </div>
          <Button variant="primary" className="shadow-sm">حفظ التغييرات</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Sidebar */}
          <div className="md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-card border border-neutral/30 p-2 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    <Icon size={18} className={isActive ? 'text-primary' : 'text-neutral-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 bg-white p-6 rounded-xl shadow-card border border-neutral/30">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-primary-dark border-b border-neutral/30 pb-3">الإعدادات العامة للنظام</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-dark">اسم النظام</label>
                    <input type="text" defaultValue="نظام إدارة حلقات تحفيظ القرآن" className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-dark">البريد الإلكتروني للإدارة</label>
                    <input type="email" defaultValue="admin@quran.local" className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm text-left" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-dark">المنطقة الزمنية</label>
                    <select className="w-full h-10 px-3 rounded-md border border-neutral focus:ring-1 focus:ring-primary text-sm bg-white">
                      <option>توقيت مكة المكرمة (GMT+3)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-primary-dark border-b border-neutral/30 pb-3">إدارة الصلاحيات (Role-Based Matrix)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start">
                    <thead className="bg-neutral-light text-primary-dark font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-start">الصلاحية</th>
                        <th className="px-4 py-3 text-center">مدير النظام</th>
                        <th className="px-4 py-3 text-center">مشرف مسجد</th>
                        <th className="px-4 py-3 text-center">معلم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral/30">
                      {[
                        'إضافة/تعديل مساجد',
                        'إدارة الطلاب',
                        'تسجيل الحضور',
                        'تسجيل التقييمات',
                        'الاطلاع على التقارير المالية'
                      ].map((perm, i) => (
                        <tr key={i} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-600">{perm}</td>
                          <td className="px-4 py-3 text-center"><input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded border-neutral focus:ring-primary" /></td>
                          <td className="px-4 py-3 text-center"><input type="checkbox" defaultChecked={i === 1} className="w-4 h-4 text-primary rounded border-neutral focus:ring-primary" /></td>
                          <td className="px-4 py-3 text-center"><input type="checkbox" defaultChecked={i === 2 || i === 3} className="w-4 h-4 text-primary rounded border-neutral focus:ring-primary" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Other tabs omitted for brevity but follow same pattern */}
            {(activeTab === 'students' || activeTab === 'notifications') && (
              <div className="text-center text-neutral-500 py-12">
                <Settings size={48} className="mx-auto text-neutral-300 mb-4" />
                <p>إعدادات {tabs.find(t => t.id === activeTab)?.label} قيد التطوير...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
