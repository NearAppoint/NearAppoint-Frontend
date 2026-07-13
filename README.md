# nearappoint-frontend

Customer app + Business OS. `nearappoint.com` · `business.nearappoint.com`

**This repo cannot touch the database.**

---

## The architecture, in one paragraph

`src/lib/auth.ts` creates a Supabase client, exports its `.auth` namespace, and
throws the client away. What you get back has `signInWithOtp()`, `verifyOtp()`,
`getSession()` — and it does **not** have `.from()`, `.rpc()` or `.storage`.

You cannot query a table from this repo. Not because you shouldn't — because
**the method does not exist on the object you are handed.** No code review to
forget, no rule to remember, no new developer to brief.

All data goes through `src/lib/api-client.ts` → `api.nearappoint.com`.

### Why that matters to you specifically

`src/types/api.ts` defines `BookingRequest`:

```ts
export interface BookingRequest {
  branch_id: string;
  service_ids: string[];
  staff_id: string | null;
  start_at: string;
}
```

**There is no `price` field.** A frontend developer cannot send a price because
there is nowhere to put one. Your Muddarris pricing-manipulation bug isn't
"prevented by code review" — it is unrepresentable in the type system.

CI enforces this (`.github/workflows/ci.yml` → `boundaries`). A `.from()` call
or a service-role key fails the build.

---

## Structure

```
src/
  app/
    (marketing)/    nearappoint.com — landing
    (auth)/         /login /signup /verify
    (business)/     Business OS            <- Feature F2
    (customer)/     Customer app           <- Phase 2
  components/
    ui/             design system. Button, Input, Card, Pill, Accordion, Logo.
    marketing/      landing sections
  features/
    auth/           PhoneInput, OtpInput, useOtp
  lib/
    auth.ts         AUTH ONLY. No table access possible.
    api-client.ts   the only way to reach data
    utils.ts, phone.ts, display.ts
  config/
    site.ts         marketing content + CLAIMS (read the warning)
    env.ts          zod-validated
  constants/
    marketing.ts    content as typed data, not markup
  types/
    api.ts          the API contract
```

---

## Setup

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                    # :3000
```

Run `nearappoint-backend` on :4000 alongside it.

---

## ⚠️ Before you send anyone to this page

`src/config/site.ts`:

```ts
showStats: false,          // 2,400 businesses / 85,000 customers — none of it true
showTestimonials: false,   // Fatima Malik and Zara Khan do not exist
```

Invented testimonials with real-sounding names is false advertising. In a
market that runs on word of mouth, the first salon owner who asks to speak to
"Zara Khan of Pearl Beauty Parlor" is the last one who trusts you.

Honest copy converts better anyway: **"Launching in Lahore. Free for our first
20 salons."**
