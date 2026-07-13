import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded border border-line bg-white p-[22px]',
        interactive && 'transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
