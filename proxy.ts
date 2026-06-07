import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // ── Session Hardening ──────────────────────────────────────────────────────
  // Explicit session expiry handling
  if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Auth-only routes: redirect logged-in users away from /login
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect-loop guard: don't redirect /login → /login
  if (pathname === '/login' && !session) {
    return res;
  }

  // Members only routes: /add, /update, /profile, /vault (private), /api/add-movie, /api/stats
  const membersOnly = ['/add', '/update', '/profile', '/api/add-movie', '/api/stats'];
  if (membersOnly.some(p => pathname.startsWith(p)) && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Security Headers ──────────────────────────────────────────────────────
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-XSS-Protection', '1; mode=block');

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
