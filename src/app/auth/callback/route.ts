import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/server/database/client';

export const dynamic = 'force-dynamic';

/**
 * Google sends the user back here with a `code`. We exchange it for a session
 * and create their profile.
 *
 * ⚠️  WHY THE PROFILE IS CREATED HERE, NOT BY A TRIGGER
 *
 * The original design put an AFTER INSERT trigger on auth.users. That broke
 * ALL logins with "Database error querying schema" — Supabase's auth service
 * queries auth.users during login, and a trigger on that table that touches
 * public schema objects makes the Go auth server choke on a dependency it
 * cannot resolve. The error tells you nothing, and it takes hours to find.
 *
 * auth.users belongs to Supabase. DO NOT PUT TRIGGERS ON IT.
 *
 * So we create the profile here instead — in our own code, where a failure is
 * visible and debuggable.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') ?? '/home';
  const origin = req.nextUrl.origin;

  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`);

  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) =>
          list.forEach(({ name, value, options }) => store.set(name, value, options as never)),
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`,
    );
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};

  /**
   * Google signup = CUSTOMER. Always.
   *
   * There is no self-serve business signup. Businesses are created by hand,
   * after we've met them and seen the shop. That manual step IS the
   * verification gate — no junk listings, and no aesthetic clinic quietly
   * signing itself up and listing Botox.
   *
   * upsert, not insert: if a BUSINESS owner signs in with Google using the same
   * email, we must not downgrade her account to 'customer'. `do nothing` on
   * conflict protects that.
   */
  const { error: profileError } = await db()
    .from('user_profiles')
    .upsert(
      {
        id: user.id,
        account_type: 'customer',
        full_name: meta.full_name ?? meta.name ?? null,
        email: user.email ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  if (profileError) {
    console.error('[auth/callback] profile creation failed', { userId: user.id, profileError });
    return NextResponse.redirect(`${origin}/login?error=profile_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
