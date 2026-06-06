# VAULT — Project Memory & State Tracker

This file serves as the context and history log for AI agents working on the Vault project. It tracks the current status, latest completed tasks, and upcoming execution steps.

## Project Context
- **Name:** VAULT — Horror Film Tracker
- **Owner Username:** `Rafayyy` (email: `rafayatherk@gmail.com`)
- **Owner User ID:** `69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0`
- **Goal:** A curated collection of horror films, scored across 8 criteria, with public guest viewing of the owner's vault, a member-only streaming hub, movie ratings/logging logs, and visualizations.

---

## Current Status (As of June 6, 2026)

### Latest Accomplishments
- Revamped the Movie Detail page (`/vault/[id]`):
  - Merged Overview, Cast, and Similar tabs into a single scrollable flow.
  - Nested the Cast and Similar sections directly inside the main Overview column of the grid as inline subsections.
  - Added actor character name labels to cast cards.
  - Hydrated the database by running the metadata refresh script (`refresh-backdrops.ts`) to query TMDB and populate the new cast format (with roles and profile paths) for all 266+ films.
  - Centered the main grid within a `1200px` max-width container, and added left padding to the inline subsections (`32px` desktop / `16px` mobile) to prevent them from sticking to the edges.
  - Constrained layout grid columns using `minmax(0, ...)` and applied `min-width: 0` on the main column to contain horizontal-scrolling rows and prevent the sidebar panel from being pushed off-screen.
  - Enabled custom horizontal scrollbars on desktop viewports (using pointer-hover media queries) for `.cast-row`, `.similar-row`, `.browse-scroll-track`, and `.category-scroll-track` to support mouse scrolling, while keeping them hidden on touch devices.
  - Restored the "Back to Vault" button container (`.detail-back-bar`) to left-aligned full-width positioning (`left: 0; width: 100%`) so it aligns perfectly with the title and content left margin (`48px` desktop / `24px` mobile) on all screen resolutions instead of centering, and updated its destination to link to `/` (Rafay's Movies guest landing page) instead of `/vault`.
  - Shifted the featured hero carousel navigation arrows (`.hero-arrow`) closer to the top (`top: 30%`) in `app/globals.css` to prevent collisions with titles and overlays on desktop and tablet banners.
  - Symmetrically aligned left padding (`48px` desktop / `24px` mobile) for page content and the back navigation link.
  - Added a `max-width: 680px` limit to the synopsis/plot block for better readability.
- Unified homepage navigation:
  - Replaced the legacy homepage header with `<StreamRail />`, resolving layout inconsistencies.
  - Ensured the "Rafay's Movies" navigation link is active and properly directs users to `/`.
- Fixed visual bugs in mobile layout:
  - Ensured long genres fit inside custom select dropdown menus by scaling them with `width: max-content !important` and adding support for right-alignment (`align="right"`).
  - Adjusted "Home" routes in sidebars and bottom navbars to point to the root landing page `/` (personal vault library) instead of the stream page.
  - Eliminated transparent seepage/gaps at the bottom of the mobile navbar by translating its bottom coordinates (`bottom: -10px`) and compensating with matching padding heights.
  - Centered top navbar navigation pill links (`Stream`, `Browse`, `Your Vault →` / `Sign In`) on mobile header layouts and hid the text logo to prevent button overflow.
  - Prevented horizontal scrolling on mobile viewports for the stats page: set `.page-container` padding-left/right to 0, truncated long text values on tiles using ellipsis, set histograms to 1-column layouts, and resolved implicit CSS Grid column overflows.
  - Completed production build check (`npm run build`) successfully with no TypeScript compilation errors.
- Unified App Navigation (Section 2):
  - Removed left vertical sidebar (`StreamRail`) completely from all screens.
  - Built a unified top horizontal navbar in `StreamRail.tsx` featuring the logo, direct links (`Browse`, `Stream`, `Your Vault`), and a custom profile dropdown menu for desktop screens.
  - Configured the top navbar to show **logo only** on mobile screens, and set `justify-content: center` to center it cleanly.
  - Updated the mobile bottom navigation bar in `MobileBottomNav.tsx` to follow the requested items and order: `Vault` (links to `/`), `Browse` (`/browse`), `Stream` (`/stream`), `Log Film` (`/add`, auth only), and `Profile` (`/profile`).
  - Added explicit Next.js `<Link>` `prefetch={true}` attributes on all primary navigation links for hover-based prefetching and instant response.
  - Deleted the redundant `components/Navbar.tsx` pill component.
- Login Redirect (Section 3):
  - Updated the default post-login redirect in `app/login/page.tsx` from `/vault` to `/` (the root landing page).
  - Updated the auth-only redirect in `proxy.ts` to bounce authenticated users who hit `/login` back to `/` instead of `/vault`.
- Stats & Profile Merge (Section 5):
  - Converted `/profile` into a Server Component.
  - Fetches the user session, profile, and movie entries on the server, enhancing security and moving logic off the client.
  - Built a new client-side `<ProfileEdit />` display name editing form to maintain interactive profile modifications.
  - Sequentially embedded all rated movie statistics widgets (`SummaryStrip`, `GenreDonut`, `RecommendBars`, `TopRatedList`, `ScoreDistribution`, and `ScoreHistograms`) directly under the profile card in a single, clean scrollable layout.
  - Added a server-side redirect from the legacy `/stats` route to `/profile`.

---

## Active Sprint Scope (From SPRINT_FIXES.md)

We are implementing fixes from the **Sprint Fix Brief** (`SPRINT_FIXES.md`) one-by-one. The scope includes:
1. **Performance — Page Transition Lag & Loading States**
   - Add `loading.tsx` to all routes missing them (`/vault`, `/browse`, `/stats`, `/profile`, `/vault/[id]`, `/stream`, `/add`).
   - Implement route-level caching (`cache: 'force-cache'` or `next: { revalidate: 3600 }`).
   - Enable `prefetch={true}` on primary `<Link>` elements.
   - Use parallel fetches with `Promise.all` in the movie detail page.
   - Add global `<NProgress>` top loading bar.
   - Audit and remove unnecessary `'use client'` components.
2. **Navigation — Inconsistency Across Pages & Devices**
   - Eliminate left sidebar (`StreamRail`) completely.
   - Consolidate all navigation into a unified top navbar.
   - Mobile: show logo only in header, move "Stream" to bottom navbar.
   - Bottom navbar order: **Vault** (goes to `/`) | **Browse** | **Stream** | **Log Film** | **Profile**.
3. **Login Redirect**
   - Success redirect goes to `/` instead of `/stream` or `/browse`.
4. **Movie Detail Page — Layout & Content**
   - Merge Cast and Similar tabs into a single scrollable Overview page.
   - Fetch actor character names from TMDB credits.
   - Add padding-left space and cap text lines to `max-width: 680px`.
   - Shrink "Back to Vault" button to a secondary ghost style.
5. **Stats & Profile Merge**
   - Merge `/stats` into `/profile` as a single scrollable page.
   - Update navigation items and add redirects from `/stats` to `/profile`.
6. **Security — Client-Side Data Exposure**
   - Move client-side data fetches to server components.
   - Prevent secret leaks in client bundles.
   - Secure API endpoints using server-side auth session checks.
   - Add rate limiting and auth validation to streaming proxy.

---

## Execution Guidelines
- **Rule:** Implement **only 1 fix at a time**, then stop for user verification before proceeding to the next fix.
- Always verify the project builds and runs without errors.
