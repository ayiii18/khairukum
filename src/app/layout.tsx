import type { Metadata } from 'next';
import './globals.css';
import { Cairo, Amiri, Amiri_Quran } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-amiri',
});

const amiriQuran = Amiri_Quran({
  subsets: ['arabic'],
  weight: '400',
  display: 'swap',
  variable: '--font-amiri-quran',
});

export const metadata: Metadata = {
  title: {
    default: 'نظام إدارة الحلقات | خيركم',
    template: '%s | خيركم',
  },
  description: 'نظام متكامل لإدارة حلقات تحفيظ القرآن الكريم، المساجد، الطلاب، والمعلمين.',
  applicationName: 'خيركم',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${amiri.variable} ${amiriQuran.variable}`}
    >
      <body className="text-primary-dark antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
