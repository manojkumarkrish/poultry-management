import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseAndVerifyToken } from '@/lib/auth/authUtils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static and public assets always pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('kpf_session')?.value;
  const roleCookie = request.cookies.get('kpf_role')?.value;

  let isAuthenticated = false;
  let userRole: 'owner_admin' | 'manager' = 'manager';

  if (sessionToken && sessionToken.trim().length > 0) {
    const verified = await parseAndVerifyToken(sessionToken);
    if (verified.valid) {
      isAuthenticated = true;
      if (verified.role) {
        userRole = verified.role;
      } else if (roleCookie === 'owner_admin' || roleCookie === 'manager') {
        userRole = roleCookie;
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // If user is accessing /login
  if (pathname === '/login') {
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  }

  // If accessing API routes without authentication
  if (pathname.startsWith('/api/') && !isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized. Authentication session required.' },
      { status: 401 }
    );
  }

  // If accessing any protected page without authentication
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Preserve return URL if useful
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Admin-Only Route & API Protection
  const isAdminOnlyPage =
    pathname === '/users' ||
    pathname.startsWith('/users/') ||
    pathname === '/audit-logs' ||
    pathname.startsWith('/audit-logs/');
  const isAdminOnlyApi =
    pathname.startsWith('/api/users') ||
    pathname.startsWith('/api/audit-logs') ||
    pathname.startsWith('/api/admin');

  if (isAdminOnlyPage && userRole !== 'owner_admin') {
    // Block Manager access and redirect to home dashboard with access-denied indicator
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('denied', 'admin_required');
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminOnlyApi && userRole !== 'owner_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Owner/Admin role required for this resource.' },
      { status: 403 }
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons/*, manifest.json, sw.js
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)',
  ],
};
