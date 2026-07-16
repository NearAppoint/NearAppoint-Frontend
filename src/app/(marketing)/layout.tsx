import { Nav } from '@/components/marketing/nav';
import { Footer } from '@/components/marketing/footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        Scroll reveals start at opacity: 0, and framer writes that into the
        server-rendered HTML — it is JS that animates it back to 1. So if the
        bundle fails to execute, every headline and price on this page is in
        the DOM and invisible. That is the whole marketing site gone, on the
        slow mobile connections it most needs to survive.

        This costs a few bytes and buys back a readable, static page.
      */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important;}`}</style>
      </noscript>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
