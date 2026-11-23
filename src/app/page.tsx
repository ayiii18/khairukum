import LandingPageClient from './LandingPageClient';
import { safeNextPath } from '@/lib/auth/token';
import { getPublicStats } from '@/lib/queries/stats';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string | string[]; next?: string | string[] }>;
}) {
  const [params, stats] = await Promise.all([searchParams, getPublicStats()]);
  const login = Array.isArray(params.login) ? params.login[0] : params.login;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  // Only allow same-site absolute paths, else the login form could be used as
  // an open redirect.
  const nextPath = safeNextPath(rawNext);

  return (
    <LandingPageClient
      stats={stats}
      initialLoginOpen={login === 'true'}
      initialNextPath={nextPath}
    />
  );
}
