import { NextResponse } from 'next/server';

export const OWNER_ID = process.env.OWNER_USER_ID || '';

/**
 * Returns a 403 response if the authenticated user is attempting
 * to mutate an entry owned by the vault owner.
 * Call this BEFORE any database write in PATCH/DELETE routes.
 */
export function guardOwnerEntry(
  requestingUserId: string,
  entryOwnerId: string
): NextResponse | null {
  if (OWNER_ID && entryOwnerId === OWNER_ID && requestingUserId !== OWNER_ID) {
    return NextResponse.json(
      { error: 'You do not have permission to modify this entry.' },
      { status: 403 }
    );
  }
  return null;
}

const DEFAULT_UNRESTRICTED_EMAILS: string[] = [];

/**
 * Checks if a user has unrestricted access to all genres and media.
 */
export function isUnrestrictedUser(user?: { email?: string | null; id?: string } | null): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase().trim();
  const envEmails = (process.env.UNRESTRICTED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const allAllowed = [...DEFAULT_UNRESTRICTED_EMAILS, ...envEmails];
  if (email && allAllowed.includes(email)) return true;
  if (user.id && process.env.UNRESTRICTED_USER_IDS?.split(',').map(s => s.trim()).includes(user.id)) return true;
  return false;
}
