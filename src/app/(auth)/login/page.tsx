'use client';
import * as React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/features/auth/components/phone-input';
import { useOtp } from '@/features/auth/hooks/use-otp';

export default function LoginPage() {
  const [phone, setPhone] = React.useState('');
  const { request, loading, error } = useOtp();

  return (
    <>
      <h1 className="mb-2.5 text-[clamp(1.8rem,2.8vw,2.2rem)]">Sign in</h1>
      <p className="mb-7 text-[0.97rem] leading-snug text-muted">
        Enter your number. We&apos;ll send you a code — no password to remember.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); void request(phone); }}>
        <div className="mb-4">
          <label htmlFor="phone" className="mb-2 block font-display text-[0.85rem] font-bold">
            Mobile number
          </label>
          <PhoneInput id="phone" value={phone} onChange={setPhone} invalid={!!error} autoFocus />
          <p className="mt-1.5 text-[0.8rem] text-faint">
            Your code arrives on WhatsApp in a few seconds.
          </p>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.87rem] leading-snug text-red-700">
            <AlertCircle className="mt-0.5 size-[15px] flex-none" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" block loading={loading}>Send code</Button>
      </form>

      <p className="mt-6 text-center text-[0.92rem] text-muted">
        New here?{' '}
        <Link href="/signup" className="font-display font-bold text-brand hover:underline">
          Set up your salon
        </Link>
      </p>
    </>
  );
}
