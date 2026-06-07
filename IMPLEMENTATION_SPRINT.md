# IMPLEMENTATION SPRINT
## Vault — Security · Streaming UI · Mobile · Performance
**Priority:** High — implement in the order listed
**Scope:** Do NOT touch any streaming embed/provider logic, iframe src URLs, or the VideoPlayer fetch chain. Streaming works. Only visual, layout, and UX changes are in scope for the streaming section.

---

## CRITICAL RULE BEFORE STARTING

**The owner's entries (user_id = `69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0`) are read-only for every other user, including authenticated members.** No authenticated non-owner user can ever edit, delete, or overwrite any entry whose `user_id` matches the owner UUID. This is enforced at three independent layers: RLS, API middleware, and UI. All three must be implemented. If any single layer is missing, do not ship.

---

## PART 1 — SECURITY HARDENING

### 1.1 Supabase RLS — Owner Entry Protection

Run the following SQL in the Supabase SQL editor. These replace any existing `entries` policies.

```sql
-- Drop all existing entries policies first
drop policy if exists "select_own_entries"    on entries;
drop policy if exists "insert_own_entries"    on entries;
drop policy if exists "update_own_entries"    on entries;
drop policy if exists "delete_own_entries"    on entries;
drop policy if exists "users_own_entries"     on entries;

-- Define owner UUID as a reusable function to avoid hardcoding in every policy
create or replace function is_owner()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- SELECT: authenticated users can read their own entries; anyone can read owner entries (for public browse)
create policy "entries_select" on entries
  for select using (
    user_id = auth.uid()
    or user_id = '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'
  );

-- INSERT: authenticated users can only insert rows where user_id = their own id
create policy "entries_insert" on entries
  for insert with check (
    auth.uid() = user_id
    and auth.uid() is not null
  );

-- UPDATE: users can update only their own non-owner entries
create policy "entries_update" on entries
  for update using (
    auth.uid() = user_id
    and user_id != '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'
  )
  with check (
    auth.uid() = user_id
    and user_id != '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'
  );

-- DELETE: users can delete only their own non-owner entries
create policy "entries_delete" on entries
  for delete using (
    auth.uid() = user_id
    and user_id != '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'
  );

-- Profiles: users read all profiles (for public pages), update only their own
drop policy if exists "own_profile_only" on profiles;

create policy "profiles_select_all" on profiles
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Movies: authenticated and anon users can read; only service role writes
drop policy if exists "authenticated_read_movies" on movies;

create policy "movies_read_all" on movies
  for select using (true);
```

Verify after running: in Supabase Table Editor, `entries` must show 4 policies. `movies` must show 1. `profiles` must show 2.

---

### 1.2 API Route — Server-Side Owner Guard

Add the following middleware function to `lib/guards.ts`. Import and call it in every PATCH and DELETE handler.

```typescript
// lib/guards.ts
import { NextResponse } from 'next/server';

export const OWNER_ID = '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0';

/**
 * Returns a 403 response if the authenticated user is attempting
 * to mutate an entry owned by the vault owner.
 * Call this BEFORE any database write in PATCH/DELETE routes.
 */
export function guardOwnerEntry(
  requestingUserId: string,
  entryOwnerId: string
): NextResponse | null {
  if (entryOwnerId === OWNER_ID && requestingUserId !== OWNER_ID) {
    return NextResponse.json(
      { error: 'You do not have permission to modify this entry.' },
      { status: 403 }
    );
  }
  return null;
}
```

In `app/api/movies/[id]/route.ts`:

```typescript
// At the top of the PATCH handler, after fetching the entry:
const entry = await supabase.from('entries').select('user_id').eq('id', params.id).single();
const guard = guardOwnerEntry(session.user.id, entry.data.user_id);
if (guard) return guard;

// At the top of the DELETE handler, same pattern:
const entry = await supabase.from('entries').select('user_id').eq('id', params.id).single();
const guard = guardOwnerEntry(session.user.id, entry.data.user_id);
if (guard) return guard;
```

---

### 1.3 UI — Hide Edit/Delete on Owner Entries for Non-Owners

In `MovieDetail.tsx`, wrap all edit/delete UI in an ownership check:

```tsx
// lib/useAuth.ts already exposes the current user; use it here
const { user } = useAuth();
const OWNER_ID = '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0';
const canMutate = user?.id === entry.user_id;

// Only render edit and delete buttons when canMutate is true
{canMutate && (
  <>
    <button onClick={handleEdit}>Edit Ratings</button>
    <button onClick={handleDelete}>Delete</button>
  </>
)}
```

The Watch Now button remains visible to all users regardless of ownership.

---

### 1.4 Rate Limiting on API Routes

Install the `@upstash/ratelimit` + `@upstash/redis` packages, or use a lightweight in-memory approach if Upstash is not available. For the in-memory approach (acceptable for this scale):

```typescript
// lib/ratelimit.ts
const requests = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now > entry.reset) {
    requests.set(ip, { count: 1, reset: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true;
}
```

Apply to the add-movie and stats routes:

```typescript
// In app/api/add-movie/route.ts and app/api/stats/route.ts
import { rateLimit } from '@/lib/ratelimit';
import { headers } from 'next/headers';

const ip = headers().get('x-forwarded-for') ?? 'unknown';
if (!rateLimit(ip)) {
  return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
}
```

---

### 1.5 Input Sanitization

In `app/api/add-movie/route.ts`, add these checks before any database operation:

```typescript
// Reject oversized payloads
const body = await req.json();
if (JSON.stringify(body).length > 4096) {
  return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
}

// Strip and validate title
const title = String(body.title ?? '').trim().slice(0, 200);
if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

// Validate subgenre against allowlist — never trust client-sent values
const VALID_SUBGENRES = [
  'Psychological Horror','Supernatural Horror','Folk Horror',
  'Religious/Occult Horror','Creature Feature','Slasher',
  'Zombie Horror','Survival Horror','Found Footage Horror',
  'Sci-Fi Horror','Gore/Extreme Horror','Horror Comedy','Thriller (Non-Horror)',
];
if (!VALID_SUBGENRES.includes(body.subgenre)) {
  return NextResponse.json({ error: 'Invalid subgenre.' }, { status: 400 });
}

// Validate numeric score fields — reject anything outside legal range
const SCORE_LIMITS: Record<string, number> = {
  atmosphere: 2, story: 2,
  characters: 1, pacing: 1, visuals: 1, thrill: 1, sound: 1, impact: 1,
};
for (const [field, max] of Object.entries(SCORE_LIMITS)) {
  const val = body[field];
  if (val !== '' && val !== null && val !== undefined) {
    const n = Number(val);
    if (isNaN(n) || n < 0 || n > max) {
      return NextResponse.json({ error: `Invalid value for ${field}.` }, { status: 400 });
    }
  }
}
```

---

### 1.6 Security Headers (next.config.js)

Add the following to `next.config.js`. This prevents clickjacking, MIME sniffing, and controls referrer leakage:

```javascript
const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires these
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://m.media-amazon.com https://image.tmdb.org",
      // Allow the streaming iframes — scope to known providers only
      "frame-src https://vidsrc.to https://embed.su https://vidsrc.cc https://player.autoembed.cc",
      "connect-src 'self' https://*.supabase.co",
    ].join('; '),
  },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

### 1.7 Session Hardening in Middleware

In `middleware.ts`, add explicit session expiry handling and a redirect-loop guard:

```typescript
// After getSession():
if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', req.url));
}

// Redirect-loop guard: don't redirect /login → /login
if (req.nextUrl.pathname === '/login' && !session) {
  return NextResponse.next();
}
```

---

## PART 2 — STREAMING PAGE: VISUAL & UX IMPROVEMENTS

**IMPORTANT: Do not change any embed URLs, iframe src logic, VideoPlayer fetch chain, or provider fallback code. Streaming works. Only UI changes below.**

### 2.1 Side Rail — Fix Visibility and Mobile Collapse

**Current problem:** The side rail overlaps content on smaller viewports and has no proper mobile behaviour.

```tsx
// StreamSideRail.tsx — replace current layout with this structure

// Desktop (≥1024px): fixed left, 220px wide, full height
// Tablet (768–1023px): fixed left, 64px wide, icons only (no labels)
// Mobile (<768px): hidden by default, slides in as a drawer on hamburger tap

// Tailwind classes for the rail container:
<aside className={`
  fixed left-0 top-0 h-full z-40 bg-[#0a0a0a]
  border-r border-white/[0.07]
  transition-transform duration-300 ease-in-out
  
  w-[220px]                          /* desktop */
  lg:translate-x-0                   /* always visible desktop */
  
  md:w-16                            /* tablet: icon-only */
  
  max-md:w-[220px]                   /* mobile drawer: full width when open */
  max-md:-translate-x-full           /* mobile: hidden by default */
  max-md:data-[open=true]:translate-x-0  /* mobile: visible when open */
`}>
```

Add a hamburger button in the stream page header (mobile only):

```tsx
// Only render on <md breakpoint
<button
  className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center
             bg-black/70 border border-white/10 rounded-full"
  onClick={() => setRailOpen(o => !o)}
  aria-label="Toggle menu"
>
  <Menu size={18} />
</button>

// Overlay when drawer is open (closes on tap)
{railOpen && (
  <div
    className="md:hidden fixed inset-0 bg-black/50 z-30"
    onClick={() => setRailOpen(false)}
  />
)}
```

Pass `data-open={railOpen}` to the `<aside>` element.

---

### 2.2 Hero Carousel — Fix Mobile Cropping

**Current problem:** The carousel is cut off on mobile because the hero height is fixed at 420px and the content overflows without responsive padding.

```tsx
// StreamHero.tsx — replace height classes

// Container:
<div className="
  relative w-full overflow-hidden
  h-[420px]       /* desktop */
  md:h-[340px]    /* tablet */
  h-[260px]       /* mobile: explicit sm: override */
  sm:h-[260px]
">

// Content positioning — ensure text never sits under the side rail:
<div className="
  absolute inset-0 flex flex-col justify-end
  pl-6 pr-6 pb-8           /* mobile */
  md:pl-8 md:pb-10
  lg:pl-10 lg:pb-12
">

// Title size scaling:
<h1 className="
  font-sans font-bold leading-tight
  text-2xl          /* mobile */
  sm:text-3xl       /* tablet */
  lg:text-5xl       /* desktop */
  text-white mb-2
">

// Score — reduce size on mobile to prevent overflow:
<p className="
  font-display
  text-4xl          /* mobile */
  lg:text-6xl       /* desktop */
  text-[#e63232] leading-none
">
  {total}<span className="text-white/50 text-lg font-sans font-normal ml-1">/ 10</span>
</p>

// Buttons — stack vertically on mobile:
<div className="flex flex-wrap gap-3 mt-4">
  <button className="btn-watch ... text-sm px-4 py-2 lg:text-base lg:px-6 lg:py-3">
    Watch Now
  </button>
  <button className="btn-details ... text-sm px-4 py-2 lg:text-base lg:px-6 lg:py-3">
    View Details
  </button>
</div>
```

---

### 2.3 Category Row Scroll — Fix Alignment and Enable Proper Scrolling

**Current problems:** Cards are cut off at edges; rows don't scroll; some rows stick to the viewport edge with no padding.

```tsx
// StreamCategoryRow.tsx — replace scroll container

// Row wrapper — left-offset to clear the side rail on desktop
<section className="
  pl-4 pr-4          /* mobile */
  md:pl-6 md:pr-0    /* tablet */
  lg:pl-8 lg:pr-0    /* desktop — right side allows overflow-scroll to show partial card */
  mb-8
">

// Row header
<div className="flex items-center justify-between mb-3 pr-4">
  <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#a0a0a0]">
    {label}
  </span>
  <button className="text-xs text-[#666] hover:text-white transition-colors">
    See all
  </button>
</div>

// Scroll track — the key fix: padding-right creates the "peek" effect on the last card
// and prevents cards from being glued to the right edge
<div
  ref={scrollRef}
  className="
    flex gap-3 overflow-x-auto
    scroll-smooth
    [scrollbar-width:none] [-webkit-overflow-scrolling:touch]
    [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
    scroll-snap-type-x-mandatory
    pr-6           /* breathing room on right */
    pb-1           /* prevent box-shadow clip */
  "
>
  {entries.map(entry => (
    <div key={entry.id} className="flex-shrink-0 scroll-snap-align-start">
      <StreamCard entry={entry} />
    </div>
  ))}
</div>

// Arrow buttons — only render on lg+, hidden on touch devices
<button
  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2
             w-10 h-10 items-center justify-center
             bg-black/80 border border-white/10 rounded-full
             opacity-0 group-hover:opacity-100 transition-opacity z-10
             -ml-5"  /* half outside the row for overlap effect */
  onClick={() => scroll('left')}
>
  <ChevronLeft size={16} />
</button>
// Mirror for right arrow
```

---

### 2.4 Stream Card — Visual Improvements

**Current problems:** Play icon on card suggests clicking plays inline (it doesn't — it navigates to player page). Replace with an "info" or "view" affordance. Improve label visibility.

```tsx
// StreamCard.tsx — key changes only

// 1. Remove the play button overlay from cards on the home/browse pages.
//    The card click navigates to the detail/player page. The affordance should
//    be "view details", not "play inline". Use a subtle brightness overlay + eye icon instead.

// Hover overlay (replaces play button):
<div className="
  absolute inset-0 bg-black/0 group-hover:bg-black/40
  transition-all duration-200 flex items-center justify-center
">
  <div className="
    opacity-0 group-hover:opacity-100 transition-opacity
    w-10 h-10 rounded-full bg-white/15 border border-white/30
    flex items-center justify-center
  ">
    <Eye size={16} className="text-white" />
  </div>
</div>

// 2. Score badge — always visible (not hover-only), top-right corner
<span className="
  absolute top-2 right-2
  bg-black/75 border border-white/10 rounded
  px-1.5 py-0.5
  font-display text-sm text-white leading-none
">
  +{total}
</span>

// 3. Title and year — ensure they are always legible over gradient
// Strengthen the bottom gradient:
<div className="
  absolute bottom-0 left-0 right-0 h-24
  bg-gradient-to-t from-black/95 via-black/60 to-transparent
  p-3 pt-8
">
  <p className="text-white text-[13px] font-semibold leading-tight line-clamp-2">{title}</p>
  <p className="text-white/50 text-[11px] mt-0.5">{year}</p>
</div>
```

---

### 2.5 Fullscreen Toggle Bug — Fix Exit Fullscreen

**Current problem:** Pressing the fullscreen button enters fullscreen mode but pressing it again does not exit because the button click handler always calls `requestFullscreen` and never checks current state.

```tsx
// VideoPlayer.tsx or wherever the fullscreen button lives

// Replace the current handler with this:
const [isFullscreen, setIsFullscreen] = useState(false);

useEffect(() => {
  const handler = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler); // Safari
  document.addEventListener('mozfullscreenchange', handler);    // Firefox legacy
  document.addEventListener('msfullscreenchange', handler);     // IE legacy
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('msfullscreenchange', handler);
  };
}, []);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen on the player container, not the iframe
    playerContainerRef.current?.requestFullscreen().catch(() => {
      // Fallback: try webkit prefix for Safari
      (playerContainerRef.current as any)?.webkitRequestFullscreen?.();
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else {
      (document as any).webkitExitFullscreen?.(); // Safari
    }
  }
}

// Button UI — reflect current state:
<button
  onClick={toggleFullscreen}
  className="..."
  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
>
  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
</button>
```

---

### 2.6 Stream Page — Norman & Shneiderman Principles Applied

The following changes improve discoverability, feedback, and consistency. These are purely additive — no streaming logic changes.

**Visibility of system status (Norman #1):**
- Add a subtle loading shimmer to stream cards while the poster image loads (`animate-pulse` on a placeholder div, replaced once the image fires `onLoad`)
- Show "Loading..." text in the player header bar while the iframe src is being set
- If a category row has zero streamable entries, do not render the row header either (currently shows an empty row label)

**Affordance and signifiers (Norman #2 + Shneiderman feedback):**
- The side rail active item must have a visible left border and background tint — not just a color change. Ensure `border-l-2 border-[#e63232] bg-[#e63232]/10` is applied to the active link.
- Rail section labels (`MEDIA`, `VAULT`, `MORE`) must be visually distinct from nav items: `text-[9px] tracking-[2px] uppercase text-[#555] mb-1 mt-4 px-3`
- On mobile, the hamburger button must have a visible border so it does not disappear against the dark background

**Consistency (Shneiderman #1):**
- All pill/badge font sizes must be consistent: `text-[11px] font-semibold` throughout the streaming section — no mixing of `text-xs` and `text-sm` on the same element type
- "Watch Now" button color is always `#e63232` (filled red) regardless of page context

**Error prevention (Norman #5):**
- The "Try another source" button should only appear after 4 seconds of the iframe being mounted, not immediately. This prevents users clicking it before the player has had time to load.

```tsx
// In VideoPlayer.tsx — delay the fallback button appearance
const [showFallback, setShowFallback] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setShowFallback(true), 4000);
  return () => clearTimeout(t);
}, [src]); // reset timer whenever src changes

{showFallback && (
  <button onClick={switchSource} className="text-xs text-white/40 hover:text-white/80 ...">
    Not working? Try alternate source
  </button>
)}
```

---

## PART 3 — MOBILE NAVBAR FIX

### 3.1 Top Navbar — Responsive Fix

**Current problem:** The floating pill navbar is cut off on mobile because it uses `left: 50%; transform: translateX(-50%)` but has a fixed `max-width` that exceeds the mobile viewport, or because the pill has inner padding/margin that pushes it outside the safe area.

```tsx
// Navbar.tsx — replace positioning and sizing

// Container (the outer fixed bar):
<nav className="
  fixed top-0 left-0 right-0 z-50
  flex items-center justify-center
  pt-3 pb-2 px-4       /* safe area padding — works on all devices */
  pointer-events-none  /* let clicks pass through to page behind navbar */
">

// Inner pill:
<div className="
  pointer-events-auto
  flex items-center gap-0
  bg-black/70 backdrop-blur-xl
  border border-white/10 rounded-full
  h-11
  
  /* Mobile: full width minus 2×16px margin */
  w-full max-w-[calc(100vw-32px)]
  
  /* Desktop: auto width, centered */
  lg:w-auto lg:max-w-none
  
  px-2
">
```

On mobile, the logo and nav links must not overflow. Apply these rules:

```tsx
// Logo: always visible, never truncated
<Link href="/" className="flex items-center gap-1.5 pl-2 pr-3 shrink-0">
  <span className="text-white/60 text-sm">🌙</span>
  <span className="font-display text-base tracking-widest text-white">VAULT</span>
</Link>

// Divider
<div className="w-px h-5 bg-white/10 shrink-0" />

// Nav links: on mobile show only 2 most important, hide others
// Use `hidden sm:block` on secondary links (Add Movie, Stats)
// Always show: Home, Vault (or Stream)
<Link href="/" className="px-3 py-2 text-sm ... shrink-0">Home</Link>
<Link href="/vault" className="px-3 py-2 text-sm ... shrink-0 hidden sm:block">Vault</Link>
<Link href="/stream" className="px-3 py-2 text-sm ... shrink-0">Stream</Link>
<Link href="/add" className="px-3 py-2 text-sm ... hidden sm:block">Add Movie</Link>
<Link href="/stats" className="px-3 py-2 text-sm ... hidden md:block">Stats</Link>

// Auth chip: always visible on right, shrink-0
<div className="ml-auto pl-2 pr-2 shrink-0">
  {/* guest or user chip */}
</div>
```

### 3.2 Guest vs. Member Affordance

**Current problem:** Unauthenticated visitors cannot tell they are guests. The "Sign In" button in the top-right is too subtle.

Replace the current auth chip with this context-aware component:

```tsx
// AuthChip.tsx

function AuthChip({ user }: { user: User | null }) {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        {/* Guest label — makes guest status explicit */}
        <span className="
          hidden sm:inline-block
          text-[10px] font-semibold tracking-widest uppercase
          text-white/30 border border-white/10 rounded-full
          px-2 py-0.5
        ">
          Guest
        </span>
        <Link
          href="/login"
          className="
            flex items-center gap-1.5
            bg-white text-black text-xs font-semibold
            rounded-full px-3 py-1.5
            hover:bg-white/90 transition-colors
          "
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="
        w-7 h-7 rounded-full bg-[#e63232] flex items-center justify-center
        text-white text-xs font-bold uppercase shrink-0
      ">
        {user.display_name?.[0] ?? user.email?.[0] ?? '?'}
      </div>
      <span className="hidden sm:inline text-sm text-white/80 font-medium">
        {user.display_name ?? user.username}
      </span>
    </div>
  );
}
```

Additionally, on the home page (`/`) hero section, when the user is not authenticated, show a persistent guest notice banner directly below the hero carousel:

```tsx
{!user && (
  <div className="
    w-full bg-white/[0.04] border-y border-white/[0.07]
    py-3 px-4 lg:px-8
    flex items-center justify-between gap-4
  ">
    <p className="text-sm text-white/50">
      You are browsing as a guest. This is Rafayyy's personal horror vault.
    </p>
    <Link href="/login" className="text-sm text-white font-semibold shrink-0 hover:text-[#e63232] transition-colors">
      Sign in →
    </Link>
  </div>
)}
```

---

## PART 4 — PERFORMANCE

### 4.1 Data Fetching — Add Caching to Public Routes

The home page and stream page are public and their data changes rarely. Add Next.js fetch caching:

```typescript
// app/page.tsx and app/stream/page.tsx — server components
// Replace all direct supabase calls with these patterns:

// Owner vault fetch (public, cached 5 minutes):
const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/owner-vault`, {
  next: { revalidate: 300 }, // 5-minute cache
});

// If using direct Supabase in server component, add unstable_cache:
import { unstable_cache } from 'next/cache';

const getOwnerVault = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('entries')
      .select('*, movie:movies(*)')
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });
    return data ?? [];
  },
  ['owner-vault'],
  { revalidate: 300, tags: ['owner-vault'] }
);
```

### 4.2 Image Optimization

In `next.config.js`, add remote image domains so `next/image` can optimize OMDB and TMDB posters instead of serving them raw:

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },   // OMDB posters
      { protocol: 'https', hostname: 'image.tmdb.org' },       // TMDB backdrops
      { protocol: 'https', hostname: 'img.omdbapi.com' },      // OMDB alternate
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
```

Replace any raw `<img>` tags in `MovieCard.tsx`, `StreamCard.tsx`, and `MovieDetail.tsx` with `next/image` using `sizes` attributes:

```tsx
// MovieCard — poster in grid:
<Image
  src={posterUrl}
  alt={`${title} poster`}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px"
  className="object-cover"
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
/>
```

### 4.3 Prefetching

In the streaming hub category rows, prefetch the player page when the user hovers over a card:

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

<div
  onMouseEnter={() => router.prefetch(`/stream/${entry.movie.omdb_id}`)}
  onClick={() => router.push(`/stream/${entry.movie.omdb_id}`)}
>
  <StreamCard entry={entry} />
</div>
```

### 4.4 Reduce Layout Shift on Vault Grid

Currently the vault grid causes CLS (Cumulative Layout Shift) because cards render without their images and then the images pop in. Fix with skeleton placeholders:

```tsx
// VaultSkeleton.tsx — render this while entries are loading
export function VaultSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-lg bg-white/[0.04] animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

// In vault/page.tsx:
<Suspense fallback={<VaultSkeleton />}>
  <MovieGrid entries={entries} />
</Suspense>
```

---

## PART 5 — VERIFICATION CHECKLIST

Run through every item below after implementation. Do not ship until all pass.

### Security
- [ ] Log in as a non-owner member; navigate to any owner entry URL directly (`/vault/[owner-entry-id]`); confirm Edit Ratings and Delete buttons are absent from the UI
- [ ] As a non-owner, send `PATCH /api/movies/[owner-entry-id]` directly (e.g. via curl or Postman); confirm response is 403
- [ ] As a non-owner, send `DELETE /api/movies/[owner-entry-id]`; confirm 403
- [ ] As an unauthenticated user, send any `PATCH` or `DELETE` to `/api/movies/*`; confirm 401
- [ ] Attempt to submit `add-movie` with a subgenre value not in the allowlist (e.g. `"hacked"`); confirm 400
- [ ] Attempt to submit a score of `999` for atmosphere; confirm 400
- [ ] Confirm `X-Frame-Options: SAMEORIGIN` header is present on all page responses (check via browser DevTools → Network → Response Headers)
- [ ] Confirm `Content-Security-Policy` header is present

### Streaming UI
- [ ] On a mobile device (or DevTools mobile simulation at 390px width): carousel is fully visible with no horizontal cropping
- [ ] Side rail collapses to a drawer with a hamburger button on mobile
- [ ] All category rows have consistent left padding — no row is flush to the viewport edge
- [ ] Scrolling a category row works with touch swipe on mobile
- [ ] Entering fullscreen and pressing the fullscreen button again exits fullscreen
- [ ] The "Not working? Try another source" text does not appear until 4 seconds after the player loads
- [ ] Stream cards show eye icon on hover, not play button
- [ ] Score badge is visible on all cards without hovering

### Navbar
- [ ] On 390px viewport, the full navbar pill is visible without horizontal scroll
- [ ] On 390px, logo and auth chip are visible; secondary links are hidden
- [ ] Unauthenticated user sees "Guest" label + white "Sign In" button
- [ ] Authenticated user sees their initial avatar + display name
- [ ] Guest notice banner appears below the hero carousel for unauthenticated users
- [ ] Banner does NOT appear when the user is logged in

### Performance
- [ ] `next build` completes with 0 errors
- [ ] Home page loads without visible CLS on a throttled 3G connection (Chrome DevTools)
- [ ] Vault grid shows skeleton placeholders during the initial data fetch
- [ ] Stream card images do not cause layout shift (use `fill` + `aspect-[2/3]` container)
- [ ] Hovering a stream card prefetches the player route (verify in Network tab: prefetch request fires)
