'use client';
import React, { useState } from 'react';
import { Bell, AlertCircle, CheckCircle, Info, Filter, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotificationsPage() {
  const [items, setItems] = useState([
    { id: 1, type: 'administrative', title: 'تنبيه غياب متكرر', content: 'الطالب أحمد محمد لديه غياب متكرر في حلقة الإمام عاصم (3 أيام متتالية).', date: 'منذ 15 دقيقة', read: false },
    { id: 2, type: 'student', title: 'تمت إضافة طالب جديد', content: 'تم بنجاح إضافة الطالب "عمر خالد" إلى جامع الملك فهد.', date: 'منذ ساعتين', read: true },
    { id: 3, type: 'attendance', title: 'تسجيل الحضور', content: 'قام المعلم أحمد عبدالله برفع سجل الحضور لليوم.', date: 'اليوم، 10:00 ص', read: true },
    { id: 4, type: 'system', title: 'صيانة النظام', content: 'سيتم إيقاف النظام للصيانة غداً من الساعة 2ص وحتى 4ص.', date: 'أمس', read: true },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'administrative' | 'student' | 'attendance' | 'system'>('all');

  const filteredNotifications = items.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter !== 'all') return n.type === activeFilter;
    return true;
  });

  const markAllAsRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setItems(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'administrative': return <AlertCircle className="text-semantic-warning" size={24} />;
      case 'student': return <CheckCircle className="text-semantic-success" size={24} />;
      case 'attendance': return <Info className="text-primary" size={24} />;
      case 'system': return <Bell className="text-accent" size={24} />;
      default: return <Bell className="text-neutral-400" size={24} />;
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <Bell className="text-primary" size={28} />
              مركز الإشعارات
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              متابعة جميع التنبيهات والإشعارات الصادرة في النظام
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button 
               variant="outline" 
               onClick={markAllAsRead}
               className="flex-1 sm:flex-none text-primary-dark gap-2 border-neutral/50"
             >
               <CheckCheck size={16} /> تحديد الكل كمقروء
             </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-neutral/30 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'unread', label: 'غير المقروءة' },
            { id: 'administrative', label: 'إدارية' },
            { id: 'student', label: 'الطلاب' },
            { id: 'attendance', label: 'الحضور' },
            { id: 'system', label: 'النظام' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:bg-neutral-light border border-neutral/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
          <div className="divide-y divide-neutral/30">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                لا توجد إشعارات تطابق هذا التصنيف
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div key={notif.id} className={`p-5 flex gap-4 transition-colors hover:bg-neutral-50 ${notif.read ? 'bg-white opacity-85' : 'bg-primary/5'}`}>
                  <div className="shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-base font-semibold ${notif.read ? 'text-primary-dark' : 'text-primary'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{notif.date}</span>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                      {notif.content}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-neutral-400 hover:text-semantic-error rounded-md hover:bg-neutral-100 transition-colors"
                      title="حذف الإشعار"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
