'use client';
import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { OtpInput } from '@/features/auth/components/otp-input';
import { useOtp } from '@/features/auth/hooks/use-otp';
import { auth } from '@/lib/auth';
import { toE164 } from '@/lib/phone';

function VerifyInner() {
  const params = useSearchParams();
  const digits = (params.get('phone') ?? '').replace(/\D/g, '');
  const { verify, loading, error, setError } = useOtp();
  const [cooldown, setCooldown] = React.useState(60);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    await auth.requestOtp(toE164(digits));
    setCooldown(60);
    setError(null);
  };

  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-[0.89rem] font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-[15px]" /> Change number
      </Link>

      <h1 className="mb-2.5 text-[clamp(1.8rem,2.8vw,2.2rem)]">Enter your code</h1>
      <p className="mb-7 text-[0.97rem] leading-snug text-muted">
        We sent a 6-digit code on WhatsApp to<br />
        <span className="tnum mt-1 inline-flex items-center gap-2 rounded-md border border-line2 bg-white px-3 py-1.5 font-mono text-[0.95rem] font-semibold text-ink">
          {`0${digits.slice(0, 3)} ${digits.slice(3)}`}
          <Link href="/login" className="font-sans text-[0.84rem] font-semibold text-brand hover:underline">Edit</Link>
        </span>
      </p>

      <OtpInput error={!!error} disabled={loading} onComplete={(code) => void verify(digits, code)} />

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.87rem] leading-snug text-red-700">
          <AlertCircle className="mt-0.5 size-[15px] flex-none" />
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 text-[0.91rem] text-muted">
        <span>Didn&apos;t get it?</span>
        <span>
          <button
            onClick={() => void resend()}
            disabled={cooldown > 0}
            className="font-display font-bold text-brand hover:underline disabled:cursor-default disabled:text-faint disabled:no-underline"
          >
            Resend code
          </button>
          {cooldown > 0 && <span className="tnum ml-1 font-mono">in 0:{String(cooldown).padStart(2, '0')}</span>}
        </span>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyInner />
    </React.Suspense>
  );
}
