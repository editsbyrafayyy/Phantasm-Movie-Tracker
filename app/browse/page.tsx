import BrowseGrid from '@/components/browse/BrowseGrid';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function BrowsePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <BrowseGrid canSave={!!user} />;
}

