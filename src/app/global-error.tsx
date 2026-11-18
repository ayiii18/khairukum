'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: 'error', event: 'app.global-error', message: error.message, digest: error.digest }));
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: '#F7F4EE', fontFamily: 'sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2DBD0',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              maxWidth: '28rem',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', color: '#1F2428', marginBottom: '0.5rem' }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#57606A', lineHeight: 1.8 }}>
              تعذر تحميل هذه الصفحة. يمكنك إعادة المحاولة أو العودة لاحقاً.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: '1.5rem',
                padding: '0.65rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#8C6D46',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
