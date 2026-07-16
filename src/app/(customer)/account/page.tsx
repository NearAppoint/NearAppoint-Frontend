'use client';
import * as React from 'react';
import Link from 'next/link';
import { CustomerNav } from '@/components/customer/customer-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { Loader2, Check, LogOut, AlertCircle } from 'lucide-react';

export default function AccountPage() {
  const [loaded, setLoaded] = React.useState(false);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/v1/me/profile')
      .then(r => r.json())
      .then(d => {
        if (d) {
          setName(d.full_name ?? '');
          setPhone(d.phone ?? '');
          setGender(d.gender ?? '');
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = { full_name: name, gender: gender || null };
    if (phone.trim()) body.phone = phone.trim();

    const res = await fetch('/api/v1/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    setSaving(false);
    if (!res.ok) { setError(j.error?.title ?? 'Could not save your changes.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const signOut = async () => {
    await auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <CustomerNav />
      <div className="container max-w-[560px] py-10 md:py-14">
        <p className="mb-2 font-display text-[0.74rem] font-bold uppercase tracking-[0.14em] text-brand">
          Your account
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] text-warm-ink">Profile</h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-warm-muted">
          Keep your details up to date so businesses recognise your bookings and your reminders reach you.
        </p>

        {!loaded ? (
          <div className="mt-10 grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-warm-faint" />
          </div>
        ) : (
          <div className="mt-8 space-y-5 rounded-2xl border border-warm-line/60 bg-white p-6">
            <div>
              <label className="mb-2 block font-display text-[0.85rem] font-bold text-warm-ink">
                Full name
              </label>
              <Input value={name} placeholder="Your name"
                onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block font-display text-[0.85rem] font-bold text-warm-ink">
                Mobile number
              </label>
              <Input value={phone} placeholder="03xx xxxxxxx" inputMode="tel"
                onChange={(e) => setPhone(e.target.value)} />
              <p className="mt-1.5 text-[0.78rem] text-warm-faint">
                Used for booking reminders. We never share it or use it for ads.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-display text-[0.85rem] font-bold text-warm-ink">
                Gender <span className="font-normal text-warm-faint">(optional)</span>
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-sm border border-warm-line bg-white px-4 py-3 text-[0.97rem] text-warm-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
              <p className="mt-1.5 text-[0.78rem] text-warm-faint">
                Helps us show women-only and men-only businesses correctly.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.86rem] text-red-700">
                <AlertCircle className="mt-0.5 size-[15px] flex-none" /> {error}
              </div>
            )}

            <Button block loading={saving} onClick={() => void save()}>
              {saved ? <><Check className="size-4" /> Saved</> : 'Save changes'}
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-warm-line/60 bg-white p-6">
          <div>
            <p className="font-display text-[0.95rem] font-bold text-warm-ink">Sign out</p>
            <p className="mt-0.5 text-[0.84rem] text-warm-muted">You’ll need to sign in again to book.</p>
          </div>
          <button onClick={() => void signOut()}
            className="inline-flex flex-none items-center gap-2 rounded-full border border-warm-line px-5 py-2.5 font-display text-[0.88rem] font-semibold text-warm-ink transition-colors hover:border-brand hover:text-brand">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>

        <p className="mt-6 text-center text-[0.82rem] text-warm-faint">
          Questions about your data? See our{' '}
          <Link href="/privacy" className="font-medium text-brand hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </>
  );
}
