import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { serverEnv } from '@/server/env';

/**
 * ⚠️  THE ONLY DATABASE ACCESS IN THE ENTIRE PRODUCT.
 *
 * `import 'server-only'` above is the whole reason we merged the repos.
 *
 * If a client component ever imports this file — directly, or transitively
 * through five other imports — Next.js FAILS THE BUILD. Not a warning. Not a
 * lint error you can ignore. The build stops.
 *
 * That is a stronger guarantee than a separate repo gave us. A separate repo
 * relied on a human never copy-pasting a key into the wrong project. This
 * relies on the compiler, which never gets tired at 2am.
 *
 * SERVICE ROLE BYPASSES RLS. Every call site must already have answered
 * "is this person allowed?" via PermissionService. RLS will not answer it here.
 */
let cached: SupabaseClient<Database> | null = null;

export function db(): SupabaseClient<Database> {
  if (!cached) {
    const e = serverEnv();
    cached = createClient<Database>(e.SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/** User-scoped. RLS APPLIES. Defense in depth on read paths. */
export function dbAs(accessToken: string): SupabaseClient<Database> {
  const e = serverEnv();
  return createClient<Database>(e.SUPABASE_URL, e.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
