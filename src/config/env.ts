import { z } from 'zod';

/**
 * CLIENT-SIDE environment. Everything here is shipped to the browser.
 *
 * NEXT_PUBLIC_API_URL IS GONE.
 *
 * After the repo merge, the API lives at /api/v1 on the SAME ORIGIN. There is
 * no second domain, no CORS, no preflight, and one fewer variable to forget in
 * the Vercel dashboard.
 *
 * Server secrets live in src/server/env.ts, which is `server-only` and cannot
 * be imported from a client component. The two files are separate on purpose:
 * it should be physically awkward to put a secret in the wrong one.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL:          z.string().url(),
});

/**
 * Written out longhand ON PURPOSE.
 *
 * Next replaces `process.env.NEXT_PUBLIC_FOO` with a literal at BUILD time —
 * but only when it can see that exact property access in the source.
 * `process.env[someVar]` is never replaced and comes back undefined in the
 * browser. It is the most common Next env bug there is, and it is silent.
 */
const raw = {
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
};

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((i) => {
      const key = String(i.path[0]);
      const why =
        i.code === 'invalid_type' && (i as { received?: string }).received === 'undefined'
          ? 'not set'
          : i.message;
      return `   x  ${key} — ${why}`;
    })
    .join('\n');

  throw new Error(
    '\n\n  NEARAPPOINT: ENVIRONMENT IS NOT CONFIGURED\n' +
    '  =========================================\n\n' +
    missing + '\n\n' +
    '  HOW TO FIX\n' +
    '  ----------\n' +
    '  Vercel -> Settings -> Environment Variables. Add each one.\n' +
    '  Tick Production + Preview + Development, then REDEPLOY.\n' +
    '  Env changes do NOT apply to an existing build.\n\n' +
    '  WHERE THE VALUES COME FROM\n' +
    '  --------------------------\n' +
    '  NEXT_PUBLIC_SUPABASE_URL       Supabase -> Settings -> API -> Project URL\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY  Supabase -> Settings -> API -> anon public\n' +
    '  NEXT_PUBLIC_SITE_URL           https://www.nearappoint.com\n\n' +
    '  WARNING\n' +
    '  -------\n' +
    '  SUPABASE_SERVICE_ROLE_KEY goes in the SERVER vars, with NO\n' +
    '  NEXT_PUBLIC_ prefix. Anything prefixed NEXT_PUBLIC_ is shipped to every\n' +
    '  visitor\u2019s browser, and that key bypasses row-level security entirely.\n',
  );
}

export const env = parsed.data;
