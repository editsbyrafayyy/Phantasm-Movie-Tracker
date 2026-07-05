# Movie Tracker

A private movie and TV tracking app built for me and my friends, combining a shared watch history, ratings log, and recommendation tool in one place.

This project started as a way to move our group's movie tracking off spreadsheets and group chats and into something with real metadata, posters, and stats pulled from TMDB and OMDB. It also served as a hands-on learning project for building a full-stack app with Next.js and Supabase.

## Features

- **Vault** — our collective log of watched movies and shows, with personal ratings, notes, and scores
- **Watchlist** — save what's next, remove it once it's watched
- **Browse** — discover new titles via TMDB, with mood-based recommendations and a hero carousel of trending content
- **Add / Update flow** — search OMDB/TMDB and pull in accurate metadata instead of entering it manually
- **Stats and Vault Wrapped** — a year-in-review style breakdown of viewing habits: genre spread, score distributions, top rated titles, and more
- **Roulette** — a random picker for when the group can't decide what to watch
- **Profile and Admin tools** — account management, password resets, and an admin panel for managing users
- **Legacy migration tooling** — scripts to import historical data from an old Google Sheet, using Google Apps Script and a Node migration script

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Database / Auth:** Supabase
- **Movie/TV Data:** TMDB API, OMDB API
- **Styling:** Tailwind CSS
- **Stats/Charts:** Custom components (genre donut, score histograms, distributions)
- **Legacy tooling:** Google Apps Script (one-time Sheets migration)

## Note on Setup and Reuse

This repo is shared for portfolio and learning purposes only.

It relies on private services (a Supabase project, API keys, admin accounts, and friend-group data) that are not included here, and a few features are intentionally built around my friend group rather than general users. Because of that:

- No `.env` file, setup steps, or deployment instructions are included
- The code is not licensed for reuse, redistribution, or self-hosting
- Feel free to browse the code and structure for reference, but this is not intended to be run as a template

## License

All rights reserved. This code is shared for portfolio purposes only and is not licensed for reuse, modification, or redistribution.
