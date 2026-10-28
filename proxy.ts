import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  // Browse merged into Stream. Redirect here (a real 308) rather than only in the
  // page, where the root loading boundary would turn it into a meta refresh.
  if (req.nextUrl.pathname === '/browse' || req.nextUrl.pathname.startsWith('/browse/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/stream';
    return NextResponse.redirect(url, 308);
  }

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

  // Members-only routes. Guests only browse the owner's showcase: everything under
  // /stream (hub, info pages, player) and the APIs behind it need an account.
  const membersOnly = [
    '/add', '/update', '/profile', '/admin', '/stats', '/watchlist', '/stream',
    '/api/add-movie', '/api/stats', '/api/stream/', '/api/tmdb/', '/api/omdb-search', '/api/watch-progress',
  ];
  const isMembersOnly = membersOnly.some(p => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`));
  if (isMembersOnly && !user) {
    // API callers get a JSON 401 instead of an HTML redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Keep the query (e.g. ?type=tv&s=2&e=3 on player links) so login returns to the same view
    const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname + req.nextUrl.search)}`, req.url);
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
