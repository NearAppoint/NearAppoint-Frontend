'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Mark is SVG. Wordmark is LIVE TEXT.
 *
 * An SVG loaded via <img> cannot reach the page's webfonts, so a text-based
 * lockup would silently fall back to Arial in every browser. Live text renders
 * in the real display face, scales with the layout, and stays selectable.
 *
 * ---- WHERE IT LINKS ----
 *
 * The logo is "home", and home means different things depending on who you are.
 *
 *   Inside the customer app  ->  /home      (search)
 *   Inside the Business OS   ->  /today
 *   On the marketing site    ->  /          (the landing page)
 *
 * Sending a signed-in customer from her bookings back to the MARKETING page is
 * a small, constant insult: she's a user, not a prospect, and the site keeps
 * trying to sell her something she already bought.
 */
const CUSTOMER = ['/home', '/bookings', '/b/'];
const BUSINESS = ['/today', '/calendar', '/customers', '/services', '/staff',
                  '/settings', '/reports'];

export function Logo({ onDark, className, href }: {
  onDark?: boolean;
  className?: string;
  /** Force a target. Otherwise it's inferred from where you are. */
  href?: string;
}) {
  const path = usePathname();

  const target = href
    ?? (BUSINESS.some(p => path.startsWith(p)) ? '/today'
    :   CUSTOMER.some(p => path.startsWith(p)) ? '/home'
    :   '/');

  return (
    <Link href={target}
      className={cn('inline-flex items-center gap-2', className)}
      aria-label="NearAppoint home">
      <Image
        src={onDark ? '/assets/logo-mark-dark.svg' : '/assets/logo-mark.svg'}
        alt=""
        width={30}
        height={30}
        className="h-[30px] w-auto"
        priority
      />
      <span className={cn(
        'whitespace-nowrap font-display text-[1.16rem] font-extrabold leading-none tracking-[-0.035em]',
        onDark ? 'text-white' : 'text-ink',
      )}>
        Near<span className="text-brand">Appoint</span>
      </span>
    </Link>
  );
}
