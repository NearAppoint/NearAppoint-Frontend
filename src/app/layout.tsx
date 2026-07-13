import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap',
});
const body = Inter({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nearappoint.com'),
  title: { default: 'NearAppoint — Book Local Services, Instantly.', template: '%s · NearAppoint' },
  description:
    'Discover nearby salons, clinics and wellness centers. Compare prices, check availability, ' +
    'and book in seconds — no calls, no waiting.',
  openGraph: { type: 'website', siteName: 'NearAppoint', locale: 'en_PK' },
  icons: { icon: '/assets/favicon.svg' },
};

export const viewport = { themeColor: '#F97316' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
