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

  /* Swipe. On a phone she will try it, and a carousel that ignores a swipe
     feels broken in a way she can't articulate — she'll just stop using it. */
  const touch = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches[0]!.clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current === null) return;
    const dx = e.changedTouches[0]!.clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) < 45) return;   // a tap, not a swipe
    go(dx < 0 ? i + 1 : i - 1);
  };

  const c = CATEGORIES[i]!;
  const Icon = c.icon;

  return (
    <div className="mb-9">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="group relative touch-pan-y select-none overflow-hidden rounded-[18px] bg-warm-low sm:rounded-[22px]"
      >
        {/* Slides.
            All mounted, opacity-crossfaded — the next banner is already decoded,
            so there's no flash of empty box when it comes round. */}
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/6] lg:aspect-[3/1]">
          {CATEGORIES.map((cat, n) => (
            <div
              key={cat.slug}
              aria-hidden={n !== i}
              className={cn(
                'absolute inset-0 transition-opacity duration-700',
                n === i ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              {/*
                THE ART IS NOT CROPPED.

                object-cover chops the sides on a narrow screen — on mobile you
                lose two-thirds of an illustration someone paid to have drawn.

                object-contain shows ALL of it, letterboxed against the warm
                background. The banner was composed as a whole; we show it as a
                whole.
              */}
              <Image
                src={cat.banner}
                alt=""
                fill
                priority={n === 0}
                sizes="100vw"
                className="object-contain object-right"
              />
            </div>
          ))}

          {/*
            TEXT ON THE LEFT.

            The banners were drawn with the objects clustered right and the left
            third quiet — so the copy sits in the space the art already leaves
            for it, on the background, not on top of the illustration.

            No card, no scrim, no blur. Nothing covering the artwork.
          */}
          <div className="absolute inset-y-0 left-0 flex w-[54%] flex-col justify-center pl-5 pr-2 sm:w-[46%] sm:pl-9 lg:w-[40%] lg:pl-12">
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.08em] text-brand shadow-sm sm:mb-3 sm:text-[0.64rem]">
              <Icon className="size-3" />
              Book now
            </span>

            <h2 className="font-display text-[clamp(1rem,3.4vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-warm-ink">
              {c.name}
            </h2>

            <p className="mt-1 max-w-[26ch] text-[clamp(0.68rem,1.5vw,0.92rem)] leading-snug text-warm-muted">
              {c.tagline}
            </p>

            <button
              onClick={() => onPick(active === c.slug ? null : c.slug)}
              className={cn(
                'mt-3 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 font-display text-[0.75rem] font-bold transition-colors sm:mt-4 sm:px-5 sm:py-2.5 sm:text-[0.86rem]',
                active === c.slug
                  ? 'bg-warm-ink text-white'
                  : 'bg-brand text-white shadow-brand hover:bg-brand-hover',
              )}
            >
              {active === c.slug ? 'Showing these' : 'Explore'}
            </button>
          </div>
        </div>

        {/* arrows — only on hover, on desktop */}
        {/* Arrows are desktop-only. On mobile she swipes, and a button sitting
            over the artwork would just be in the way. */}
        <button
          onClick={() => go(i - 1)}
          aria-label="Previous"
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white/95 p-2.5 text-warm-ink opacity-0 shadow-lg transition-opacity hover:bg-white group-hover:opacity-100 lg:grid"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => go(i + 1)}
          aria-label="Next"
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white/95 p-2.5 text-warm-ink opacity-0 shadow-lg transition-opacity hover:bg-white group-hover:opacity-100 lg:grid"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:left-auto sm:right-5 sm:translate-x-0">
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
