import { cn } from '@/lib/utils';

/** The little orange label above every section heading. */
export function Pill({ children, onDark, className }: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-block rounded-full px-[15px] py-1.5 font-display text-[0.78rem] font-bold text-brand',
      onDark ? 'bg-brand/[.16]' : 'bg-brand-tint',
      className,
    )}>
      {children}
    </span>
  );
}
