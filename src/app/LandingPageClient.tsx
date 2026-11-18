'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Building2,
  GraduationCap,
  UsersRound,
  ShieldCheck,
  CalendarCheck,
  Brain,
  ChevronLeft,
  LogIn,
  UserPlus,
  X,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Menu,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import HeroBackdrop from '@/components/landing/HeroBackdrop';
import SectionBackdrop from '@/components/landing/SectionBackdrop';
import { loginUser } from '@/lib/actions/auth';
import { errorMessage } from '@/lib/logger';

type RoleTab = 'ADMIN' | 'TEACHER' | 'PARENT';

export interface LandingStats {
  students: number;
  halaqat: number;
  mosques: number;
  teachers: number;
}

export default function LandingPageClient({
  stats,
  initialLoginOpen,
  initialNextPath = null,
}: {
  stats: LandingStats;
  initialLoginOpen: boolean;
  initialNextPath?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();

  // Modal & Mobile Menu States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(initialLoginOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Where to go after a successful login (e.g. /students/add).
  const [nextPath, setNextPath] = useState<string | null>(initialNextPath);

  // Login Form States
  const [activeRole, setActiveRole] = useState<RoleTab>('ADMIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        setIsLoginModalOpen(false);
        setNextPath(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen]);

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setNextPath(null);
  };

  const openModalWithRole = (role: RoleTab, destination: string | null = null) => {
    setActiveRole(role);
    setLoginError(null);
    setNextPath(destination);
    setIsLoginModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const formData = new FormData();
    formData.append('phone', phone.trim());
    formData.append('password', password);
    formData.append('role', activeRole);

    try {
      const res = await loginUser(formData);

      if (!res.success) {
        setIsLoggingIn(false);
        setLoginError(res.error || 'تعذر تسجيل الدخول');
        toast.error('خطأ في تسجيل الدخول', res.error);
        return;
      }

      toast.success(
        'مرحباً بك!',
        `تم تسجيل الدخول بنجاح بصفتك: ${res.user?.name || 'مستخدم النظام'}`
      );
      setIsLoginModalOpen(false);

      const target =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : res.redirectTo || '/dashboard';
      setNextPath(null);

      setTimeout(() => {
        router.push(target);
      }, 400);
    } catch (err) {
      const message = errorMessage(err);
      setIsLoggingIn(false);
      setLoginError(message || 'حدث خطأ غير متوقع');
      toast.error('خطأ غير متوقع', message);
    }
  };

  // 3 Essential Services
  const coreServices = [
    {
      icon: Brain,
      title: 'رصد الحفظ والمراجعة',
      desc: 'تسجيل أوراد التسميع اليومية وخطط الحفظ الجديد والمراجعة بدقة وإتقان.',
      badge: 'إتقان قرآني',
    },
    {
      icon: CalendarCheck,
      title: 'التحضير والانضباط الفوري',
      desc: 'تسجيل الحضور والغياب والتأخر لحظياً مع إشعارات فورية لأولياء الأمور.',
      badge: 'رصد لحظي',
    },
    {
      icon: Building2,
      title: 'إدارة الحلقات وتسكين الطلاب',
      desc: 'ربط المساجد بالحلقات، تكليف المعلمين، وإسناد الطلاب بخطوات بسيطة ومنظمة.',
      badge: 'حوكمة وتسكين',
    },
  ];

  // 3 Clear Benefits
  const coreBenefits = [
    {
      title: 'للإدارة والمشرفين',
      icon: ShieldCheck,
      desc: 'حوكمة رقمية شاملة بدون أوراق، ومتابعة لحظية لأداء كافة الحلقات والمساجد.',
      highlight: 'تقارير فورية ودعم القرار',
    },
    {
      title: 'للمعلمين والمحفظين',
      icon: GraduationCap,
      desc: 'توفير وقت الرصد اليدوي والتركيز الكامل على التسميع وإتقان التلاوة والتربية.',
      highlight: 'توفير 70% من وقت الرصد',
    },
    {
      title: 'لأولياء الأمور',
      icon: UsersRound,
      desc: 'اطلاع مباشر على حضور وإنجاز الأبناء في الحفظ وتواصل مستمر مع إدارة الحلقة.',
      highlight: 'متابعة شفافة ومطمئنة',
    },
  ];

  const formatNumber = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  return (
    <div
      className="min-h-screen bg-[#F7F4EE] text-charcoal-800 font-sans selection:bg-accent/30 selection:text-charcoal-900 relative overflow-hidden"
      dir="rtl"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 left-10 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[170px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[600px] h-[600px] rounded-full bg-beige-300/20 blur-[180px] pointer-events-none -z-10" />

      {/* 1. Translucent Ivory Header */}
      <header className="sticky top-0 z-40 bg-[#FCFBF8]/85 backdrop-blur-2xl border-b border-[#E2DBD0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform font-black">
              <BookOpen size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-2xl text-charcoal-900 tracking-wide block leading-none">
                خَيْرُكُم
              </span>
              <span className="text-xs text-charcoal-500 font-medium block mt-1">
                منظومة إدارة الحلقات القرآنية
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-charcoal-600">
            <a href="#services" className="hover:text-charcoal-900 transition-colors">
              الخدمات الأساسية
            </a>
            <a href="#benefits" className="hover:text-charcoal-900 transition-colors">
              الفوائد والأثر
            </a>
            <a href="#portals" className="hover:text-charcoal-900 transition-colors">
              بوابات الدخول
            </a>
          </nav>

          {/* Action Button */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => openModalWithRole('ADMIN')}
              className="px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <LogIn size={16} />
              <span>تسجيل الدخول للمصرح لهم</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-charcoal-800 hover:bg-beige-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FCFBF8] border-b border-[#E2DBD0] px-4 py-5 space-y-3">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-charcoal-700 hover:text-charcoal-900 py-1.5"
            >
              الخدمات الأساسية
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-charcoal-700 hover:text-charcoal-900 py-1.5"
            >
              الفوائد والأثر
            </a>
            <a
              href="#portals"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-charcoal-700 hover:text-charcoal-900 py-1.5"
            >
              بوابات الدخول
            </a>
            <div className="pt-3 border-t border-[#E2DBD0]">
              <button
                type="button"
                onClick={() => openModalWithRole('ADMIN')}
                className="w-full py-3 rounded-xl bg-charcoal-800 text-beige-50 font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn size={16} />
                <span>تسجيل الدخول للمصرح لهم</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative isolate overflow-hidden pt-12 pb-20 md:py-24">
        <HeroBackdrop />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-beige-100 text-charcoal-800 border border-beige-300 text-xs font-bold mb-6 shadow-xs">
            <Sparkles size={14} className="text-primary" />
            <span>المنظومة الرقمية الموحدة لحلقات ومساجد تحفيظ القرآن الكريم</span>
          </div>

          {/* Ayah in Calligraphy */}
          <div className="mb-6">
            <p className="font-quran text-3xl sm:text-5xl md:text-6xl text-charcoal-900 font-normal leading-relaxed drop-shadow-xs">
              ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
            </p>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-charcoal-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            إدارة قرآنية ذكية <br className="hidden sm:block" />
            <span className="bg-gradient-to-l from-primary via-accent to-charcoal-800 bg-clip-text text-transparent">
              تربط المسجد والمعلم وولي الأمر
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-charcoal-600 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            منصة متكاملة لرصد أوراد الحفظ والتسميع اليومي، إدارة الانضباط والحضور، وتقييم إتقان
            التلاوة والتجويد بدقة وشفافية تامة.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              type="button"
              onClick={() => openModalWithRole('ADMIN')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-beige-50 font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
            >
              <LogIn size={19} />
              <span>دخول المنصة للمصرح لهم</span>
            </button>

            <button
              type="button"
              onClick={() => openModalWithRole('ADMIN', '/students/add')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-beige-100 border border-[#E2DBD0] text-charcoal-800 font-bold text-base transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <UserPlus size={18} className="text-primary" />
              <span>تسجيل طالب جديد</span>
            </button>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'الطلاب المسجلون', value: formatNumber(stats.students), icon: UsersRound, tag: 'طالب وطالبة' },
              { label: 'الحلقات النشطة', value: formatNumber(stats.halaqat), icon: BookOpen, tag: 'حلقة قرآنية' },
              { label: 'المساجد والمجمعات', value: formatNumber(stats.mosques), icon: Building2, tag: 'مسجد ومجمع' },
              { label: 'المعلمون والمجازون', value: formatNumber(stats.teachers), icon: GraduationCap, tag: 'معلم ومحفظ' },
            ].map((st, i) => {
              const StIcon = st.icon;
              return (
                <div
                  key={i}
                  className="bg-[#FCFBF9]/90 backdrop-blur-sm p-5 rounded-2xl border border-[#E2DBD0] text-start flex flex-col justify-between hover:border-beige-400 transition-all shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-charcoal-500">{st.label}</span>
                    <div className="w-8 h-8 rounded-lg bg-beige-100 text-primary flex items-center justify-center">
                      <StIcon size={18} />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-charcoal-900" dir="ltr">
                    {st.value}
                  </div>
                  <span className="text-xs font-semibold text-primary mt-1">{st.tag}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Core Services Section */}
      <section id="services" className="py-20 relative isolate overflow-hidden border-t border-[#E2DBD0]">
        <SectionBackdrop id="services" mode="arches" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary bg-beige-100 px-4 py-1.5 rounded-full border border-beige-300">
              الخدمات الأساسية
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-charcoal-900 mt-3 mb-3">
              أهم خدمات المنظومة القرآنية
            </h2>
            <p className="text-charcoal-600 text-sm md:text-base font-medium leading-relaxed">
              حلول عملية موحدة لرقمنة الحلقات بدون أوراق وتسهيل مهمة المعلم وولي الأمر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreServices.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#FCFBF9] rounded-3xl p-7 border border-[#E2DBD0] transition-all duration-300 hover:-translate-y-1 hover:border-beige-400 shadow-card hover:shadow-card-hover flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-beige-100 text-primary flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform font-bold border border-beige-200">
                        <Icon size={26} />
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-beige-100 text-charcoal-700 border border-beige-300">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-charcoal-900 mb-2.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-charcoal-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Core Benefits Section */}
      <section
        id="benefits"
        className="py-20 relative isolate overflow-hidden border-t border-[#E2DBD0] bg-[#FAF8F5]/60"
      >
        <SectionBackdrop id="benefits" mode="lattice" flip />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary bg-beige-100 px-4 py-1.5 rounded-full border border-beige-300">
              الأثر والفوائد
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-charcoal-900 mt-3 mb-3">
              قيمة ملموسة لكل أطراف العملية التعليمية
            </h2>
            <p className="text-charcoal-600 text-sm md:text-base font-medium">
              تكامل وتنسيق دائم بين المشرف والمعلم والأسرة لتحقيق أعلى درجات الإتقان.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreBenefits.map((b, i) => {
              const BIcon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-[#FCFBF9] p-7 rounded-3xl border border-[#E2DBD0] hover:border-beige-400 transition-all flex flex-col justify-between shadow-card hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-beige-100 text-primary flex items-center justify-center mb-4 font-bold border border-beige-200">
                      <BIcon size={24} />
                    </div>
                    <span className="text-xs font-bold text-primary block mb-1">
                      {b.highlight}
                    </span>
                    <h3 className="text-xl font-bold text-charcoal-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-charcoal-600 leading-relaxed font-normal">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Role-Based Portals */}
      <section id="portals" className="py-20 relative isolate overflow-hidden border-t border-[#E2DBD0]">
        <SectionBackdrop id="portals" mode="three-arches" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary bg-beige-100 px-4 py-1.5 rounded-full border border-beige-300">
              بوابات الدخول للمصرح لهم
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-charcoal-900 mt-3 mb-3">
              دخول مخصص بحسب الصلاحيات
            </h2>
            <p className="text-charcoal-600 text-sm font-medium">
              اختر بوابتك لفتح نافذة تسجيل الدخول لحسابك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Portal Card */}
            <div className="bg-[#FCFBF9] rounded-3xl p-6 border border-[#E2DBD0] flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-charcoal-800 text-beige-100 flex items-center justify-center mb-4 font-bold shadow-xs">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-charcoal-900 mb-2">بوابة الإدارة والمشرفين</h3>
                <p className="text-xs text-charcoal-600 leading-relaxed mb-6 font-normal">
                  إدارة المساجد والحلقات وتكليف المعلمين وتصدير التقارير والمؤشرات العامة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModalWithRole('ADMIN')}
                className="w-full py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>دخول الإدارة والمشرفين</span>
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Teacher Portal Card */}
            <div className="bg-[#FAF7F2] rounded-3xl p-6 border-2 border-accent flex flex-col justify-between relative shadow-card hover:shadow-card-hover transition-all">
              <div className="absolute top-0 end-6 -translate-y-1/2 bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-xs">
                بوابة المعلم
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 font-bold shadow-xs">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-lg font-bold text-charcoal-900 mb-2">بوابة الكادر التعليمي</h3>
                <p className="text-xs text-charcoal-600 leading-relaxed mb-6 font-normal">
                  رصد الحضور اليومي، تسجيل التسميع وأوراد الحفظ، والتواصل مع أولياء الأمور.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModalWithRole('TEACHER')}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>دخول المعلمين والمحفظين</span>
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Parent Portal Card */}
            <div className="bg-[#FCFBF9] rounded-3xl p-6 border border-[#E2DBD0] flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-beige-100 text-primary flex items-center justify-center mb-4 font-bold border border-beige-300">
                  <UsersRound size={24} />
                </div>
                <h3 className="text-lg font-bold text-charcoal-900 mb-2">بوابة أولياء الأمور</h3>
                <p className="text-xs text-charcoal-600 leading-relaxed mb-6 font-normal">
                  متابعة إنجاز الأبناء في الحفظ وسجلات الحضور وإرسال الأعذار والتواصل.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModalWithRole('PARENT')}
                className="w-full py-3 rounded-xl bg-beige-100 hover:bg-beige-200 text-charcoal-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-beige-300"
              >
                <span>دخول أولياء الأمور</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative overflow-hidden bg-charcoal-900 text-beige-200 py-10 border-t border-charcoal-800 text-xs">
        <SectionBackdrop id="footer" mode="strip" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white font-black flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <span className="font-bold text-white text-sm">منظومة خَيْرُكُم لإدارة الحلقات القرآنية</span>
          </div>
          <p className="text-charcoal-400">© {new Date().getFullYear()} — جميع الحقوق محفوظة لجمعية خيركم لتحفيظ القرآن الكريم</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openModalWithRole('ADMIN')}
              className="text-beige-200 hover:text-white font-semibold"
            >
              تسجيل الدخول
            </button>
            <span className="text-charcoal-600">•</span>
            <Link href="/parent-portal" className="text-beige-200 hover:text-white font-semibold">
              بوابة ولي الأمر
            </Link>
            <span className="text-charcoal-600">•</span>
            <Link href="/teacher-portal" className="text-beige-200 hover:text-white font-semibold">
              بوابة المعلم
            </Link>
          </div>
        </div>
      </footer>

      {/* 7. POPUP LOGIN MODAL */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLoginModal();
          }}
        >
          <div className="bg-[#FCFBF8] border border-[#E2DBD0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-charcoal-800 relative animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2DBD0] flex items-center justify-between bg-beige-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-charcoal-800 text-white flex items-center justify-center shadow-xs font-bold">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 id="login-dialog-title" className="text-base font-black text-charcoal-900">تسجيل الدخول للمصرح لهم</h2>
                  <p className="text-xs text-primary font-bold">منظومة خيركم لإدارة الحلقات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeLoginModal()}
                className="p-2 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-beige-100 transition-colors"
                title="إغلاق النافذة (ESC)"
                aria-label="إغلاق نافذة تسجيل الدخول"
              >
                <X size={20} />
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-3 p-2 bg-[#F4EFE6] border-b border-[#E2DBD0] gap-1.5">
              {[
                { id: 'ADMIN' as RoleTab, label: 'الإدارة', icon: ShieldCheck },
                { id: 'TEACHER' as RoleTab, label: 'المعلمون', icon: GraduationCap },
                { id: 'PARENT' as RoleTab, label: 'أولياء الأمور', icon: UsersRound },
              ].map((t) => {
                const TabIcon = t.icon;
                const isSelected = activeRole === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveRole(t.id);
                      setLoginError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-charcoal-800 text-white shadow-xs font-bold'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-beige-200/50 font-semibold'
                    }`}
                  >
                    <TabIcon size={14} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Error Message */}
              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Contextual hint when a protected destination was requested */}
              {nextPath === '/students/add' && (
                <div className="p-3.5 rounded-xl bg-beige-100 border border-beige-300 text-charcoal-700 text-xs font-bold leading-relaxed">
                  إضافة طالب جديد تتطلب حساباً إدارياً. سجّل الدخول وسننقلك مباشرة إلى نموذج
                  التسجيل.
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    رقم الهاتف المسجل <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute top-3.5 start-3 text-charcoal-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      required
                      className="w-full h-11 ps-9 pe-3 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm font-mono text-end font-semibold"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-charcoal-700">
                      كلمة المرور <span className="text-primary">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute top-3.5 start-3 text-charcoal-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-11 ps-9 pe-10 rounded-xl border border-[#D5CDC2] bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3 end-3 text-charcoal-400 hover:text-charcoal-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoggingIn}
                  disabled={isLoggingIn}
                  className="w-full !h-12 !rounded-xl font-bold !text-sm shadow-sm mt-3"
                >
                  {isLoggingIn ? 'جاري التحقق من الصلاحيات...' : 'تأكيد ودخول المنصة'}
                </Button>
              </form>

              {/* Direct Links */}
              <div className="pt-2 text-center border-t border-[#E2DBD0] flex items-center justify-center gap-4 text-xs font-semibold">
                <Link
                  href="/dashboard"
                  onClick={() => closeLoginModal()}
                  className="text-charcoal-600 hover:text-charcoal-900 underline"
                >
                  لوحة الإدارة
                </Link>
                <span>•</span>
                <Link
                  href="/teacher-portal"
                  onClick={() => closeLoginModal()}
                  className="text-charcoal-600 hover:text-charcoal-900 underline"
                >
                  بوابة المعلم
                </Link>
                <span>•</span>
                <Link
                  href="/parent-portal"
                  onClick={() => closeLoginModal()}
                  className="text-charcoal-600 hover:text-charcoal-900 underline"
                >
                  بوابة ولي الأمر
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
