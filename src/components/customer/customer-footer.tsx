'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Instagram, Facebook } from 'lucide-react';

/**
 * The customer footer. Same structure as the marketing one, warm palette.
 *
 * ---- ON CITIES ----
 *
 * "Lahore" is a LAUNCH CITY, not an identity. It is nowhere in the copy.
 *
 * The moment a Karachi customer sees "Made in Lahore" she concludes, correctly,
 * that the product isn't for her yet — and she doesn't come back to check. City
 * names belong in search results, where they're a fact about a business, not in
 * the chrome, where they're a promise about the company.
 *
 * Pakistan first. Everything else later.
 */
const COLUMNS = [
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Careers', '/careers'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'For customers',
    links: [
      ['Find a business', '/home'],
      ['My bookings', '/bookings'],
      ['Help centre', '/help'],
    ],
  },
  {
    title: 'For business',
    links: [
      ['List your business', '/for-business'],
      ['Business login', '/login'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
      ['Cookies', '/cookies'],
    ],
  },
] as const;

export function CustomerFooter() {
  const [done, setDone] = React.useState(false);

  return (
    <footer className="mt-20 border-t border-warm-line/50 bg-white/50 pb-8 pt-14">
      <div className="container">
        <div className="grid gap-10 pb-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">

          {/* brand + newsletter */}
          <div>
            <Link href="/home" className="inline-flex items-center gap-2">
              <Image src="/assets/logo-mark.svg" alt="" width={30} height={30}
                className="h-[30px] w-auto" />
              <span className="whitespace-nowrap font-display text-[1.16rem] font-extrabold leading-none tracking-[-0.035em] text-warm-ink">
                Near<span className="text-brand">Appoint</span>
              </span>
            </Link>

            <p className="my-4 max-w-[28ch] text-[0.9rem] leading-relaxed text-warm-muted">
              Book beauty, grooming and wellness across Pakistan. Real prices,
              real availability, no phone calls.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); setDone(true); }}
              className="flex max-w-[280px] gap-2"
            >
              <input
                type="email"
                required
                disabled={done}
                placeholder={done ? 'You\u2019re on the list' : 'Your email'}
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-full border border-warm-line bg-white px-4 py-2.5 text-[0.87rem] text-warm-ink placeholder:text-warm-faint focus:border-brand focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={done}
                aria-label="Subscribe"
                className="grid size-[42px] flex-none place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title} className="flex flex-col items-start gap-3">
              <h4 className="mb-1 font-display text-[0.72rem] font-bold uppercase tracking-[0.1em] text-warm-faint">
                {col.title}
              </h4>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href}
                  className="text-[0.9rem] text-warm-muted transition-colors hover:text-brand">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-warm-line/40 pt-7">
          <span className="text-[0.85rem] text-warm-faint">
            © {new Date().getFullYear()} NearAppoint. All rights reserved.
          </span>

          <div className="flex items-center gap-2">
            <Social href="https://instagram.com/nearappoint" label="Instagram">
              <Instagram className="size-4" />
            </Social>
            <Social href="https://facebook.com/nearappoint" label="Facebook">
              <Facebook className="size-4" />
            </Social>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, children }: {
  href: string; label: string; children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-warm-line bg-white text-warm-muted transition-colors hover:border-brand hover:text-brand">
      {children}
    </a>
  );
}
