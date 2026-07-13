import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Mark is SVG. Wordmark is LIVE TEXT.
 *
 * An SVG loaded via <img> cannot reach the page's webfonts, so a text-based
 * lockup would silently fall back to Arial in every browser. Live text renders
 * in the real display face, scales with the layout, and stays selectable.
 */
export function Logo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)} aria-label="NearAppoint home">
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
