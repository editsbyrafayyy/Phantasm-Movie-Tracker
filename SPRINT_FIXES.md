# VAULT — Sprint Fix Brief
**For:** Antigravity Dev Team  
**Prepared by:** Rafay  
**Priority:** High — Production Issues  

---

## Overview

This document outlines all current issues in the VAULT web app that need to be resolved. Issues span performance, navigation consistency, UI/UX, security, and HCI principles. Each section includes context, the problem, and the expected outcome.

---

## 1. Performance — Page Transition Lag & Loading States

**Problem:**  
Page transitions across the app have 3–4 second delays with no visual feedback. Users have no indication anything is happening, which violates basic HCI feedback principles (Nielsen's Heuristic #1: Visibility of System Status).

**Required fixes:**

- Implement Next.js `loading.tsx` files for every route that does not already have one (`/vault`, `/browse`, `/stats`, `/profile`, `/vault/[id]`, `/stream`, `/add`). Each should show a lightweight skeleton or spinner consistent with the app's dark theme.
- Enable aggressive route-level caching. All server components fetching static or semi-static data (movie metadata, cast info, TMDB data) should use `fetch` with `cache: 'force-cache'` or `next: { revalidate: 3600 }`.
- Use Next.js `<Link>` prefetching — ensure `prefetch={true}` is set on all primary nav links (Vault, Browse, Stream) so pages are pre-fetched on hover.
- For the movie detail page (`/vault/[id]`), pre-fetch cast and similar movie data in a single parallel `Promise.all` server-side call rather than sequential fetches.
- Add a global `<NProgress>`-style top loading bar (e.g. `nextjs-toploader`) so users always see progress feedback during navigation.
- Audit and remove any unnecessary `'use client'` directives. Components that only render static data should be server components.

---

## 2. Navigation — Inconsistency Across Pages & Devices

**Problem:**  
The app currently has three competing navigation patterns: a left sidebar (`StreamRail`), a top pill navbar (`home-header`), and a mobile fixed header (`mobile-header`). This is inconsistent across pages and especially broken on iOS devices where the mobile header does not match the home page header.

**Required fixes — Unified Top Navbar:**

- **Remove the left sidebar (`StreamRail`) entirely.** Consolidate all navigation into a single top navbar used across every page of the app.
- The top navbar should follow the existing `home-header` / `mobile-header` pattern already established on the home page and replicate it consistently on `/browse`, `/stream`, `/vault`, `/stats`, `/profile`, and all sub-pages.
- Desktop top navbar items (left to right): **VAULT logo** | **Browse** | **Stream** | **Your Vault** | **Profile** (avatar/dropdown with Sign Out).
- Remove the `Navbar.tsx` pill component (currently only shown on `/login`) and fold sign-in/sign-out into the unified navbar's auth state.

**Mobile top navbar:**  
- Show **logo only** in the top bar on mobile (no nav buttons cluttering the header).
- Move the **Stream** button to the bottom navigation bar.
- Bottom nav bar items: **Vault Home** | **Browse** | **Stream** | **Profile**.

**Bottom navbar changes:**  
- Rename "Home" to **"Vault"** (or "My Vault") — it should navigate to the main vault home page (`/`), not the streaming home.
- Remove **"Ratings"** from the bottom navbar entirely — it is redundant with Vault.
- Add **"Stream"** to the bottom navbar in place of Ratings.
- Final bottom nav order: **Vault** | **Browse** | **Stream** | **Log Film** | **Profile**.

---

## 3. Login Redirect — Wrong Landing Page

**Problem:**  
After logging in, users are redirected to the Stream/Browse page instead of their Vault home page (`/`).

**Required fix:**  
- In the auth callback / login success handler, change the redirect destination from `/stream` or `/browse` to `/` (the vault home page with the user's rated movies).

---

## 4. Movie Detail Page — Layout & Content

### 4a. Cast + Similar merged into Overview

**Problem:**  
The Cast and Similar tabs are separate sections requiring extra taps to access. This adds unnecessary navigation steps and fragments content that should be discoverable in one scroll (violates HCI principle of minimal steps to information).

**Required fix:**  
- Remove the Cast and Similar tabs.
- Merge both sections into the Overview tab as clearly titled subsections:
  - **"Cast"** section with actor cards showing: actor photo, actor name, and **character name** below (pull character name from TMDB credits endpoint — `character` field in `cast[]` array).
  - **"More Like This"** section with the existing similar movies grid.
- The Overview tab should now be a single scrollable page: Synopsis → Cast → More Like This.

### 4b. Text layout — too cluttered and left-aligned

**Problem:**  
All movie detail text (title, synopsis, metadata) is pushed hard to the left edge with no breathing room. The "Back to Vault" button is also oversized.

**Required fix:**  
- Add `padding-left: 48px` (desktop) / `padding-left: 24px` (mobile) to the detail content container.
- Cap the synopsis and metadata text at `max-width: 680px` so it doesn't stretch across the full viewport on wide screens.
- Reduce the "Back to Vault" button to a smaller ghost/text style — it should be a secondary element, not a primary CTA. Suggested: small pill with a back arrow icon, font-size 13–14px, no heavy fill.

---

## 5. Stats + Profile — Merge into Single Page

**Problem:**  
Stats and Profile are separate pages but conceptually belong together. Having both in the nav adds cognitive load.

**Required fix:**  
- Merge `/stats` into `/profile` — the Profile page should contain both user account info (display name, avatar, preferences) and all stats content (score distribution, genre donut, top rated, etc.) in a single scrollable page.
- In all nav bars (top and bottom), replace both "Stats" and "Profile" entries with a single **"Profile"** item pointing to `/profile`.
- Remove `/stats` as a standalone route (add a redirect from `/stats` to `/profile` for any existing links).

---

## 6. Security — Client-Side Data Exposure

**Problem:**  
Several data-fetching operations and sensitive logic are running client-side (`'use client'`) when they should be server-side. This can expose API keys, internal data structures, and unvalidated data to the browser.

**Required fixes:**  
- Audit every `'use client'` component. Any component that fetches from `/api/` routes or directly from Supabase/TMDB/OMDB should be converted to a **server component** unless it genuinely requires browser APIs or React state.
- TMDB API key, OMDB API key, and Supabase service role key must **never** appear in client bundles. Verify with `next build` that no secrets leak into `/_next/static/chunks/`.
- Move all Supabase data fetches in vault/stats pages to server components using the server-side Supabase client (`@/lib/supabase/server`).
- Any API route that returns sensitive user data should validate the session server-side before returning a response — do not rely on client-passed user IDs.
- Review `/api/stream/[imdbId]/route.ts` — streaming proxy routes should have rate limiting and auth checks before serving content.

---

## 7. HCI Principles Checklist

The following HCI principles should be validated across the entire app as part of this sprint:

| Principle | Check |
|---|---|
| **Visibility of system status** | Every async action (page load, form submit, search) shows a loading indicator |
| **Match between system and real world** | Nav labels use plain language ("My Vault", not "Vault Entry") |
| **User control and freedom** | Every detail/sub page has a clearly visible back navigation |
| **Consistency and standards** | Single navbar pattern across all pages and devices |
| **Error prevention** | Form inputs (Add Movie, Edit Ratings) validate before submission |
| **Recognition over recall** | Active nav item is always highlighted; user never has to guess where they are |
| **Flexibility and efficiency** | Prefetching and caching reduce wait time for returning users |
| **Aesthetic and minimalist design** | No redundant nav items (Ratings removed, Stats merged) |
| **Help users recover from errors** | 404 and error states have a clear path back to home |

---

## Summary — Files Likely Touched

| File | Change |
|---|---|
| `components/layout/StreamRail.tsx` | Remove or repurpose — sidebar eliminated |
| `components/Navbar.tsx` | Consolidate into unified top navbar |
| `components/layout/MobileBottomNav.tsx` | Update items: Vault, Browse, Stream, Log Film, Profile |
| `app/globals.css` | Remove sidebar layout rules, clean up mobile header conflicts |
| `app/login/page.tsx` | Fix post-login redirect to `/` |
| `app/stats/page.tsx` | Merge into `/profile`, add redirect |
| `app/profile/page.tsx` | Add stats content |
| `app/vault/[id]/page.tsx` | Merge Cast + Similar into Overview, fix layout padding |
| `components/vault/MovieDetailV3.tsx` | Remove tabs, add cast character names, padding fix |
| `app/**/loading.tsx` | Add skeleton loaders for all missing routes |
| `lib/tmdb.ts` | Ensure cast character field is returned |
| `app/api/**` | Add auth checks and rate limiting |
| All server-fetchable components | Remove `'use client'`, move to server components |
