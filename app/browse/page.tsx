import BrowseGrid from '@/components/browse/BrowseGrid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUnrestrictedUser } from '@/lib/guards';

export default async function BrowsePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isUnrestricted = isUnrestrictedUser(user);

  return <BrowseGrid canSave={!!user} isUnrestricted={isUnrestricted} />;
}


