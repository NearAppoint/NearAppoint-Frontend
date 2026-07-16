# NearAppoint — Design System (MASTER)

Source of truth for all UI work. Read this before building or redesigning any screen. Exact token values live in `tailwind.config.ts` and `src/app/globals.css` — always read those too; this file explains intent and constraints. Keep the brand; elevate the craft. Do not invent a new brand.

## What NearAppoint is

An appointment-booking marketplace + business operating system for Pakistan (launching Lahore). Two audiences, two moods, one brand:

- **Customer side** = warm, inviting, premium-but-friendly (booking a salon should feel nice).
- **Business side** = calm, dense, trustworthy tool (a salon owner runs it for 8 hours).

## Brand — do not change these

- **Primary:** orange `#F97316` (hover `#EA680C`), tints `#FFF0E6` / `#FFF7F1`.
- **Dark / trust:** navy `#16243E` (dark sections, business sidebar, text).
- **Warm consumer palette:** bg `#FFF8F6`, surface `#FFF1EB`, ink `#251913`, muted `#584237`, faint `#8C7164`, border `#E0C0B1`, deep accent `#9D4300`.
- **Business palette:** page `#F8F9FB`, white cards, `rounded-sm`, navy sidebar.
- **Type:** Plus Jakarta Sans (display/headings), JetBrains Mono (numbers, times, prices — anywhere digits must align), body sans for prose.
- **Logo:** orange clock-in-map-pin + navy check. Always a placeholder unless a real file is supplied.

## Design direction (the upgrade we want)

Current site is correct but plain. Elevate it to a premium, motion-driven feel appropriate for beauty/wellness/booking — think Soft-UI / organic warmth, not neon or brutalism. Reference styles from the UI/UX skill that fit: Soft UI Evolution, Organic/Biophilic, Motion-Driven, Micro-interactions, Gradient-mesh/Aurora (subtle, warm only). Avoid: dark mode by default, AI purple/pink gradients, harsh animation, neon.

## Motion rules (important — mobile-first, Pakistan)

- **Library:** framer-motion (already a dependency). Don't add new animation deps.
- **Hero:** one tasteful entrance + a live/looping element that reads as "the product working" — not a stock illustration.
- **Scroll:** gentle reveal (fade + small y-translate, 200–350ms), staggered.
- **Hover/press:** smooth micro-interactions (150–300ms), `cursor-pointer` on everything clickable.
- Always respect `prefers-reduced-motion` — disable/curtail animation when set.
- Keep it light: no heavy 3D/parallax that janks on a mid-range Android over 3G. Target 60fps on a $150 phone. Prefer transform/opacity animations (GPU-cheap).

## Component conventions

- Use existing tokens/utilities; don't hardcode hex in components.
- Icons: Lucide (already used). Never emojis as icons.
- Corners: warm/customer `rounded-lg`/`rounded-xl`; business `rounded-sm`.
- Real prices, real states — never fake stats, fake testimonials, or "call for price".
- Images: small, WebP, lazy; service thumbnails ~90px square (Foodpanda-style).

## Accessibility / quality checklist (per screen)

- [ ] Text contrast ≥ 4.5:1 on its background
- [ ] Visible keyboard focus states
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] `cursor-pointer` + smooth hover on all clickable elements
- [ ] No layout shift from animations

## HARD CONSTRAINTS (never violate)

- **Frontend only.** Never edit `src/server/**`, API routes under `src/app/api/**`, database migrations, or SQL. Those are off-limits.
- Don't change data shapes the pages rely on; only presentation/animation.
- Don't remove real functionality (booking flow, auth, entitlement gates).
- Work on a branch; keep `main` deployable at all times.

## How to use this file

When building a page, first read this MASTER, then check `design-system/pages/<page-name>.md` for overrides (if it exists). Page rules win over MASTER; otherwise MASTER is authoritative.
