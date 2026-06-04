# Horror Movie Tracker — Web App
### Planning Documents

This folder contains the complete planning suite for the web app. Read them in this order:

---

## Documents

### 1. [`PRD.md`](./PRD.md) — Product Requirements Document
*What the app is, what it does, and what it looks like.*

Covers: problem statement, goals, pages & screens, functional requirements, design system (colours, typography, background effects, components), navigation, and open questions.

### 2. [`TECH_SPEC.md`](./TECH_SPEC.md) — Technical Specification
*How it's built and deployed.*

Covers: stack choices, full project file structure, environment variables, column mapping, API route logic, Google Sheets client code, Tailwind config, key component specs, passcode gate, Vercel deployment steps, and npm dependencies.

### 3. [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md) — Google Sheets API Setup
*How to connect the app to your sheet.*

Step-by-step guide: creating a Google Cloud project, enabling the Sheets API, creating a service account, generating credentials, sharing your sheet, and wiring up the env vars locally and on Vercel.

---

## Build Order (once you're ready to code)

```
Phase 1 — Scaffold
  npx create-next-app@latest horror-tracker --typescript --tailwind --app
  Install: npm install googleapis

Phase 2 — Config & Types
  lib/config.ts      ← column map, subgenres, score fields
  lib/types.ts       ← shared types
  lib/sheets.ts      ← Google Sheets API client

Phase 3 — API Route
  app/api/add-movie/route.ts  ← POST handler, duplicate check, append row

Phase 4 — Background & Navbar
  components/StarField.tsx
  components/HeroBackground.tsx
  components/Navbar.tsx

Phase 5 — Hero Page
  app/page.tsx       ← headline, subtext, CTA button

Phase 6 — Add Movie Form
  components/ScoreField.tsx
  components/RecommendPills.tsx
  components/BonusToggle.tsx
  components/Toast.tsx
  components/AddMovieForm.tsx
  app/add/page.tsx

Phase 7 — Polish & Deploy
  styles/globals.css  ← CSS variables, font imports, animations
  app/not-found.tsx
  .env.example
  Vercel deployment
```

---

## Design Reference

- Background: deep near-black (`#080808`), animated star canvas, grain texture overlay
- Light beam: bottom-left diagonal soft gradient
- Concentric arcs + glowing orb: bottom-center SVG
- Navbar: fixed, frosted glass (`backdrop-filter: blur(12px)`)
- Typography: **Bebas Neue** (logo/numbers) · **DM Sans** (UI/body) · **Playfair Display italic** (hero accent word)
- CTA button: white pill, dark text, arrow →
- Form: dark glassmorphism card on the same starfield background

---

## Key Decision — Sorting

The web app **appends** rows rather than inserting alphabetically. The sheet will be unsorted until `sortMovies()` is run from the Apps Script sidebar on desktop. This keeps the API simple. A note is shown in the UI after a successful add.
