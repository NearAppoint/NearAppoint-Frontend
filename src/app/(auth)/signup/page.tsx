'use client';
import * as React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/features/auth/components/phone-input';
import { useOtp } from '@/features/auth/hooks/use-otp';
import { cn } from '@/lib/utils';

const TYPES = [
  { v: 'hair_salon',    label: 'Hair salon' },
  { v: 'beauty_parlor', label: 'Beauty parlor' },
  { v: 'nail_studio',   label: 'Nail studio' },
  { v: 'wellness',      label: 'Wellness / spa' },
] as const;

const BANDS = [
  { v: '1-3', n: '1–3', l: 'Small' },
  { v: '4-8', n: '4–8', l: 'Growing' },   // <- our actual buyer. Pre-selected.
  { v: '9+',  n: '9+',  l: 'Busy' },
] as const;

export default function SignupPage() {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<string>('hair_salon');
  const [band, setBand] = React.useState<string>('4-8');
  const [phone, setPhone] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const { request, loading, error } = useOtp();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    // TODO(Feature F2): POST /api/v1/businesses with { name, type, band } once
    // the phone is verified. Do NOT create the business before verification —
    // you'll collect junk rows.
    void request(phone);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <span className="h-1 flex-1 rounded-sm bg-brand" />
        <span className="h-1 flex-1 rounded-sm bg-line2" />
        <span className="h-1 flex-1 rounded-sm bg-line2" />
        <span className="ml-1.5 whitespace-nowrap font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-faint">
          Step 1 of 3
        </span>
      </div>

      <h1 className="mb-2.5 text-[clamp(1.8rem,2.8vw,2.2rem)]">Set up your salon</h1>
      <p className="mb-7 text-[0.97rem] leading-snug text-muted">
        Three short steps. You&apos;ll be taking bookings in under ten minutes.
      </p>

      <form onSubmit={submit}>
        <div className="mb-4">
          <label htmlFor="biz" className="mb-2 block font-display text-[0.85rem] font-bold">Salon name</label>
          <Input id="biz" value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }}
            placeholder="Glow Salon" aria-invalid={nameError} />
        </div>

        <div className="mb-4">
          <span className="mb-2 block font-display text-[0.85rem] font-bold">What kind of place is it?</span>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t.v} type="button" onClick={() => setType(t.v)} aria-pressed={type === t.v}
                className={cn(
                  'rounded-sm border px-4 py-2.5 font-sans text-[0.92rem] transition-all',
                  type === t.v
                    ? 'border-brand bg-brand-tint font-semibold text-ink'
                    : 'border-line2 bg-white font-medium text-muted hover:border-faint',
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <span className="mb-2 block font-display text-[0.85rem] font-bold">How many people work there?</span>
          <div className="grid grid-cols-3 gap-2">
            {BANDS.map((b) => (
              <button key={b.v} type="button" onClick={() => setBand(b.v)} aria-pressed={band === b.v}
                className={cn(
                  'rounded-[11px] border py-3 text-center transition-all',
                  band === b.v ? 'border-brand bg-brand-tint' : 'border-line2 bg-white',
                )}>
                <strong className="tnum block font-mono text-base font-semibold text-ink">{b.n}</strong>
                <span className="text-[0.74rem] text-muted">{b.l}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[0.8rem] text-faint">This just sets your plan. You can change it any time.</p>
        </div>

        <div className="mb-5">
          <label htmlFor="ph" className="mb-2 block font-display text-[0.85rem] font-bold">Your mobile number</label>
          <PhoneInput id="ph" value={phone} onChange={setPhone} invalid={!!error} />
          <p className="mt-1.5 text-[0.8rem] text-faint">
            We&apos;ll send a code to confirm it&apos;s you. No password needed.
          </p>
        </div>

        {(error || nameError) && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.87rem] leading-snug text-red-700">
            <AlertCircle className="mt-0.5 size-[15px] flex-none" />
            {nameError ? 'Fill in your salon name to continue.' : error}
          </div>
        )}

        <Button type="submit" size="lg" block loading={loading}>Continue</Button>
      </form>

      <p className="mt-6 text-center text-[0.92rem] text-muted">
        Already set up?{' '}
        <Link href="/login" className="font-display font-bold text-brand hover:underline">Sign in</Link>
      </p>
    </>
  );
}
