import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    realtime: {
      // @ts-expect-error - ws typing is slightly incompatible with WebSocketsLikeConstructor
      transport: ws,
    },
  }
);

async function main() {
  const { data, error } = await supabase
    .from('entries')
    .select('id, user_id, movie_id, movie:movies (title, omdb_id, media_type)')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Result structure:', JSON.stringify(data?.[0], null, 2));
  }
}

main();
