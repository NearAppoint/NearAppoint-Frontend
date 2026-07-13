import { z } from 'zod';

/**
 * Every env var this repo may read. If it isn't here, it doesn't exist.
 *
 * Note what CANNOT be here: a service-role key, a payment secret, a DB URL.
 * This repo is structurally incapable of holding one — there is no schema
 * entry for it, so nothing can read it.
 */
const schema = z.object({
  NEXT_PUBLIC_API_URL:           z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL:          z.string().url(),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL:           process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
});
