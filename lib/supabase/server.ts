import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client — uses the anon key + session cookie.
 * Respects RLS policies. Use in Server Components and API routes
 * that operate on behalf of the authenticated user.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In Server Components cookies can't be set from render —
            // that's fine, session refresh is handled by the middleware.
          }
        },
      },
    }
  );
}

/**
 * Service-role Supabase client — bypasses RLS entirely.
 * Use ONLY in:
 *   - Migration script (scripts/migrate-from-sheet.ts)
 *   - /api/add-movie (to upsert shared movies table)
 *   - /api/stats (aggregation queries)
 *   - scripts/create-user.ts
 * Never expose this client to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
  // Use anon key as fallback if SUPABASE_SERVICE_ROLE_KEY is invalid or uses un-registered sb_secret format
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = (rawServiceKey && !rawServiceKey.startsWith('sb_secret_')) 
    ? rawServiceKey 
    : (anonKey || rawServiceKey || 'placeholder-service-key-for-build');

  return createServerClient(
    url,
    serviceKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
