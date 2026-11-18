import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white border border-neutral/40 rounded-3xl shadow-card p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-bold text-primary-dark">لا تملك صلاحية الوصول</h1>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          هذه الصفحة مخصصة لدور مختلف. يمكنك العودة إلى صفحتك الرئيسية أو تسجيل الدخول بحساب آخر.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            الصفحة الرئيسية
          </Link>
          <Link
            href="/?login=true"
            className="px-5 py-2.5 rounded-xl bg-white border border-neutral/50 text-charcoal-800 font-bold text-sm hover:bg-beige-50 transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
