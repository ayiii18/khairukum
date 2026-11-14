'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-semantic-error/10 flex items-center justify-center">
        <AlertTriangle size={28} className="text-semantic-error" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-primary-dark mb-1">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-neutral-500">يرجى المحاولة مجدداً أو التواصل مع الدعم التقني.</p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        <RefreshCw size={15} />
        إعادة المحاولة
      </button>
    </div>
  );
}
