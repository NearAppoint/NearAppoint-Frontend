import { cn } from '@/lib/utils';

export function StatCard({ label, value, accent, hint }: {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className={cn(
      'rounded-lg border bg-white p-5',
      /* The number she actually cares about gets an orange left edge. Her eye
         lands on it before she's read a word. */
      accent ? 'border-line border-l-[3px] border-l-brand' : 'border-line',
    )}>
      <p className="font-display text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
      <p className={cn(
        'tnum mt-2 font-display text-[1.7rem] font-extrabold leading-none tracking-tight',
        accent ? 'text-brand' : 'text-ink',
      )}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted">{hint}</p>}
    </div>
  );
}
