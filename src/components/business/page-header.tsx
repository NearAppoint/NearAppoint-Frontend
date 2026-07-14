import { cn } from '@/lib/utils';

/**
 * Every business screen starts with this. One component, not eight copies —
 * that is how screen #8 keeps matching screen #1.
 */
export function PageHeader({ title, subtitle, accent, actions, className }: {
  title: string;
  subtitle?: React.ReactNode;
  /** An orange fragment appended to the subtitle. "3 still need a price." */
  accent?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-7 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h1 className="text-[1.9rem] leading-none">{title}</h1>
        {(subtitle || accent) && (
          <p className="mt-2 text-[0.92rem] text-muted">
            {subtitle}
            {accent && <span className="font-semibold text-brand"> · {accent}</span>}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}
