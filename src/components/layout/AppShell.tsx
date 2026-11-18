'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/actions/auth';
import {
  Home, Users, ClipboardList, BarChart3,
  Settings, User, LogOut, ChevronDown, ChevronLeft, Menu,
  BookOpen, X, Bell, Search, UserPlus,
  CalendarCheck, Brain, RotateCcw, Star, StickyNote,
  Building2, UsersRound, GraduationCap
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  badge?: string;
  subItems?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', icon: Home, href: '/dashboard' },
  { label: 'الطلاب', icon: UsersRound, href: '/students', badge: 'رئيسي' },
  { label: 'الحلقات', icon: BookOpen, href: '/halaqat' },
  { label: 'المعلمون', icon: GraduationCap, href: '/teachers' },
  { label: 'المساجد', icon: Building2, href: '/mosques' },
  {
    label: 'المتابعة اليومية', icon: ClipboardList, subItems: [
      { label: 'الحضور والغياب', href: '/attendance', icon: CalendarCheck },
      { label: 'الحفظ الجديد', href: '/memorization', icon: Brain },
      { label: 'سجل المراجعة', href: '/revision', icon: RotateCcw },
      { label: 'التقييمات', href: '/evaluations', icon: Star },
      { label: 'الملاحظات والتوجيهات', href: '/notes', icon: StickyNote },
    ]
  },
  { label: 'أولياء الأمور', icon: Users, href: '/parents' },
  { label: 'التقارير والإحصائيات', icon: BarChart3, href: '/reports' },
  {
    label: 'النظام والإعدادات', icon: Settings, subItems: [
      { label: 'مركز الإشعارات', href: '/notifications', icon: Bell },
      { label: 'إعدادات النظام', href: '/settings', icon: Settings },
    ]
  },
];

export interface ShellUser {
  name: string;
  phone: string;
  role: string;
}

export const AppShell: React.FC<{ children: React.ReactNode; user: ShellUser }> = ({ children, user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['المتابعة اليومية']);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
        setExpandedItems(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  const toggleExpand = (label: string) => {
    if (!isSidebarOpen) setSidebarOpen(true);
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/students?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const today = new Date();
  const gregorianDate = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);

  const renderSidebar = (mobile = false) => (
    <>
      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${mobile ? 'justify-between px-4' : (isSidebarOpen ? 'justify-between px-4' : 'justify-center px-2')}`}>
        {(mobile || isSidebarOpen) && (
          <Link href="/dashboard" onClick={mobile ? closeMobile : undefined} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-white block leading-tight">خيركم</span>
              <span className="text-[10px] text-white/60 font-medium block">إدارة الحلقات القرآنية</span>
            </div>
          </Link>
        )}
        {mobile ? (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
            <X size={20} />
          </button>
        ) : (
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white" title={isSidebarOpen ? "تصغير القائمة" : "توسيع القائمة"}>
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Direct Quick Add Student Action in Sidebar */}
      {(mobile || isSidebarOpen) && (
        <div className="p-3 pb-1">
          <Link
            href="/students/add"
            onClick={mobile ? closeMobile : undefined}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-l from-accent to-primary text-white font-semibold text-xs hover:opacity-95 transition-all shadow-sm hover:shadow"
          >
            <UserPlus size={15} />
            <span>تسجيل طالب جديد</span>
          </Link>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-2.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.includes(item.label);
          const hasActiveChild = item.subItems?.some(sub => isActive(sub.href));
          const isItemActive = item.href ? isActive(item.href) : false;

          return (
            <div key={item.label} className="mb-0.5">
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={mobile ? closeMobile : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium relative group ${
                    isItemActive
                      ? 'bg-white/15 text-white shadow-sm font-semibold border border-white/10'
                      : 'text-beige-100/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={`shrink-0 ${isItemActive ? 'text-accent' : 'text-beige-200/80 group-hover:text-white'}`} />
                  {(mobile || isSidebarOpen) && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ms-auto text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold border border-accent/30">
                          {item.badge}
                        </span>
                      )}
                      {isItemActive && !item.badge && (
                        <span className="ms-auto w-2 h-2 rounded-full bg-accent shrink-0 animate-pulse" />
                      )}
                    </>
                  )}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      hasActiveChild ? 'text-white bg-white/10 font-semibold' : 'text-beige-100/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="shrink-0 text-beige-200/80" />
                      {(mobile || isSidebarOpen) && <span>{item.label}</span>}
                    </div>
                    {(mobile || isSidebarOpen) && (
                      <div className="shrink-0 text-white/40">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                      </div>
                    )}
                  </button>

                  {(mobile || isSidebarOpen) && isExpanded && item.subItems && (
                    <div className="mt-1 ms-3 ps-3 border-s-2 border-white/15 space-y-0.5 py-1">
                      {item.subItems.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = isActive(sub.href);
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={mobile ? closeMobile : undefined}
                            className={`flex items-center gap-2.5 py-2 px-3 text-xs rounded-lg transition-all ${
                              isSubActive
                                ? 'bg-white/20 text-white font-semibold'
                                : 'text-beige-200/65 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <SubIcon size={14} className={`shrink-0 ${isSubActive ? 'text-accent' : ''}`} />
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0 bg-charcoal-900/90">
        <Link href="/profile" onClick={mobile ? closeMobile : undefined} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive('/profile') ? 'bg-white/15 text-white font-semibold' : 'text-beige-100/75 hover:bg-white/10 hover:text-white'}`}>
          <User size={18} className="shrink-0" />
          {(mobile || isSidebarOpen) && (
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium leading-none">{user.name}</span>
              <span className="block truncate text-[11px] text-beige-300/50 mt-0.5" dir="ltr">{user.phone}</span>
            </div>
          )}
        </Link>
        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-semantic-error/20 text-white/70 hover:text-semantic-error transition-all text-xs"
          >
            <LogOut size={16} className="shrink-0" />
            {(mobile || isSidebarOpen) && <span>تسجيل الخروج</span>}
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F7F4EE] overflow-hidden font-sans" dir="rtl">

      {/* Desktop Sidebar */}
      <aside className={`bg-charcoal-800 text-white transition-all duration-300 flex-col shrink-0 hidden md:flex shadow-xl z-20 border-s border-white/5 ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {renderSidebar()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-charcoal-900/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 right-0 h-full w-64 bg-charcoal-800 text-white z-50 flex flex-col md:hidden shadow-2xl">
            {renderSidebar(true)}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header Bar */}
        <header className="h-16 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E2DBD0] flex items-center justify-between px-4 md:px-6 z-10 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 hover:bg-beige-100 rounded-xl transition-colors text-charcoal-800"
              aria-label="القائمة الجانبية"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-charcoal-700 font-medium bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#E2DBD0]">
              <span className="font-bold text-primary">{gregorianDate}</span>
              <span className="text-charcoal-300">•</span>
              <span>{hijriDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="بحث سريع عن طالب (اضغط Enter)..."
                className="h-10 w-72 ps-9 pe-3 rounded-full border border-[#DDD3C1] bg-[#F5EFE6]/70 focus:bg-white focus:ring-2 focus:ring-accent/30 focus:border-accent text-xs text-charcoal-800 transition-all placeholder:text-charcoal-400"
              />
              <Search size={15} className="absolute top-3 start-3 text-charcoal-400 pointer-events-none" />
            </form>

            {/* Quick Students Link */}
            <Link
              href="/students"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-beige-100 transition-colors border border-primary/30"
              title="الانتقال إلى صفحة الطلاب"
            >
              <UsersRound size={15} />
              <span>دليل الطلاب</span>
            </Link>

            {/* Quick Add Button */}
            <Link
              href="/students/add"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover transition-all shadow-sm hover:shadow"
            >
              <UserPlus size={15} />
              <span className="hidden sm:inline">تسجيل طالب</span>
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 text-charcoal-700 hover:text-charcoal-900 hover:bg-beige-100 rounded-full transition-all"
              title="الإشعارات"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 start-1.5 w-2.5 h-2.5 bg-semantic-error rounded-full border-2 border-[#FAF7F2] ring-2 ring-semantic-error/20" />
            </Link>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 ps-2 border-s border-[#E2DBD0]">
              <div className="w-8 h-8 rounded-full bg-beige-200 text-primary flex items-center justify-center font-bold text-xs border border-beige-300">
                {user.name?.charAt(0) || 'م'}
              </div>
              <div className="hidden xl:block text-start leading-tight">
                <span className="block text-xs font-bold text-charcoal-800">{user.name}</span>
                <span className="block text-[10px] text-charcoal-500">مشرف عام</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-[#F7F4EE]">
          {children}
        </div>
      </main>
    </div>
  );
};
