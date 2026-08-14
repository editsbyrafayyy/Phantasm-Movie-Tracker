import { redirect } from 'next/navigation';
import BrowseGrid from '@/components/browse/BrowseGrid';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function StreamPage() {
  // Auth check — streaming catalog is members only
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/stream');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <BrowseGrid canSave={!!user} />
    </div>
  );
}

