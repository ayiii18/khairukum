'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to the home page with login modal open
    router.replace('/?login=true');
  }, [router]);

  return (
    <div
      className="min-h-screen bg-[#041622] flex items-center justify-center p-4 text-white"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 animate-pulse">
          <BookOpen size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">منظومة خَيْرُكُم</h1>
          <p className="text-xs text-emerald-300 mt-1 font-semibold">
            جاري فتح نافذة تسجيل الدخول المنبثقة...
          </p>
        </div>
        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mt-2" />
      </div>
    </div>
  );
}
