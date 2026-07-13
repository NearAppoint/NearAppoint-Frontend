'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

/**
 * ⚠️  AUTH ONLY. THIS IS DELIBERATE AND IT IS THE POINT.
 *
 * The Supabase client below is created, its `.auth` namespace is exported,
 * and the client itself is THROWN AWAY. What you get back has:
 *
 *      signInWithOtp()   verifyOtp()   getSession()   signOut()   ...
 *
 * and it does NOT have:
 *
 *      .from()   .rpc()   .storage
 *
 * You cannot query a table from this repo. Not because you shouldn't — because
 * the method does not exist on the object you are handed. There is no code
 * review to forget, no rule to remember, no new developer to brief.
 *
 * ALL DATA COMES FROM api.nearappoint.com. See src/lib/api-client.ts.
 *
 * (The anon key is public by design. RLS protects the database. But we do not
 * rely on RLS alone — we simply do not give this repo a way to reach the data.)
 */
function raw() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** The ONLY Supabase surface this repo may touch. */
export const auth = {
  /** Send an OTP. Backend decides WhatsApp vs SMS; we just ask. */
  requestOtp: (phone: string) => raw().auth.signInWithOtp({ phone }),

  verifyOtp: (phone: string, token: string) =>
    raw().auth.verifyOtp({ phone, token, type: 'sms' }),

  signInWithGoogle: (redirectTo: string) =>
    raw().auth.signInWithOAuth({ provider: 'google', options: { redirectTo } }),

  getSession: () => raw().auth.getSession(),

  /** Verifies the JWT with Supabase. Do NOT use getSession() for authorization. */
  getUser: () => raw().auth.getUser(),

  signOut: () => raw().auth.signOut(),

  onAuthStateChange: (cb: Parameters<ReturnType<typeof raw>['auth']['onAuthStateChange']>[0]) =>
    raw().auth.onAuthStateChange(cb),

  /** The bearer token we hand to the API client. */
  async accessToken(): Promise<string | null> {
    const { data } = await raw().auth.getSession();
    return data.session?.access_token ?? null;
  },
};
