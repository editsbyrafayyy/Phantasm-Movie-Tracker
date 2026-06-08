import { createServerClient } from '@supabase/ssr';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createServerClient(url, serviceKey, {
  cookies: { getAll: () => [], setAll: () => {} },
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const { data, error } = await serviceClient.from('profiles').select('*');
  console.log('Profiles data:', data);
  if (error) console.error('Error:', error);
}
run();
