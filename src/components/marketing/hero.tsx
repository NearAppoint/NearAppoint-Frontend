'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Star, Search, Check, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { SITE } from '@/config/site';

const EASE = [0.2, 0.8, 0.2, 1] as const;

const AVATARS = [
  { i: 'A', c: '#F97316' }, { i: 'S', c: '#0EA5E9' }, { i: 'M', c: '#8B5CF6' },
  { i: 'Z', c: '#10B981' }, { i: 'H', c: '#EC4899' },
];

/**
 * Product facts, not statistics.
 *
 * The hero used to sit under a "★ Pakistan's #1 Appointment Marketplace" pill.
 * Per src/config/site.ts the real numbers are zero businesses and zero
 * customers, so "#1" was a claim we cannot back — and MASTER is explicit that
 * we never ship invented proof. These three are things the product does, which
 * stay true on launch day with one salon signed up.
 */
const PROOF = ['Real availability', 'No phone calls', 'Instant confirmation'];

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <header className="aurora-warm relative overflow-hidden bg-warm py-[70px] lg:py-[90px]">
      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.08fr_1fr]">
        {/* The single hero entrance. Children share one stagger rather than each
            animating on its own timer — otherwise the pill, the headline and the
            buttons all race and it reads as jitter rather than intent. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.07 } } }}
        >
          <HeroLine>
            <Pill>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Launching in {SITE.cities[0]}
              </span>
            </Pill>
          </HeroLine>

          <HeroLine>
            <h1 className="my-5 max-w-[12ch]">
              Book Local Services, <span className="text-brand">Instantly.</span>
            </h1>
          </HeroLine>

          <HeroLine>
            <p className="max-w-[44ch] text-[1.03rem] leading-relaxed text-warm-muted">
              Discover nearby salons, clinics, and wellness centers. Compare prices,
              check availability, and book in seconds — no calls, no waiting.
            </p>
          </HeroLine>

          <HeroLine>
            <div className="my-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="cursor-pointer">
                <Link href="/signup">Book an Appointment <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="cursor-pointer">
                <Link href="#business">For Businesses</Link>
              </Button>
            </div>
          </HeroLine>

          <HeroLine>
            {SITE.showStats ? <RatingProof /> : <ProductProof />}
          </HeroLine>
        </motion.div>

        <motion.div
          data-reveal
          className="relative"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : 0.12, ease: EASE }}
        >
          <PhoneMock />
          <FloatCard className="left-[-46px] top-14 max-md:left-[-14px]" icon={<Zap className="size-3.5" />}
            title="Instant Book" sub="1 booking left" />
          <FloatCard className="bottom-24 right-[-40px] [animation-delay:1.6s] max-md:right-[-10px]"
            icon={<Star className="size-3.5 fill-current" />} title="4.9 Rating" sub="Verified reviews" />
        </motion.div>
      </div>
    </header>
  );
}

/** One line of the hero's staggered entrance. Geometry is constant; see reveal.tsx. */
function HeroLine({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-reveal
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.5, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** What the product does. No numbers, so nothing here can go stale or be wrong. */
function ProductProof() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {PROOF.map((p) => (
        <li key={p} className="inline-flex items-center gap-1.5 text-[0.84rem] text-warm-muted">
          <Check className="size-3.5 flex-none text-brand" strokeWidth={3} /> {p}
        </li>
      ))}
    </ul>
  );
}

/** Only renders once SITE.stats holds numbers that are actually true. */
function RatingProof() {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <div className="flex">
        {AVATARS.map((a, i) => (
          <span
            key={a.i}
            style={{ background: a.c, marginLeft: i === 0 ? 0 : -9 }}
            className="grid size-8 place-items-center rounded-full border-2 border-white font-display text-[0.68rem] font-bold text-white"
          >
            {a.i}
          </span>
        ))}
      </div>
      <div>
        <div className="text-[0.82rem] tracking-widest text-brand" aria-hidden>★★★★★</div>
        <p className="mt-0.5 text-[0.82rem] text-warm-muted">
          <b className="font-display font-bold text-warm-ink">{SITE.stats.rating}/5</b> from{' '}
          <b className="font-display font-bold text-warm-ink">{SITE.stats.businesses}</b> reviews
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- the live app */

const SLOTS = ['11:00', '11:30', '12:00', '12:30', '1:00', '1:30', '2:00', '2:30', '3:00'];
/** Some times are gone. A grid where everything is free doesn't look like a real salon. */
const TAKEN = ['11:30', '12:30', '2:30'];
const PICKED = '1:00';

/** How long each beat of the loop holds, in ms. Indexed by step. */
const STEP_MS = [1400, 1100, 900, 2200];

/**
 * The hero's live element: the booking actually happening.
 *
 *   0  browsing — every open time on offer
 *   1  she picks 1:00
 *   2  confirming
 *   3  confirmed
 *
 * Reduced motion freezes it at step 0, which is a coherent screen on its own —
 * the salon, its real availability, and a Book Now button. Nobody gets a
 * half-finished state, and there is no flash on hydration because the loop and
 * the static case share the same first render.
 */
function useBookingLoop(enabled: boolean) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEP_MS.length), STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, enabled]);

  return step;
}

function PhoneMock() {
  const reduced = useReducedMotion();
  const step = useBookingLoop(!reduced);

  const selected = step >= 1;
  const confirming = step === 2;
  const confirmed = step === 3;

  return (
    <div className="mx-auto w-[264px] rounded-[38px] bg-[#0B1729] p-[9px] shadow-lg">
      <div className="relative h-[500px] overflow-hidden rounded-[30px] bg-warm">
        <div className="absolute left-1/2 top-2 z-10 h-[18px] w-[84px] -translate-x-1/2 rounded-[20px] bg-[#0B1729]" />

        <div className="flex items-center justify-between px-[18px] pb-1 pt-2.5 font-display text-[0.62rem] font-bold text-warm-ink">
          <span className="tnum">9:41</span><span>▮▮▮ ▮</span>
        </div>

        <div className="px-3 pb-3">
          <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-warm-line bg-white px-2.5 py-2 text-[0.64rem] text-warm-faint">
            <Search className="size-2.5" /> Search salons, clinics…
          </div>

          {/* The business she's booking. Stays put all loop — the screen is not
              a slideshow, it's one booking progressing. */}
          <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-warm-line bg-white p-2">
            <div className="grid size-[26px] flex-none place-items-center rounded-[7px] bg-brand font-display text-[0.6rem] font-extrabold text-white">
              GS
            </div>
            <div>
              <b className="block font-display text-[0.6rem] font-bold text-warm-ink">Glow Studio</b>
              <small className="text-[0.5rem] text-warm-faint">Hair Salon · 0.8 km</small>
            </div>
            <div className="ml-auto text-right">
              <b className="text-[0.55rem] text-brand">★ 4.9</b>
              <small className="tnum block text-[0.46rem] text-warm-faint">Rs 1,500</small>
            </div>
          </div>

          <p className="mb-2 font-display text-[0.6rem] font-bold text-warm-ink">Select a time</p>
          <div className="mb-3 grid grid-cols-3 gap-1">
            {SLOTS.map((s) => (
              <Slot
                key={s}
                label={s}
                taken={TAKEN.includes(s)}
                active={selected && s === PICKED}
                reduced={!!reduced}
              />
            ))}
          </div>

          <BookButton confirming={confirming} confirmed={confirmed} reduced={!!reduced} />
        </div>
      </div>
    </div>
  );
}

function Slot({ label, taken, active, reduced }: {
  label: string; taken: boolean; active: boolean; reduced: boolean;
}) {
  if (taken) {
    return (
      <span className="tnum rounded border border-warm-line bg-warm-low py-1 text-center font-mono text-[0.42rem] text-warm-faint line-through">
        {label}
      </span>
    );
  }

  return (
    <motion.span
      className={`tnum rounded border py-1 text-center font-mono text-[0.42rem] ${
        active ? 'border-brand bg-brand font-semibold text-white' : 'border-warm-line bg-white text-warm-muted'
      }`}
      // Scale, not size — a width/height change here would reflow the grid and
      // shove the button below it down half a pixel every 1.4 seconds.
      animate={{ scale: active && !reduced ? 1.06 : 1 }}
      transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
    >
      {label}
    </motion.span>
  );
}

function BookButton({ confirming, confirmed, reduced }: {
  confirming: boolean; confirmed: boolean; reduced: boolean;
}) {
  const label = confirmed ? 'Confirmed' : confirming ? 'Confirming…' : 'Book Now';

  return (
    <motion.div
      className={`flex h-[30px] items-center justify-center gap-1 rounded-lg text-center font-display text-[0.63rem] font-bold text-white ${
        confirmed ? 'bg-ok' : 'bg-brand'
      }`}
      animate={{ scale: confirming && !reduced ? 0.97 : 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
    >
      {/*
        Keyed remount, deliberately NOT <AnimatePresence mode="wait">.

        With mode="wait" this button froze on "Book Now" forever: it renders
        only the outgoing child until that child's exit animation reports back,
        and that hand-off never completed here — so the label stuck at its
        first value while the button behind it went green. A label that
        contradicts its own button is worse than no transition at all.

        Changing the key unmounts the old span and mounts a new one, which
        replays initial -> animate as a fade-up. No exit, nothing to wait on,
        nothing to hang.
      */}
      <motion.span
        key={label}
        className="inline-flex items-center gap-1"
        initial={{ opacity: 0, y: reduced ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.16, ease: EASE }}
      >
        {confirmed && <Check className="size-3" strokeWidth={3} />}
        {label}
      </motion.span>
    </motion.div>
  );
}

function FloatCard({ icon, title, sub, className }: {
  icon: React.ReactNode; title: string; sub: string; className?: string;
}) {
  return (
    <div className={`absolute z-10 flex animate-bob items-center gap-2.5 rounded-[11px] border border-warm-line bg-white px-3 py-2.5 shadow ${className}`}>
      <span className="grid size-[26px] flex-none place-items-center rounded-lg bg-brand-tint text-brand">{icon}</span>
      <div>
        <b className="block font-display text-[0.68rem] font-bold leading-tight text-warm-ink">{title}</b>
        <small className="text-[0.58rem] text-warm-faint">{sub}</small>
      </div>
    </div>
  );
}
