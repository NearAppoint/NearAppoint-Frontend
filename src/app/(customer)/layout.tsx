/**
 * The customer shell. WARM.
 *
 * NOTE: the nav is rendered by each PAGE, not here — because /home wires the
 * header's search box to its own state. One search field, in the header,
 * driving the page underneath it. A second search box on the page would be two
 * sources of truth for the same question.
 */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm">
      <main className="min-h-[70vh]">{children}</main>

      <footer className="mt-16 border-t border-warm-line/50 py-8">
        <div className="container flex flex-wrap items-center justify-between gap-4 text-[0.85rem] text-warm-faint">
          <span>© 2026 NearAppoint · Made in Lahore</span>
          <nav className="flex gap-5">
            <a href="/privacy" className="hover:text-warm-ink">Privacy</a>
            <a href="/terms" className="hover:text-warm-ink">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
