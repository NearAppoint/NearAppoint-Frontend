'use client';
import Link from 'next/link';
import { ArrowRight, Zap, Star, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { SITE } from '@/config/site';

const AVATARS = [
  { i: 'A', c: '#F97316' }, { i: 'S', c: '#0EA5E9' }, { i: 'M', c: '#8B5CF6' },
  { i: 'Z', c: '#10B981' }, { i: 'H', c: '#EC4899' },
];

export function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#FFF4EA] via-[#FFF9F5] to-white py-[70px] lg:py-[90px]">
      <div
        className="pointer-events-none absolute -right-44 -top-64 size-[640px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,.10), transparent 62%)' }}
      />

      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.08fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Pill>★ Pakistan&apos;s #1 Appointment Marketplace</Pill>

          <h1 className="my-5 max-w-[12ch]">
            Book Local Services, <span className="text-brand">Instantly.</span>
          </h1>

          <p className="max-w-[44ch] text-[1.03rem] leading-relaxed text-muted">
            Discover nearby salons, clinics, and wellness centers. Compare prices,
            check availability, and book in seconds — no calls, no waiting.
          </p>

          <div className="my-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Book an Appointment <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#business">For Businesses</Link>
            </Button>
          </div>

          {SITE.showStats && (
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
                <p className="mt-0.5 text-[0.82rem] text-muted">
                  <b className="font-display font-bold text-ink">{SITE.stats.rating}/5</b> from{' '}
                  <b className="font-display font-bold text-ink">{SITE.stats.businesses}</b> reviews
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
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

/** The app, as the customer will see it. Not a stock photo of a phone. */
function PhoneMock() {
  return (
    <div className="mx-auto w-[264px] rounded-[38px] bg-[#0B1729] p-[9px] shadow-lg">
      <div className="relative h-[500px] overflow-hidden rounded-[30px] bg-soft">
        <div className="absolute left-1/2 top-2 z-10 h-[18px] w-[84px] -translate-x-1/2 rounded-[20px] bg-[#0B1729]" />

        <div className="flex items-center justify-between px-[18px] pb-1 pt-2.5 font-display text-[0.62rem] font-bold text-ink">
          <span className="tnum">9:41</span><span>▮▮▮ ▮</span>
        </div>

        <div className="px-3 pb-3">
          <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 text-[0.64rem] text-faint">
            <Search className="size-2.5" /> Search salons, clinics…
          </div>

          <p className="mb-2 font-display text-[0.6rem] font-bold text-ink">Popular Categories</p>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {['Salons', 'Beauty', 'Nails', 'Mehndi', 'Wellness', 'Clinics'].map((c) => (
              <div key={c} className="rounded-lg border border-line bg-white px-1 py-2 text-center">
                <span className="text-[0.5rem] font-medium text-muted">{c}</span>
              </div>
            ))}
          </div>

          <p className="mb-2 font-display text-[0.6rem] font-bold text-ink">Near You</p>
          {[
            { n: 'Glow Studio', t: 'Hair Salon', r: '4.9', d: '0.8 km', c: '#F97316', i: 'GS' },
            { n: 'Pearl Parlor', t: 'Beauty Parlor', r: '4.8', d: '1.2 km', c: '#0F2140', i: 'PP' },
          ].map((b) => (
            <div key={b.n} className="mb-1.5 flex items-center gap-2 rounded-lg border border-line bg-white p-2">
              <div style={{ background: b.c }} className="grid size-[26px] flex-none place-items-center rounded-[7px] font-display text-[0.6rem] font-extrabold text-white">
                {b.i}
              </div>
              <div>
                <b className="block font-display text-[0.6rem] font-bold">{b.n}</b>
                <small className="text-[0.5rem] text-faint">{b.t}</small>
              </div>
              <div className="ml-auto text-right">
                <b className="text-[0.55rem] text-brand">★ {b.r}</b>
                <small className="block text-[0.46rem] text-faint tnum">{b.d}</small>
              </div>
            </div>
          ))}

          <div className="mt-2.5 rounded-lg bg-brand py-2.5 text-center font-display text-[0.63rem] font-bold text-white">
            Book Now
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatCard({ icon, title, sub, className }: {
  icon: React.ReactNode; title: string; sub: string; className?: string;
}) {
  return (
    <div className={`absolute z-10 flex animate-bob items-center gap-2.5 rounded-[11px] border border-line bg-white px-3 py-2.5 shadow ${className}`}>
      <span className="grid size-[26px] flex-none place-items-center rounded-lg bg-brand-tint text-brand">{icon}</span>
      <div>
        <b className="block font-display text-[0.68rem] font-bold leading-tight">{title}</b>
        <small className="text-[0.58rem] text-faint">{sub}</small>
      </div>
    </div>
  );
}
