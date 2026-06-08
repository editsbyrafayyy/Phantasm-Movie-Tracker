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

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // ── Session Hardening ──────────────────────────────────────────────────────
  // Auth-only routes: redirect logged-in users away from /login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect-loop guard: don't redirect /login → /login
  if (pathname === '/login' && !user) {
    return res;
  }

  // Members only routes: /add, /update, /profile, /vault, /browse, /stream, /stats, /api/add-movie, /api/stats
  const membersOnly = ['/add', '/update', '/profile', '/vault', '/browse', '/stream', '/stats', '/api/add-movie', '/api/stats'];
  if (membersOnly.some(p => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL('/login', req.url);
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
