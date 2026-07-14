'use client';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MapPin, SlidersHorizontal } from 'lucide-react';
import { BusinessCard, type BusinessCardData } from '@/components/customer/business-card';
import { CategoryCarousel } from '@/components/customer/category-carousel';
import { CustomerNav } from '@/components/customer/customer-nav';

/**
 * HOME.
 *
 * BANNERS FIRST. No hero, no headline, no "Find and book near you."
 *
 * A hero is what you show someone who doesn't know what your product is. She's
 * signed in and looking for a haircut — she knows. Making her scroll past a
 * slogan to reach the thing she came for is a tax on every single visit.
 *
 * Search lives in the HEADER, on every page. It IS the product.
 */
function HomeInner() {
  const params = useSearchParams();

  const [q, setQ] = React.useState(params.get('q') ?? '');
  const [cat, setCat] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<BusinessCardData[] | null>(null);
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Location is asked for once, on first search — not on page load.
   *
   * Asked in context, at the moment the benefit is obvious, acceptance is
   * several times higher. Asked on arrival, she says no, and you never get
   * another chance.
   */
  React.useEffect(() => {
    if (coords || !navigator.geolocation) return;
    const t = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => { /* she said no. We just won't show distances. */ },
        { timeout: 6000 },
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [coords]);

  const search = React.useCallback(async () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (cat) p.set('category', cat);
    if (coords) { p.set('lat', String(coords.lat)); p.set('lng', String(coords.lng)); }

    try {
      const r = await fetch(`/api/v1/public/search?${p}`);
      const j = await r.json();

      if (!r.ok) {
        setError(j.error?.title ?? 'Search isn\u2019t working right now.');
        setResults([]);
        return;
      }

      setError(null);
      setResults(j.data ?? []);
    } catch {
      setError('Couldn\u2019t reach the server. Check your connection.');
      setResults([]);
    }
  }, [q, cat, coords]);

  React.useEffect(() => {
    const t = setTimeout(() => void search(), 220);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      {/* The header owns the search box. One search, everywhere. */}
      <CustomerNav query={q} onQuery={setQ} />

      <div className="container py-6 sm:py-8">
        {/* BANNERS. First thing she sees. */}
        <CategoryCarousel active={cat} onPick={setCat} />

        {/* results */}
        {error ? (
          <div className="rounded-[20px] border border-red-200 bg-red-50 p-8 text-center sm:p-10">
            <h2 className="mb-2.5 font-display text-[1.25rem] font-extrabold tracking-tight text-red-800">
              Something went wrong.
            </h2>
            <p className="mx-auto max-w-[44ch] text-[0.94rem] leading-relaxed text-red-700">
              {error}
            </p>
            <button onClick={() => void search()}
              className="mt-5 rounded-full bg-brand px-6 py-3 font-display text-[0.9rem] font-bold text-white">
              Try again
            </button>
          </div>
        ) : results === null ? (
          <div className="grid place-items-center py-20 text-warm-faint">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-[20px] border border-warm-line/60 bg-white p-10 text-center sm:p-14">
            <h2 className="mb-3 font-display text-[1.4rem] font-extrabold tracking-tight text-warm-ink">
              {q || cat ? 'Nothing matched that.' : 'We\u2019re just getting started in Lahore.'}
            </h2>
            <p className="mx-auto max-w-[46ch] text-[0.96rem] leading-relaxed text-warm-muted">
              {q || cat
                ? 'Try a different search, or clear the filters to see everyone.'
                : 'We\u2019re onboarding our first businesses in person, one at a time \u2014 so that when you book a 6pm slot, it\u2019s really there.'}
            </p>
            {(q || cat) && (
              <button onClick={() => { setQ(''); setCat(null); }}
                className="mt-6 rounded-full bg-brand px-6 py-3 font-display text-[0.9rem] font-bold text-white">
                Show everyone
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.92rem] text-warm-muted">
                <b className="tnum font-display font-bold text-warm-ink">{results.length}</b>
                {' '}{results.length === 1 ? 'place' : 'places'}
                {coords ? ' near you' : ' in Lahore'}
              </p>

              {/* Sort and filters land here next — the Foodpanda rail. */}
              <button
                className="inline-flex items-center gap-2 rounded-full border border-warm-line bg-white px-4 py-2 font-display text-[0.84rem] font-semibold text-warm-ink transition-colors hover:border-brand hover:text-brand"
              >
                <SlidersHorizontal className="size-3.5" /> Filters
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(b => <BusinessCard key={b.slug} b={b} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function CustomerHome() {
  return (
    <React.Suspense fallback={
      <div className="grid min-h-[60vh] place-items-center text-warm-faint">
        <Loader2 className="size-6 animate-spin" />
      </div>
    }>
      <HomeInner />
    </React.Suspense>
  );
}
