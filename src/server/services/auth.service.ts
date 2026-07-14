import 'server-only';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ApiError } from '@/server/lib/errors';
import { PermissionService, type Actor } from '@/server/services/permission.service';

/**
 * WHO IS ASKING?
 *
 * Two ways in, and we accept both — because the app uses both:
 *
 *   1. COOKIE   — a browser page calling fetch('/api/v1/...'). Same origin, so
 *                 the session cookie rides along automatically. This is how
 *                 every screen in the Business OS talks to the API.
 *
 *   2. BEARER   — an explicit Authorization header. Used by the API client, and
 *                 by anything that isn't a browser (mobile, later).
 *
 * The original version only read the header, so every page in the Business OS
 * got a 401 while being perfectly logged in. Cookies first, header as fallback.
 *
 * CRITICAL, both paths: we call `auth.getUser(token)`, which VERIFIES the JWT
 * signature with Supabase. We never decode a token locally and trust its claims
 * — a forged token with any `sub` you like would sail straight through. That is
 * a one-line mistake and it is invisible in code review.
 */
export async function authenticate(req: NextRequest): Promise<Actor | null> {
  // ---- 1. Cookie session (how the browser talks to us) ---------------------
  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: () => {
          /* Route handlers can't set cookies here; middleware refreshes them. */
        },
      },
    },
  );

  const { data: cookieUser } = await supabase.auth.getUser();
  if (cookieUser.user) {
    return PermissionService.resolve(cookieUser.user.id);
  }

  // ---- 2. Bearer token (API clients, mobile) -------------------------------
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7);
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;

  return PermissionService.resolve(data.user.id);
}

/** Throws if not signed in. First line of every protected route. */
export async function requireAuth(req: NextRequest): Promise<Actor> {
  const actor = await authenticate(req);
  if (!actor) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
  return actor;
}
