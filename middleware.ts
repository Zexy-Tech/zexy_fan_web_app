import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Skip detection for static assets, API, and the block page itself
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/desktop-block' ||
    pathname.includes('.') // common assets like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  // 2. Identify Mobile/Tablet via User-Agent
  // Matches Android, iPhone, iPad, iPod, BlackBerry, and common mobile browsers
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Note: Modern iPads often send Macintosh UA. 
  // We can't check touch points on server, but standard mobile UA check covers most.
  // Tablet check usually included in the mobile pattern above.

  // 3. Block Desktop: If NOT identified as mobile/tablet, redirect to block page
  // ALLOW_DESKTOP=true (e.g. in .env.local) disables the lock for local testing.
  if (!isMobileUA && process.env.ALLOW_DESKTOP !== 'true') {
    const url = request.nextUrl.clone();
    url.pathname = '/desktop-block';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Ensure middleware runs on relevant paths
export const config = {
  matcher: [
    /*
     * Skip Next internals + API so middleware never touches CSS/JS/HMR (missing styles if blocked).
     */
    '/((?!api|_next/static|_next/image|_next/webpack|favicon.ico).*)',
  ],
};
