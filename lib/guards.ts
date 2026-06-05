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
