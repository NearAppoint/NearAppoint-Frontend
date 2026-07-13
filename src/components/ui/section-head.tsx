import { Pill } from './pill';
import { cn } from '@/lib/utils';

/** Pill + H2 + lede. Used by 8 sections. One component, not eight copies. */
export function SectionHead({ pill, title, subtitle, onDark, className }: {
  pill: string;
  title: React.ReactNode;
  subtitle?: string;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto mb-13 max-w-[620px] text-center', className)}>
      <Pill onDark={onDark}>{pill}</Pill>
      <h2 className={cn('mb-3.5 mt-[18px]', onDark && 'text-white')}>{title}</h2>
      {subtitle && (
        <p className={cn('text-[1.02rem] leading-relaxed', onDark ? 'text-white/60' : 'text-muted')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
