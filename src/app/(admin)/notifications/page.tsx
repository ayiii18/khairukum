import Link from 'next/link';
import { query } from '@/lib/db';
import { Bell, AlertCircle, CheckCircle, Info, Trash2, CheckCheck, BookOpen } from 'lucide-react';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/actions/notifications';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ type?: string; unread?: string }>;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  recipient: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  SYSTEM: 'النظام',
  ATTENDANCE: 'الحضور',
  STUDENT: 'الطلاب',
  MEMORIZATION: 'الحفظ',
  EVALUATION: 'التقييم',
  ADMINISTRATIVE: 'إدارية',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'ATTENDANCE') return <AlertCircle size={20} className="text-amber-600" />;
  if (type === 'STUDENT') return <CheckCircle size={20} className="text-emerald-600" />;
  if (type === 'MEMORIZATION' || type === 'EVALUATION') return <BookOpen size={20} className="text-primary" />;
  if (type === 'SYSTEM') return <Info size={20} className="text-charcoal-500" />;
  return <Bell size={20} className="text-primary" />;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const type = params.type && TYPE_LABELS[params.type] ? params.type : '';
  const unreadOnly = params.unread === '1';

  const rows = await query<NotificationRow>(
    `SELECT n.id, n.title, n.message, n.type::text AS type, n.is_read,
            n.created_at::text AS created_at, u.phone AS recipient
     FROM notifications n
     LEFT JOIN users u ON u.id = n.user_id
     WHERE ($1 = '' OR n.type::text = $1)
       AND ($2 = FALSE OR n.is_read = FALSE)
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [type, unreadOnly]
  );

  const unreadCount = rows.filter((row) => !row.is_read).length;

  const tabs = [
    { id: '', label: 'الكل' },
    { id: 'unread', label: 'غير المقروءة' },
    ...Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label })),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
            <Bell className="text-primary" size={28} />
            مركز الإشعارات
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            التنبيهات المسجلة فعلياً في النظام — غير المقروء: {unreadCount}
          </p>
        </div>
        <form action={markAllNotificationsRead}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral/50 bg-white text-primary-dark text-sm font-bold hover:bg-beige-50 transition-colors"
          >
            <CheckCheck size={16} />
            <span>تحديد الكل كمقروء</span>
          </button>
        </form>
      </div>

      <div className="flex gap-2 border-b border-neutral/30 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isUnread = tab.id === 'unread';
          const href = isUnread ? '/notifications?unread=1' : tab.id ? `/notifications?type=${tab.id}` : '/notifications';
          const active = isUnread ? unreadOnly : !unreadOnly && type === tab.id;
          return (
            <Link
              key={tab.id || 'all'}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:bg-beige-50 border border-neutral/30'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-neutral/30 overflow-hidden">
        <div className="divide-y divide-neutral/30">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">لا توجد إشعارات تطابق هذا التصنيف</div>
          ) : (
            rows.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 flex gap-4 transition-colors hover:bg-neutral-50 ${notification.is_read ? 'bg-white' : 'bg-primary/5'}`}
              >
                <div className="shrink-0 mt-1">
                  <TypeIcon type={notification.type} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <h3 className={`text-base font-semibold ${notification.is_read ? 'text-primary-dark' : 'text-primary'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-1">{notification.message}</p>
                  <span className="text-[11px] text-neutral-400">
                    {TYPE_LABELS[notification.type] ?? notification.type}
                    {notification.recipient ? ` • ${notification.recipient}` : ''}
                    {notification.is_read ? ' • مقروء' : ' • جديد'}
                  </span>
                </div>
                <div className="shrink-0 flex items-start gap-1">
                  {!notification.is_read && (
                    <form action={markNotificationRead.bind(null, notification.id)}>
                      <button
                        type="submit"
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 rounded-md hover:bg-neutral-100 transition-colors"
                        title="تحديد كمقروء"
                      >
                        <CheckCheck size={16} />
                      </button>
                    </form>
                  )}
                  <form action={deleteNotification.bind(null, notification.id)}>
                    <button
                      type="submit"
                      className="p-1.5 text-neutral-400 hover:text-semantic-error rounded-md hover:bg-neutral-100 transition-colors"
                      title="حذف الإشعار"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
