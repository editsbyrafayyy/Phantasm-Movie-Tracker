'use client';

/**
 * WatchProgressTracker — records playback progress for "Continue watching".
 *
 * The player (VideoPlayerClient) creates the `vault_watch_history` entry when it
 * mounts, but it only understands flat progress messages. VidLink and similar
 * embeds post nested shapes:
 *   { type: 'PLAYER_EVENT', data: { event, currentTime, duration, mtmdbId?, season?, episode? } }
 *   { type: 'MEDIA_DATA',   data: { [tmdbId]: { progress: { watched, duration }, show_progress?, ... } } }
 * This component listens for those (plus flat shapes) on player routes only and
 * adds progress to the SAME history entry. It never touches the player itself,
 * only adds fields to the stored entry, and never throws.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PROVIDERS } from '@/lib/providers';

const HISTORY_KEY = 'vault_watch_history';
const WRITE_INTERVAL_MS = 5000;
const COMPLETE_AT = 90; // percent
/** How far before route entry the player's own history write may be stamped. */
const ENTRY_SLACK_MS = 15000;

interface StoredEntry {
  id: string;
  type?: string;
  watchedAt?: number;
  progress?: number;
  currentTime?: number;
  duration?: number;
  completed?: boolean;
  season?: number;
  episode?: number;
  [key: string]: unknown;
}

interface ProgressUpdate {
  currentTime?: number;
  duration?: number;
  progress?: number; // 0-100
  ended?: boolean;
  mediaId?: string;
  season?: number;
  episode?: number;
}

// ── Allowed origins: provider domains (and their subdomains) ────────────────
const PROVIDER_DOMAINS: string[] = (() => {
  const domains = new Set<string>();
  for (const p of PROVIDERS) {
    try {
      const host = new URL(p.movieUrl('tt0000000', '0')).hostname.toLowerCase();
      domains.add(host.replace(/^www\./, ''));
    } catch { /* skip malformed provider URL */ }
  }
  return [...domains];
})();

function isProviderOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return PROVIDER_DOMAINS.some(d => host === d || host.endsWith(`.${d}`));
  } catch { return false; }
}

// ── Message parsing ─────────────────────────────────────────────────────────
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};
const idStr = (v: unknown): string | undefined => {
  if (typeof v === 'string' && v) return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
};

const ENDED_EVENTS = new Set(['ended', 'complete', 'completed', 'finish', 'finished']);

function toPercent(v: number | undefined): number | undefined {
  if (v === undefined || v < 0) return undefined;
  return v <= 1 ? v * 100 : Math.min(v, 100);
}

/** Flat or PLAYER_EVENT-style payload: { event?, currentTime|time, duration, progress? } */
function parseFlat(d: Obj): ProgressUpdate | null {
  const event = typeof d.event === 'string' ? d.event.toLowerCase()
    : typeof d.type === 'string' ? d.type.toLowerCase() : '';
  const update: ProgressUpdate = {
    currentTime: num(d.currentTime) ?? num(d.time) ?? num(d.position),
    duration:    num(d.duration),
    progress:    toPercent(num(d.progress) ?? num(d.percentage) ?? num(d.percent)),
    ended:       ENDED_EVENTS.has(event) || undefined,
    mediaId:     idStr(d.mtmdbId) ?? idStr(d.tmdbId) ?? idStr(d.tmdb_id),
    season:      num(d.season),
    episode:     num(d.episode),
  };
  if (!update.duration || update.duration <= 0) { update.duration = undefined; update.currentTime = undefined; }
  const hasTime = update.currentTime !== undefined && update.duration !== undefined;
  return hasTime || update.progress !== undefined || update.ended ? update : null;
}

/** MEDIA_DATA: { [tmdbId]: { progress: { watched, duration }, last_updated, show_progress? } } */
function parseMediaData(d: Obj, targetId: string): ProgressUpdate | null {
  let key: string | undefined = isObj(d[targetId]) ? targetId : undefined;
  if (!key) {
    // Target id isn't a TMDB id (e.g. IMDb-only entry): use the most recently updated item.
    let best = -1;
    for (const [k, v] of Object.entries(d)) {
      const t = isObj(v) ? num(v.last_updated) ?? 0 : -1;
      if (t > best) { best = t; key = k; }
    }
  }
  const item = key ? d[key] : undefined;
  if (!isObj(item)) return null;

  let source: unknown = item.progress;
  let season: number | undefined;
  let episode: number | undefined;
  const s = num(item.last_season_watched);
  const e = num(item.last_episode_watched);
  if (s !== undefined && e !== undefined && isObj(item.show_progress)) {
    const ep = item.show_progress[`s${s}e${e}`];
    if (isObj(ep) && isObj(ep.progress)) { source = ep.progress; season = s; episode = e; }
  }
  if (!isObj(source)) return null;
  const watched = num(source.watched);
  const duration = num(source.duration);
  if (watched === undefined || !duration) return null;
  return { currentTime: watched, duration, mediaId: key, season, episode };
}

function parseMessage(raw: unknown, targetId: string): ProgressUpdate | null {
  let data = raw;
  if (typeof data === 'string') {
    if (!data.startsWith('{')) return null;
    try { data = JSON.parse(data); } catch { return null; }
  }
  if (!isObj(data)) return null;

  const type = typeof data.type === 'string' ? data.type : '';
  if (type === 'MEDIA_DATA') return isObj(data.data) ? parseMediaData(data.data, targetId) : null;

  for (const nestedKey of ['data', 'payload', 'detail']) {
    const nested = data[nestedKey];
    if (isObj(nested)) {
      const parsed = parseFlat(nested);
      if (parsed) return parsed;
    }
  }
  return parseFlat(data);
}

// ── Storage ─────────────────────────────────────────────────────────────────
function readHistory(): StoredEntry[] | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : null;
  } catch { return null; }
}

/** The entry for this route: exact id match, else the one the player just wrote. */
function findEntryIndex(list: StoredEntry[], routeId: string, enteredAt: number): number {
  const exact = list.findIndex(e => e && e.id === routeId);
  if (exact !== -1) return exact;
  let idx = -1;
  let newest = enteredAt - ENTRY_SLACK_MS;
  list.forEach((e, i) => {
    const t = typeof e?.watchedAt === 'number' ? e.watchedAt : 0;
    if (t >= newest) { newest = t; idx = i; }
  });
  return idx;
}

function percentOf(u: ProgressUpdate): number | undefined {
  if (u.currentTime !== undefined && u.duration && u.duration > 0) {
    return Math.min(100, (u.currentTime / u.duration) * 100);
  }
  return u.progress;
}

// ── Component ───────────────────────────────────────────────────────────────
const PLAYER_ROUTE = /^\/stream\/(?!tmdb(?:\/|$))([^/]+)\/?$/;

export default function WatchProgressTracker() {
  const pathname = usePathname();
  const match = pathname ? PLAYER_ROUTE.exec(pathname) : null;
  let routeId: string | null = null;
  if (match) {
    try { routeId = decodeURIComponent(match[1]); } catch { routeId = match[1]; }
  }

  useEffect(() => {
    if (!routeId) return;
    const enteredAt = Date.now();
    let pending: ProgressUpdate | null = null;
    let lastWrite = 0;
    let completionWritten = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const write = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      const update = pending;
      pending = null;
      if (!update) return;
      try {
        const list = readHistory();
        if (!list) return;
        const idx = findEntryIndex(list, routeId, enteredAt);
        if (idx === -1) return;
        const entry = list[idx];
        // A message about a different title (stale frame) — ignore.
        if (update.mediaId && /^\d+$/.test(entry.id) && update.mediaId !== entry.id) return;

        const pct = percentOf(update);
        const isTv = entry.type === 'tv';
        const next: StoredEntry = { ...entry, watchedAt: Date.now() };
        if (pct !== undefined) next.progress = Math.round(pct);
        if (update.currentTime !== undefined) next.currentTime = Math.round(update.currentTime);
        if (update.duration !== undefined) next.duration = Math.round(update.duration);
        if (isTv) {
          // Episode progress only: one finished episode doesn't finish a show.
          if (update.season !== undefined) next.season = update.season;
          if (update.episode !== undefined) next.episode = update.episode;
        } else if (update.ended || (pct !== undefined && pct >= COMPLETE_AT)) {
          next.completed = true;
          next.progress = 100;
        }
        list[idx] = next;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        lastWrite = Date.now();
        if (update.ended || (pct !== undefined && pct >= COMPLETE_AT)) completionWritten = true;
      } catch { /* storage full / blocked — progress is best-effort */ }
    };

    const onMessage = (event: MessageEvent) => {
      try {
        if (!isProviderOrigin(event.origin)) return;
        const update = parseMessage(event.data, routeId);
        if (!update) return;
        // Merge so a later message without season/episode keeps the earlier ones.
        pending = { ...(pending ?? {}), ...Object.fromEntries(
          Object.entries(update).filter(([, v]) => v !== undefined),
        ) } as ProgressUpdate;
        const pct = percentOf(pending);
        const urgent = !completionWritten && (pending.ended || (pct !== undefined && pct >= COMPLETE_AT));
        const wait = WRITE_INTERVAL_MS - (Date.now() - lastWrite);
        if (urgent || wait <= 0) write();
        else if (!timer) timer = setTimeout(write, wait);
      } catch { /* never let a provider message break the page */ }
    };

    const onHide = () => write();
    window.addEventListener('message', onMessage);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', onHide);
      write(); // flush on route change
    };
  }, [routeId]);

  return null;
}
