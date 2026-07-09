import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// The placeholder value shipped in .env.local means "not set yet".
const hasServiceKey = serviceKey.length > 0 && !serviceKey.startsWith('PASTE_');

function makeClient(key: string) {
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Route handlers call getServiceSupabase()/getAdminSupabase() repeatedly within a
// single request (and across warm invocations of the same server process) — each
// createClient() call sets up its own internal auth/postgrest/realtime wiring, so
// reusing one instance per key avoids paying that cost on every single query.
let cachedServiceClient: ReturnType<typeof makeClient> | null = null;
let cachedAdminClient: ReturnType<typeof makeClient> | null = null;

/**
 * Server-side Supabase client for API route handlers.
 * Uses the service-role key when configured (bypasses RLS, required for writes
 * and admin actions). Falls back to the anon key so public-read endpoints still
 * work before the service-role key is set.
 */
export function getServiceSupabase() {
  if (!cachedServiceClient) {
    // Public-read endpoints work with the anon key; writes will be blocked by RLS.
    cachedServiceClient = makeClient(hasServiceKey ? serviceKey : anonKey);
  }
  return cachedServiceClient;
}

/** Service-role client with admin privileges (auth.admin operations). */
export function getAdminSupabase() {
  if (!hasServiceKey) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Admin auth operations (staff invites) require it. ' +
        'Set it in .env.local (server-only, never exposed to the client).'
    );
  }
  if (!cachedAdminClient) {
    cachedAdminClient = makeClient(hasServiceKey ? serviceKey : anonKey);
  }
  return cachedAdminClient;
}
