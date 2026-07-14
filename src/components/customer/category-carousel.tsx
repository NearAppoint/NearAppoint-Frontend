'use client';
import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Scissors, Sparkles, Hand, Flower2, Leaf, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cat {
  slug: string;
  name: string;
  tagline: string;
  banner: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * The six niches. In order.
 *
 * ALL SIX ARE LIVE. We launch when the whole platform is ready, not one
 * category at a time — a marketplace that shows four "Coming soon" tiles is a
 * marketplace that looks unfinished, and nobody trusts an unfinished
 * marketplace with their Saturday.
 *
 * TAGLINES ARE HONEST. "Cuts, colour, beard & grooming" tells her what she can
 * book. "Look your best" tells her nothing and is what every competitor says.
 */
const CATEGORIES: Cat[] = [
  {
    slug: 'hair_salon',
    name: 'Hair Salons',
    tagline: 'Cuts, colour, styling, beard & grooming',
    banner: '/images/banner-hair-salon.webp',
    icon: Scissors,
  },
  {
    slug: 'beauty_parlor',
    name: 'Beauty Parlors',
    tagline: 'Makeup, facials, threading, waxing & bridal',
    banner: '/images/banner-beauty-parlor.webp',
    icon: Sparkles,
  },
  {
    slug: 'nail_studio',
    name: 'Nail Studios',
    tagline: 'Manicure, pedicure, gel & nail art',
    banner: '/images/banner-nail-studio.webp',
    icon: Hand,
  },
  {
    slug: 'mehndi_studio',
    name: 'Mehndi Studios',
    tagline: 'Bridal, party & occasion mehndi',
    banner: '/images/banner-mehndi-studio.webp',
    icon: Flower2,
  },
  {
    slug: 'wellness',
    name: 'Wellness Centers',
    tagline: 'Spa, massage, therapy & relaxation',
    banner: '/images/banner-wellness.webp',
    icon: Leaf,
  },
  {
    slug: 'aesthetic_clinic',
    name: 'Aesthetic Clinics',
    tagline: 'Skin treatments & consultations',
    banner: '/images/banner-aesthetic-clinic.webp',
    icon: Sparkle,
  },
];

const INTERVAL = 5000;

/**
 * THE CATEGORY CAROUSEL.
 *
 * Auto-slides every 5 seconds. Tapping a banner filters the search below it.
 *
 * Three things it does deliberately:
 *
 *   1. PAUSES ON HOVER. A carousel that keeps moving while she's reading it is
 *      hostile — she reaches for a banner and it slides away.
 *
 *   2. STOPS FOR GOOD once she interacts. If she's taken control, we don't
 *      wrestle it back off her.
 *
 *   3. RESPECTS prefers-reduced-motion. Auto-moving content is a genuine
 *      accessibility problem for some people, not a style preference.
 */
export function CategoryCarousel({ active, onPick }: {
  active: string | null;
  onPick: (slug: string | null) => void;
}) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const reduced = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  React.useEffect(() => {
    if (paused || touched || reduced) return;
    const t = setInterval(() => setI(n => (n + 1) % CATEGORIES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, touched, reduced]);

  const go = (n: number) => {
    setTouched(true);
    setI((n + CATEGORIES.length) % CATEGORIES.length);
  };

  const c = CATEGORIES[i]!;
  const Icon = c.icon;

  return (
    <div className="mb-9">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="group relative overflow-hidden rounded-[18px] bg-warm-low sm:rounded-[22px]"
      >
        {/* Slides. All mounted, opacity-crossfaded — so the next banner is
            already decoded and there is no flash of empty box. */}
        <div className="relative aspect-[16/9] w-full sm:aspect-[3/1] sm:min-h-[240px]">
          {CATEGORIES.map((cat, n) => (
            <button
              key={cat.slug}
              onClick={() => onPick(active === cat.slug ? null : cat.slug)}
              aria-hidden={n !== i}
              tabIndex={n === i ? 0 : -1}
              className={cn(
                'absolute inset-0 cursor-pointer text-left transition-opacity duration-700',
                n === i ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              {/* NO SCRIM. The banner is finished artwork — washing it out with a
                  white gradient defeats the point of commissioning it. The text
                  sits on its own solid panel instead, so the art stays intact. */}
              <Image
                src={cat.banner}
                alt=""
                fill
                priority={n === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}

          {/* The text sits on its OWN card, floating over the art. The banner
              stays fully visible; the copy stays fully readable. Neither has to
              compromise for the other. */}
          <div className="pointer-events-none absolute inset-0 flex items-center p-4 sm:p-7">
            <div className="pointer-events-auto max-w-[300px] rounded-[16px] bg-white/92 p-5 shadow-[0_6px_24px_rgba(88,66,55,.12)] backdrop-blur-sm sm:max-w-[340px] sm:p-6">
              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-warm-low px-2.5 py-1 font-display text-[0.62rem] font-bold uppercase tracking-[0.08em] text-brand">
                <Icon className="size-3" />
                Book now
              </span>

              <h2 className="font-display text-[clamp(1.15rem,2.4vw,1.7rem)] font-extrabold leading-tight tracking-[-0.02em] text-warm-ink">
                {c.name}
              </h2>

              <p className="mt-1.5 text-[0.85rem] leading-snug text-warm-muted">
                {c.tagline}
              </p>

              <button
                onClick={() => onPick(active === c.slug ? null : c.slug)}
                className={cn(
                  'mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-[0.85rem] font-bold transition-colors',
                  active === c.slug
                    ? 'bg-warm-ink text-white'
                    : 'bg-brand text-white hover:bg-brand-hover',
                )}
              >
                {active === c.slug ? 'Showing these' : 'Explore'}
              </button>
            </div>
          </div>
        </div>

        {/* arrows — only on hover, on desktop */}
        <button
          onClick={() => go(i - 1)}
          aria-label="Previous"
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white/90 p-2.5 text-warm-ink opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 sm:grid"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => go(i + 1)}
          aria-label="Next"
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white/90 p-2.5 text-warm-ink opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 sm:grid"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* dots */}
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {CATEGORIES.map((cat, n) => (
            <button
              key={cat.slug}
              onClick={() => go(n)}
              aria-label={cat.name}
              className={cn(
                'h-1.5 rounded-full transition-all',
                n === i ? 'w-6 bg-brand' : 'w-1.5 bg-warm-faint/40 hover:bg-warm-faint',
              )}
            />
          ))}
        </div>
      </div>

      {/* The pills stay. The carousel is a shop window; the pills are the
          filter. She should be able to pick a category without waiting for it
          to come round. */}
      <div className="no-scrollbar -mx-1 mt-5 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map(({ slug, name, icon: Icon }) => (
          <button
            key={slug}
            onClick={() => onPick(active === slug ? null : slug)}
            className={cn(
              'inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[0.86rem] transition-all',
              active === slug
                ? 'border-brand bg-brand font-semibold text-white shadow-brand'
                : 'border-warm-line bg-white text-warm-ink hover:border-brand hover:text-brand',
            )}
          >
            <Icon className="size-4 flex-none" />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
