'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Six boxes. Sounds trivial. It is not — this screen is where signups die.
 *
 * Handles:
 *   - autoComplete="one-time-code" -> Android AUTOFILLS the code. The user
 *     should never type it. This one attribute is worth more than the rest of
 *     the component.
 *   - paste the whole 6-digit code into any box
 *   - backspace moves to the previous box AND clears it
 *   - arrow keys
 *   - auto-submits when the 6th digit lands (nobody wants to press a button)
 *   - shake + clear on a wrong code, WITHOUT navigating away
 */
interface Props {
  onComplete: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ onComplete, error, disabled }: Props) {
  const [values, setValues] = React.useState<string[]>(Array(6).fill(''));
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Wrong code -> clear and refocus. Never navigate away, never lose their place.
  React.useEffect(() => {
    if (error) {
      setValues(Array(6).fill(''));
      refs.current[0]?.focus();
    }
  }, [error]);

  const commit = (next: string[]) => {
    setValues(next);
    const code = next.join('');
    if (code.length === 6) onComplete(code);
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[i] = digit;
    commit(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      const next = [...values];
      next[i - 1] = '';
      setValues(next);
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    pasted.split('').forEach((c, k) => { next[k] = c; });
    commit(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div
      className={cn('flex justify-between gap-2.5', error && 'animate-[shake_.38s_ease]')}
      onPaste={handlePaste}
    >
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          disabled={disabled}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'tnum aspect-[1/1.1] w-full rounded-[12px] border bg-white text-center',
            'font-mono text-[1.35rem] font-semibold text-ink transition-all',
            'focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15',
            v && !error && 'border-ink',
            !v && !error && 'border-line2',
            error && 'border-bad',
            disabled && 'opacity-60',
          )}
        />
      ))}
    </div>
  );
}
