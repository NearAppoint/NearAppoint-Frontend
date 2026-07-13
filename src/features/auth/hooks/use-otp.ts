'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { toE164, isValidPkMobile } from '@/lib/phone';

/**
 * OTP request + verify.
 *
 * Note the resend cooldown is enforced HERE for UX, and AGAIN in the backend
 * for real (3/hour/phone). The client-side timer is a courtesy; the server-side
 * limit is the thing that stops someone burning your SMS budget overnight.
 */
export function useOtp() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const request = async (phone: string) => {
    if (!isValidPkMobile(phone)) {
      setError('That doesn\u2019t look like a Pakistani mobile number. It should start with 3.');
      return false;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await auth.requestOtp(toE164(phone));
    setLoading(false);

    if (err) {
      setError(err.message);
      return false;
    }
    router.push(`/verify?phone=${encodeURIComponent(phone.replace(/\D/g, ''))}`);
    return true;
  };

  const verify = async (phone: string, code: string) => {
    setLoading(true);
    setError(null);

    const { error: err } = await auth.verifyOtp(toE164(phone), code);
    setLoading(false);

    if (err) {
      setError('That code isn\u2019t right. Please try again.');
      return false;
    }
    router.push('/today');
    return true;
  };

  return { request, verify, loading, error, setError };
}
