import { cn } from '@/lib/utils';

/**
 * The little orange label above every section heading.
 *
 * The light variant reads warm-deep, not brand. Brand orange on brand-tint is
 * 2.5:1 — it looks fine to anyone who already knows what it says, and it fails
 * WCAG AA (4.5:1) for everyone else. warm.deep exists in the token set for
 * exactly this ("deep burnt orange — for text on warm bg") and measures 5.8:1
 * on the same tint. Same colour family, same design, actually legible.
 *
 * onDark keeps brand: orange on navy already clears AA.
 */
export function Pill({ children, onDark, className }: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-block rounded-full px-[15px] py-1.5 font-display text-[0.78rem] font-bold',
      onDark ? 'bg-brand/[.16] text-brand' : 'bg-brand-tint text-warm-deep',
      className,
    )}>
      {children}
    </span>
  );
}
