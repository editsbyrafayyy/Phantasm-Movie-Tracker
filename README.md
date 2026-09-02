# Phantasm (Vault)

A full-stack movie and television tracking platform built with Next.js (App Router), TypeScript, and Supabase. Combines shared watch history, multi-axis weighted scoring, personalized analytics, discovery feeds, and group watchlists in a unified interface.

---

## Overview

This project was developed to replace ad-hoc spreadsheets and group chat logs with a centralized media tracker featuring rich metadata, automated poster/backdrop ingestion, statistical breakdowns, and interactive browsing.

Key application highlights:
- Multi-dimensional rating criteria across eight distinct film qualities.
- Dynamic analytics dashboard and annual viewing summaries.
- Algorithmic mood-based recommendation engine.
- Real-time catalog search and metadata enrichment via TMDB and OMDB APIs.
- Role-based access control and Row Level Security (RLS).

---

## Key Features

### The Vault
- Centralized database of watched movies and TV series with search, subgenre tags, and custom filters.
- Detailed single-title views displaying director, runtime, cast, release year, plot summary, and user ratings.
- Role-protected entries allowing personal reviews, rewatch logs, and private notes.

### Multi-Axis Scoring System
- Custom weighted evaluation rubric spanning 8 distinct criteria:
  - Atmosphere (0 to 2)
  - Story & Writing (0 to 2)
  - Characters & Acting (0 to 1)
  - Pacing & Flow (0 to 1)
  - Visuals & Cinematography (0 to 1)
  - Thrill & Engagement (0 to 1)
  - Sound Design & Score (0 to 1)
  - Emotional Impact (0 to 1)
- Optional bonus points and categorical verdicts (Peak, Yes, No, Garbage).

### Browse and Mood Engine
- Browse trending and popular titles using live TMDB integration.
- Mood-based filtering engine matching emotional tones and themes to catalog entries.
- Media roulette for randomized selection from watchlists or unwatched recommendations.

### Analytics and Wrapped
- Interactive charts detailing subgenre distribution, rating drift over time, and score histograms.
- Personalized taste fingerprints and summary metrics across total hours watched.
- Year-in-review summary generated from logged timestamps.

### Administration and Data Ingestion
- Automated OMDB and TMDB lookup pipelines for metadata and high-resolution posters.
- Profile and user management with granular access control.
- Historical data migration utilities for legacy spreadsheet imports.

---

## Tech Stack

- **Framework:** Next.js (App Router, Server and Client Components)
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security)
- **APIs:** The Movie Database (TMDB), Open Movie Database (OMDB)
- **Styling:** Tailwind CSS, custom CSS animations, Framer Motion
- **Data Visualization:** Custom SVG and canvas chart components

---

## Project Structure

```text
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── api/              # Backend endpoints (search, movies, lists, stats)
│   ├── browse/           # TMDB discovery and mood exploration views
│   ├── diary/            # Chronological viewing logs
│   ├── stats/            # Analytics and visual charts
│   ├── stream/           # Media player and detail views
│   └── vault/            # Core catalog and title details
├── components/           # Modular React UI components
│   ├── browse/           # Carousels, mood pickers, and category rows
│   ├── home/             # Feeds, widgets, and roulette picker
│   ├── layout/           # Navigation, auth wrappers, and shortcuts
│   ├── stats/            # Distribution bars, heatmaps, and charts
│   ├── stream/           # Video player clients and detail drawers
│   └── vault/            # Filter bars, movie cards, and rating dialogs
├── lib/                  # Shared utilities, API clients, and calculations
│   ├── moodEngine.ts     # Recommendation heuristics
│   ├── omdb.ts           # OMDB API client
│   ├── supabase/         # Supabase client and server session utilities
│   └── tmdb.ts           # TMDB API client
└── scripts/              # Database migrations and schema definitions
```

---

## Portfolio Notice

This repository is shared for portfolio and code review purposes only.

It relies on private infrastructure, environment configurations, and protected database instances. No sensitive keys, database credentials, or private configuration files are included.

---

## License

All rights reserved. This source code is shared for portfolio demonstration and is not licensed for public redistribution, modification, or commercial hosting.
