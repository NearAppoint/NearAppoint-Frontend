# NearAppoint

Pakistan's appointment marketplace and business operating system.

**One repo. One Vercel project. One Supabase project. One env file.**

---

## Why one repo

The frontend and backend were split. They are not anymore, and the database
isolation got *stronger*, not weaker.

### The boundary

```
src/server/**          ← the ONLY code that touches the database
src/app/api/**         ← the only code allowed to import from src/server/
everything else        ← the browser. Cannot reach the database. At all.
```

Every file in `src/server/` starts with:

```ts
import 'server-only';
```

That is not a convention. It is a **compiler guarantee**: if any client
component imports from `src/server/` — directly, or five levels deep through
other imports — **the build fails.**

A separate backend repo relied on a human never copy-pasting a key into the
wrong project. This relies on the compiler, which never gets tired at 2am.

### What that buys you, specifically

`src/types/api.ts`:

```ts
export interface BookingRequest {
  branch_id: string;
  service_ids: string[];
  staff_id: string | null;
  start_at: string;
}
```

**There is no `price` field.** A frontend developer cannot send a price,
because there is nowhere to put one. Your Muddarris pricing-manipulation bug
isn't "prevented by review" — it is unrepresentable in the type system.

And `normalizeCurrency()` exists in exactly one place, under a Postgres domain
that physically refuses `'pkr'`:

```sql
create domain currency_code as char(3)
  check (value = upper(value) and value in ('PKR','USD'));
```

---

## Structure

```
src/
  app/
    (marketing)/    nearappoint.com — landing
    (auth)/         /login /signup /verify
    (business)/     Business OS                    <- Feature 3
    (customer)/     Customer app                   <- Phase 2
    api/
      health/       env + DB + THE EXCLUSION CONSTRAINTS
      cron/         every route calls guardCron() first
      v1/           the API                        <- Feature 2

  server/           ⚠️  server-only. The database boundary.
    database/       service-role client, generated types
    services/       permissions, auth, booking engine
    lib/            errors, response, cron guard, rate limit, money(fee)
    env.ts          SERVER secrets. Never NEXT_PUBLIC_.

  components/ui/    design system: Button, Input, Card, Pill, Accordion
  components/marketing/
  features/auth/    PhoneInput, OtpInput, useOtp
  lib/              shared, safe on both sides: money(format), phone, utils
  config/           site content + CLIENT env
  types/api.ts      the API contract

supabase/
  migrations/       6 files. Run in order.
  tests/            2 pgTAP tests. Both block every merge.
```

---

## Setup

**1. Supabase** — create a project (region: **Singapore**, closest to Pakistan).

SQL Editor → run each migration **in order**, one at a time:

| # | File |
|---|---|
| 1 | `0001_extensions_and_enums.sql` |
| 2 | `0002_core.sql` |
| 3 | `0003_appointments.sql` ← the double-booking constraint |
| 4 | `0004_rls.sql` |
| 5 | `0005_seed.sql` |
| 6 | `0006_health.sql` |

Then verify the one that matters:

```sql
select conname from pg_constraint
where conname in ('no_staff_double_booking','no_resource_double_booking');
```

**You must get 2 rows.** Zero rows means two customers can book the same slot,
and everything else in this repo is pointless.

**2. Vercel** — import the repo, add the env vars from `.env.example`, deploy.

**3. Check** — open `https://your-app.vercel.app/api/health`:

```json
{ "ok": true, "checks": { "double_booking_guard": { "ok": true } } }
```

If `double_booking_guard` is false, **stop** and go back to step 1.

---

## CI blocks a merge on

| Gate | Why |
|---|---|
| **Build** | `server-only` — a client importing the DB client fails the build |
| **No public service-role key** | It bypasses RLS. Public = anyone downloads every salon's customer list. |
| **No DB access outside `src/server/`** | Someone bypassed the API layer |
| **Every `src/server/` file is guarded** | One unguarded file is a hole in the whole model |
| **`001_no_double_booking`** | Two customers, same 6pm slot. The DATABASE refuses the second. |
| **`002_tenant_isolation`** | Salon A queries Salon B's customers. Gets zero rows. |

The last two are not coverage. They are the two failures you do not come back
from.

---

## ⚠️ Before you send anyone to the site

`src/config/site.ts`:

```ts
showStats: false,          // 2,400 businesses / 85,000 customers — none of it true
showTestimonials: false,   // Fatima Malik and Zara Khan do not exist
```

Invented testimonials with real-sounding names is false advertising. In a
market that runs on word of mouth, the first salon owner who asks to speak to
"Zara Khan of Pearl Beauty Parlor" is the last one who trusts you.

Honest copy converts better anyway:
**"Launching in Lahore. Free for our first 20 salons."**
