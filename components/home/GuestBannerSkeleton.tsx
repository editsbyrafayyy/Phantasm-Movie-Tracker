'use client';

import { useSyncExternalStore } from 'react';

// Written by MobileBottomNav once auth resolves ("was signed in last visit").
const SESSION_HINT_KEY = 'vault_has_session';
const noopSubscribe = () => () => {};
function readSignedIn(): boolean {
  try { return localStorage.getItem(SESSION_HINT_KEY) === 'true'; } catch { return false; }
}

/** Placeholder for the home page's guest notice; skipped when the browser was signed in last time. */
export default function GuestBannerSkeleton() {
  const signedIn = useSyncExternalStore(noopSubscribe, readSignedIn, () => false);
  if (signedIn) return null;
  return (
    <div className="guest-notice-banner" aria-hidden="true">
      <div className="skeleton home-skel-banner-text" />
      <div className="skeleton home-skel-banner-btn" />
    </div>
  );
}
