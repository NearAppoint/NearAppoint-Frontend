import type { Metadata } from 'next';
import Link from 'next/link';
import { CustomerNav } from '@/components/customer/customer-nav';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How booking on NearAppoint works — reminders, cancellations, payments, and how to reach a real person.',
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I book an appointment?',
    a: 'Find a business, pick the service you want, choose a time that suits you, and confirm. You’ll get a confirmation right away with all the details. Booking is free — you never pay NearAppoint a booking fee.',
  },
  {
    q: 'Do I pay through NearAppoint?',
    a: 'No. You pay the business directly for your service, on their terms, when you go in. NearAppoint shows you the price up front so there are no surprises, but the payment happens at the salon or clinic — not with us.',
  },
  {
    q: 'Will I be reminded about my appointment?',
    a: 'Yes. We send a confirmation when you book and a reminder before your appointment over WhatsApp, SMS, or email, so it’s easy to remember and easy to reschedule if your day changes.',
  },
  {
    q: 'How do I cancel or reschedule?',
    a: 'Open “My bookings”, choose the appointment, and cancel or reschedule from there. Please give the business reasonable notice — it frees the slot for someone else and keeps your account in good standing.',
  },
  {
    q: 'What happens if I don’t show up?',
    a: 'Not showing up leaves a business with an empty chair they held for you. We keep a simple reliability record based on whether customers attend the appointments they book. Repeatedly booking and not showing up can affect your ability to book ahead.',
  },
  {
    q: 'Why do you ask for my phone number?',
    a: 'Only so the business can recognise your booking and so we can send your reminders. We don’t sell your number, and we never use it for advertising. You can read the full details in our Privacy Policy.',
  },
  {
    q: 'Which cities is NearAppoint in?',
    a: 'We’re launching in Lahore first, with more cities to follow. If your area isn’t covered yet, it will be soon.',
  },
];

export default function HelpPage() {
  return (
    <>
      <CustomerNav />
      <div className="container max-w-[70ch] py-10 md:py-14">
        <p className="mb-2 font-display text-[0.74rem] font-bold uppercase tracking-[0.14em] text-brand">
          Help centre
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] text-warm-ink">How can we help?</h1>
        <p className="mt-3 max-w-[55ch] text-[1.02rem] leading-relaxed text-warm-muted">
          The quick answers to the things people ask most. Can’t find what you need? A real person in
          Lahore is one email away.
        </p>

        <div className="mt-9 space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group rounded-xl border border-warm-line/60 bg-white px-5 py-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between gap-4 font-display text-[1rem] font-bold text-warm-ink marker:content-['']">
                {q}
                <span className="flex-none text-warm-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-[0.94rem] leading-relaxed text-warm-muted">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-warm-line/60 bg-warm-low p-6">
          <h2 className="font-display text-[1.15rem] font-bold text-warm-ink">Still stuck?</h2>
          <p className="mt-1.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-warm-muted">
            Email us and we’ll get back to you. Tell us your booking reference if it’s about a
            specific appointment.
          </p>
          <a href="mailto:hello@nearappoint.com"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-display text-[0.92rem] font-semibold text-white transition-colors hover:bg-brand-hover">
            <Mail className="size-4" /> hello@nearappoint.com
          </a>
          <p className="mt-4 text-[0.82rem] text-warm-faint">
            See also our <Link href="/privacy" className="font-medium text-brand hover:underline">Privacy Policy</Link>
            {' '}and <Link href="/terms" className="font-medium text-brand hover:underline">Terms</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
