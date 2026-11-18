import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('ADMIN');

  return (
    <AppShell
      user={{
        name: session.name,
        phone: session.phone,
        role: session.role,
      }}
    >
      {children}
    </AppShell>
  );
}
