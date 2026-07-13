import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-line2 bg-white px-4 py-3 text-[0.97rem] text-ink',
        'placeholder:text-faint transition-colors',
        'focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15',
        'aria-[invalid=true]:border-bad',
        'disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
