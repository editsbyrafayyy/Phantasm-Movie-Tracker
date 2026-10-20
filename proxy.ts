import { createServerClient } from '@supabase/ssr';
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
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
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

  // Gracefully handle Supabase being unreachable (DNS/network errors in dev)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Network unreachable — treat as unauthenticated, allow request to proceed
  }

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

  // Members only routes: /add, /update, /profile, /stream, /stats, /diary, /watchlist, /api/add-movie, /api/stats
  const membersOnly = ['/add', '/update', '/profile', '/stream', '/stats', '/diary', '/watchlist', '/api/add-movie', '/api/stats'];
  if (membersOnly.some(p => pathname.startsWith(p)) && !user) {
    // API callers get a JSON 401 instead of an HTML redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Security headers are set globally in next.config.ts (headers()).

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
