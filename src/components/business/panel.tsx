import { cn } from '@/lib/utils';

/**
 * The white card that holds a list. Optional column header, like the design's
 * "CUSTOMER INFORMATION / ENGAGEMENT HISTORY / LOYALTY & TIER" strip.
 */
export function Panel({ header, children, className }: {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-white', className)}>
      {header && (
        <div className="border-b border-line bg-soft/60 px-5 py-3 font-display text-[0.66rem] font-bold uppercase tracking-[0.1em] text-faint">
          {header}
        </div>
      )}
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

/** An orange-tinted callout. Setup prompts, Ramadan banner, empty states. */
export function Callout({ children, className }: {
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn(
      'rounded-lg border border-brand/25 bg-brand-tint2 p-6',
      className,
    )}>
      {children}
    </div>
  );
}

/** Status pill. VIP, Regular, Done, Active. */
export function Tag({ children, tone = 'neutral' }: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'ok' | 'warn';
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-display text-[0.62rem] font-bold uppercase tracking-wide',
      tone === 'brand' && 'bg-brand text-white',
      tone === 'ok'    && 'bg-ok/12 text-ok',
      tone === 'warn'  && 'bg-amber-100 text-amber-700',
      tone === 'neutral' && 'bg-soft text-muted',
    )}>
      {children}
    </span>
  );
}
