/**
 * Invite a new user to the vault (owner only).
 *
 * Usage:
 *   npx ts-node scripts/create-user.ts email@example.com username "Display Name"
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock WebSocket to bypass Supabase Realtime check in Node < 22
// @ts-expect-error - WebSocket does not exist on global
global.WebSocket = class {};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createUser(email: string, username: string, displayName: string) {
  console.log(`\n🔑 Inviting ${email} as @${username}…`);

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { username, display_name: displayName },
  });

  if (error) {
    console.error('❌ Invite failed:', error.message);
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`✅ Invite sent → user ID: ${userId}`);

  const { error: profileError } = await supabase.from('profiles').insert({
    id:           userId,
    username:     username.toLowerCase(),
    display_name: displayName,
    role:         'member',
  });

  if (profileError) {
    console.error('⚠️  Invite sent but profile insert failed:', profileError.message);
    console.log('Manually insert into profiles with id =', userId);
    process.exit(1);
  }

  console.log(`✅ Profile created for @${username}`);
  console.log(`📧 ${email} will receive an email to set their password.`);
}

const [email, username, displayName] = process.argv.slice(2);

if (!email || !username || !displayName) {
  console.error('Usage: npx ts-node scripts/create-user.ts <email> <username> "<Display Name>"');
  process.exit(1);
}

createUser(email, username, displayName).catch(err => {
  console.error(err);
  process.exit(1);
});
