# src/server — the database boundary

**Every file in this folder starts with `import 'server-only'`.**

That is not a convention or a lint rule. It is a **compiler guarantee**:

> If any client component imports anything from this folder — directly, or three
> levels deep through another import — **the build fails.**

That is why we do not need a separate backend repo. Two repos rely on a human
not copy-pasting a key. This relies on the compiler, which never forgets.

## What lives here

```
database/client.ts     service-role Supabase. The only DB access in the product.
services/              permissions, booking engine, business logic
lib/                   money, cron guard, request IDs — server-side only
```

## What must NEVER happen

- A `page.tsx` or a `'use client'` component importing from `src/server/`
- A price, a currency, or a fee being computed anywhere outside this folder
- `SUPABASE_SERVICE_ROLE_KEY` being renamed to `NEXT_PUBLIC_*`

The first is caught by the compiler. The second and third are caught by CI.
