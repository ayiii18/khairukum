import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white border border-neutral/40 rounded-3xl shadow-card p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
          <BookOpen size={28} />
        </div>
        <p className="text-5xl font-black text-primary-dark">404</p>
        <h1 className="text-xl font-bold text-primary-dark mt-3">الصفحة غير موجودة</h1>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          ربما تم نقل الصفحة أو أن الرابط غير صحيح.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
