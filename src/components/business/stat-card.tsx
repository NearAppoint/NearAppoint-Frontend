import { cn } from '@/lib/utils';

export function StatCard({ label, value, accent, hint }: {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
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
