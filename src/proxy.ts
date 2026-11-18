import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  homeForRole,
  verifySessionToken,
  type Role,
} from '@/lib/auth/token';

/**
 * Next.js 16 calls middleware "Proxy". This is only an optimistic gate: every
 * page/action still authorises itself server-side (see src/lib/auth/session.ts).
 */
const PUBLIC_PATHS = new Set(['/login', '/unauthorized', '/api/health']);

const ROLE_RULES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/teacher-portal', roles: ['TEACHER', 'ADMIN'] },
  { prefix: '/parent-portal', roles: ['PARENT', 'ADMIN'] },
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // The landing page is public, but signed-in users go straight to their area.
  if (pathname === '/') {
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (!session) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('login', 'true');
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Accounts flagged for a first-login password change can only reach the profile.
  if (session.mustChangePassword && !pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/profile?change=1', request.url));
  }

  const rule = ROLE_RULES.find((item) => pathname.startsWith(item.prefix));
  const allowedRoles = rule ? rule.roles : (['ADMIN'] as Role[]);

  if (!allowedRoles.includes(session.role)) {
    // Send the user to their own area instead of a dead end. The server-side
    // guards do the same, so the gate and the pages stay consistent.
    const home = homeForRole(session.role);
    return NextResponse.redirect(
      new URL(home === pathname ? '/unauthorized' : home, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2)$).*)',
  ],
};
