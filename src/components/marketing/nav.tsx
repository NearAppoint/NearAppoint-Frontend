'use client';
import * as React from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { SITE } from '@/config/site';
import { cn } from '@/lib/utils';

export function Nav() {
  const [stuck, setStuck] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menu open + body scrolling = you scroll behind an overlay and think the
  // site is broken. Lock it.
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav className={cn(
      'sticky top-0 z-50 border-b border-transparent bg-white/85 backdrop-blur-xl transition-colors',
      stuck && 'border-line shadow-sm',
    )}>
      <div className="container flex h-[68px] items-center justify-between gap-6">
        <Logo />

        <div className="hidden items-center gap-[26px] lg:flex">
          {SITE.nav.map((l) => (
            <Link key={l.href} href={l.href} className="text-[0.9rem] font-medium text-muted transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          <Link href="/login" className="hidden font-display text-[0.9rem] font-semibold text-ink transition-colors hover:text-brand sm:block">
            Sign In
          </Link>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/signup">Get Started</Link>
          </Button>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Menu"
            className="flex size-10 items-center justify-center rounded-sm border border-line2 text-ink lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto bg-white px-6 pb-8 pt-5 lg:hidden"
          >
            {SITE.nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-[15px] font-display text-[1.05rem] font-semibold text-ink"
              >
                {l.label}
                <ChevronRight className="size-4 text-faint" />
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-2.5">
              <Button asChild size="lg" block><Link href="/signup">Get Started</Link></Button>
              <Button asChild size="lg" block variant="secondary"><Link href="/login">Sign In</Link></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
