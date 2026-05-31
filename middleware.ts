import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isUnlocked = request.cookies.has('vault_unlocked');
  const pathname   = request.nextUrl.pathname;

  const protectedPaths = ['/add', '/update', '/api/add-movie', '/api/update-movie'];
  
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!isUnlocked) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Vault is locked.' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/add/:path*',
    '/update/:path*',
    '/api/add-movie/:path*',
    '/api/update-movie/:path*',
  ],
};
