'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search, MapPin, Calendar, LogOut, User, ChevronDown, HelpCircle, Heart, SlidersHorizontal,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';

/**
 * THE HEADER.
 *
 * Search lives in the CENTRE, in the header, on every page. Foodpanda, Careem,
 * Airbnb all do this and they're right: search IS the product. Burying it below
 * a hero on one page and nowhere else means she has to navigate home before she
 * can look for anything.
 *
 * "Explore" and "My bookings" as top-level links are gone. Bookings belong in
 * the account menu with everything else that's about HER — not competing with
 * the one action she's actually here to take.
 *
 * MOBILE: logo, a compact search field, an avatar. Nothing else fits, and
 * nothing else is needed.
 */
export function CustomerNav({
  query, onQuery, onFilters,
}: {
  /** Wire these from /home so the header search IS the search. */
  query?: string;
  onQuery?: (v: string) => void;
  onFilters?: () => void;
} = {}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);
  const [name, setName] = React.useState<string>('');
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [menu, setMenu] = React.useState(false);

  // Local state when the page doesn't own the query (e.g. on a salon profile).
  const [local, setLocal] = React.useState('');
  const q = query ?? local;
  const setQ = onQuery ?? setLocal;

  React.useEffect(() => {
    auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      const m = data.user?.user_metadata ?? {};
      setName(m.full_name ?? m.name ?? data.user?.email?.split('@')[0] ?? '');
      setAvatar(m.avatar_url ?? m.picture ?? null);
    });

    const { data: sub } = auth.onAuthStateChange(async (_e, s) => {
      setSignedIn(!!s?.user);
      const m = s?.user?.user_metadata ?? {};
      setName(m.full_name ?? m.name ?? s?.user?.email?.split('@')[0] ?? '');
      setAvatar(m.avatar_url ?? m.picture ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setMenu(false);
    await auth.signOut();
    router.push('/');
    router.refresh();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // From anywhere else, searching takes her home with the query.
    if (!onQuery) router.push(`/home?q=${encodeURIComponent(q)}`);
  };

  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-warm-line/50 bg-warm/90 backdrop-blur-xl">
      <div className="container flex h-[62px] items-center gap-2 sm:h-[68px] sm:gap-5">

        {/* ---- logo ----
             The NAME is always visible, even on the narrowest phone. A bare mark
             with no wordmark is a logo she doesn't recognise yet — we're too new
             for that. It just shrinks. */}
        <Link href="/home" className="flex flex-none items-center gap-1.5" aria-label="NearAppoint">
          <Image src="/assets/logo-mark.svg" alt="" width={26} height={26}
            className="h-[24px] w-auto sm:h-[29px]" priority />
          <span className="whitespace-nowrap font-display text-[0.88rem] font-extrabold leading-none tracking-[-0.035em] text-warm-ink sm:text-[1.1rem]">
            Near<span className="text-brand">Appoint</span>
          </span>
        </Link>

        {/* ---- SEARCH. The centre of gravity. ---- */}
        <form onSubmit={submit} className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-[420px] items-center gap-2 rounded-full border border-warm-line bg-white px-3 py-2 transition-all focus-within:border-brand focus-within:shadow-[0_2px_14px_rgba(249,115,22,.14)] sm:px-4 sm:py-2.5">
            <Search className="size-[17px] flex-none text-warm-faint" />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 border-0 bg-transparent text-[0.86rem] text-warm-ink placeholder:text-warm-faint focus:outline-none sm:text-[0.9rem]"
            />

            {/* Filters live here — the Foodpanda pattern. Wired when the
                filter sheet lands. */}
            {onFilters && (
              <button type="button" onClick={onFilters} aria-label="Filters"
                className="hidden flex-none rounded-full bg-brand p-2 text-white transition-colors hover:bg-brand-hover sm:block">
                <SlidersHorizontal className="size-[15px]" />
              </button>
            )}

            {/* A city CHIP, not a slogan. It's a filter she can change — the
                product isn't "a Lahore app", it's an app that happens to be
                showing her Lahore right now. */}
            <button type="button"
              className="hidden flex-none items-center gap-1 whitespace-nowrap rounded-full bg-warm-low px-3 py-1.5 text-[0.75rem] font-semibold text-warm-muted transition-colors hover:text-brand md:flex">
              <MapPin className="size-3" /> Near me
            </button>
          </div>
        </form>

        {/* ---- account ---- */}
        <div className="relative flex-none">
          {signedIn ? (
            <>
              <button
                onClick={() => setMenu(!menu)}
                aria-expanded={menu}
                className="flex items-center gap-2 rounded-full border border-warm-line bg-white py-1 pl-1 pr-2 transition-colors hover:border-warm-faint sm:pr-3"
              >
                {avatar ? (
                  <Image src={avatar} alt="" width={30} height={30} unoptimized
                    className="size-[30px] rounded-full object-cover" />
                ) : (
                  <span className="grid size-[30px] place-items-center rounded-full bg-brand-tint font-display text-[0.68rem] font-bold text-brand">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-[90px] truncate font-display text-[0.85rem] font-bold text-warm-ink sm:inline">
                  {name.split(' ')[0]}
                </span>
                <ChevronDown className={cn(
                  'hidden size-3.5 flex-none text-warm-faint transition-transform sm:block',
                  menu && 'rotate-180',
                )} />
              </button>

              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />

                  <div className="absolute right-0 top-full z-50 mt-2 w-[230px] overflow-hidden rounded-[16px] border border-warm-line/60 bg-white py-1.5 shadow-[0_12px_36px_rgba(88,66,55,.16)]">
                    <div className="border-b border-warm-line/40 px-4 pb-3 pt-2">
                      <p className="truncate font-display text-[0.92rem] font-bold text-warm-ink">
                        {name || 'Your account'}
                      </p>
                    </div>

                    <Item href="/bookings" icon={<Calendar className="size-4" />}
                      onClick={() => setMenu(false)}>
                      My bookings
                    </Item>
                    <Item href="/favourites" icon={<Heart className="size-4" />}
                      onClick={() => setMenu(false)}>
                      Saved
                    </Item>
                    <Item href="/account" icon={<User className="size-4" />}
                      onClick={() => setMenu(false)}>
                      Profile
                    </Item>
                    <Item href="/help" icon={<HelpCircle className="size-4" />}
                      onClick={() => setMenu(false)}>
                      Help
                    </Item>

                    <div className="my-1.5 h-px bg-warm-line/40" />

                    <button onClick={() => void signOut()}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-display text-[0.88rem] font-semibold text-warm-muted transition-colors hover:bg-warm-low hover:text-warm-ink">
                      <LogOut className="size-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : signedIn === false ? (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="hidden whitespace-nowrap font-display text-[0.88rem] font-semibold text-warm-ink transition-colors hover:text-brand sm:block">
                Sign in
              </Link>
              <Link href="/signup"
                className="whitespace-nowrap rounded-full bg-brand px-4 py-2.5 font-display text-[0.85rem] font-bold text-white shadow-brand transition-colors hover:bg-brand-hover sm:px-5">
                Sign up
              </Link>
            </div>
          ) : (
            <span className="block size-[38px]" />   /* reserve space, no flicker */
          )}
        </div>
      </div>
    </nav>
  );
}

function Item({ href, icon, children, onClick }: {
  href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 font-display text-[0.88rem] font-semibold text-warm-ink transition-colors hover:bg-warm-low">
      <span className="text-warm-faint">{icon}</span>
      {children}
    </Link>
  );
}
