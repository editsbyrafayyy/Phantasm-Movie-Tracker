import { createServerClient } from '@supabase/ssr';
import { NextResponse }       from 'next/server';
import type { NextRequest }   from 'next/server';

// Routes that require an active Supabase session
const PROTECTED_PAGES = ['/vault', '/add', '/update', '/stats', '/profile'];
// API routes that require auth (omdb-search is excluded — it's a server-side proxy)
const PROTECTED_API   = ['/api/movies', '/api/add-movie', '/api/stats'];
// Routes that logged-in users should be bounced away from
const AUTH_ONLY       = ['/login'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

  // Build a Supabase client that can read/refresh cookies inside middleware
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (keeps JWT from going stale)
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname }          = req.nextUrl;

  // ── Protected pages → redirect to /login ─────────────────────────────────
  const isProtectedPage = PROTECTED_PAGES.some(p => pathname.startsWith(p));
  if (isProtectedPage && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Protected API routes → 401 ────────────────────────────────────────────
  const isProtectedApi = PROTECTED_API.some(p => pathname.startsWith(p));
  if (isProtectedApi && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Auth-only routes: redirect logged-in users away from /login ───────────
  const isAuthOnly = AUTH_ONLY.some(p => pathname.startsWith(p));
  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL('/vault', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
