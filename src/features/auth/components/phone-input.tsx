'use client';
import * as React from 'react';
import { formatAsTyped } from '@/lib/phone';
import { cn } from '@/lib/utils';

/**
 * The most important input in the product. Phone is the identity key.
 *
 * Design decisions, each one earned:
 *   - +92 is FIXED, not a country-code picker. Every user is Pakistani. A
 *     picker is a tap and a decision for zero benefit.
 *   - numeric keypad on mobile (inputMode)
 *   - formats as you type: "300 1234567". The user never formats their own
 *     phone number. Ever.
 *   - autoComplete="tel-national" so the browser fills it
 */
interface Props {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  id?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, invalid, autoFocus, id, disabled }: Props) {
  return (
    <div className={cn(
      'flex items-center overflow-hidden rounded-sm border border-line2 bg-white transition-all',
      'focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15',
      invalid && 'border-bad',
      disabled && 'opacity-60',
    )}>
      <span className="flex flex-none items-center gap-2 border-r border-line2 bg-soft py-3 pl-4 pr-3 font-mono text-[0.92rem] font-medium text-ink">
        <PkFlag />
        +92
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={12}
        placeholder="300 1234567"
        aria-invalid={invalid}
        value={formatAsTyped(value)}
        onChange={(e) => onChange(e.target.value)}
        className="tnum min-w-0 flex-1 border-0 bg-transparent px-4 py-3 font-mono text-[0.97rem] tracking-wide text-ink placeholder:text-faint focus:outline-none"
      />
    </div>
  );
}

function PkFlag() {
  return (
    <svg width="17" height="12" viewBox="0 0 20 14" aria-hidden>
      <rect width="20" height="14" rx="1.5" fill="#01411C" />
      <rect width="5.5" height="14" rx="1.5" fill="#fff" />
      <circle cx="13.4" cy="7" r="3.4" fill="#fff" />
      <circle cx="14.7" cy="6" r="3.2" fill="#01411C" />
    </svg>
  );
}
