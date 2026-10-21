import BrowseGrid from '@/components/browse/BrowseGrid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUnrestrictedUser } from '@/lib/guards';

// Public discovery page. Guests can browse and open info pages; the player
// itself (/stream/<id>) stays members-only (enforced in proxy.ts).
export default async function StreamPage() {
  let user = null;
  try {
    const supabase = await createServerSupabaseClient();
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    // Supabase unreachable — render the guest view.
  }

  return <BrowseGrid canSave={!!user} isUnrestricted={isUnrestrictedUser(user)} />;
}
