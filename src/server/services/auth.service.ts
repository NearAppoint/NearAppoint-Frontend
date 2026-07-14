import 'server-only';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/server/env';
import { ApiError } from '@/server/lib/errors';
import { PermissionService, type Actor } from '@/server/services/permission.service';

/**
 * Verifies the bearer token and resolves the Actor.
 *
 * CRITICAL: this calls `auth.getUser(token)`, which VERIFIES the JWT signature
 * against Supabase. It does NOT decode the token locally and trust the claims.
 *
 * Decoding without verifying is a real auth bypass — a forged token with any
 * `sub` you like would sail straight through. It is a one-line mistake and it
 * is invisible in code review.
 */
export async function authenticate(req: NextRequest): Promise<Actor | null> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7);
  const e = serverEnv();
  const sb = createClient(e.SUPABASE_URL, e.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;

  return PermissionService.resolve(data.user.id);
}

/** Throws if not signed in. */
export async function requireAuth(req: NextRequest): Promise<Actor> {
  const actor = await authenticate(req);
  if (!actor) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
  return actor;
}
