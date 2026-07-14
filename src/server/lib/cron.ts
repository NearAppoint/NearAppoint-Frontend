import 'server-only';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { serverEnv } from '@/server/env';

/**
 * MUDDARRIS LESSON: a cron endpoint with no secret is a public endpoint that
 * mutates your database. Anyone who guesses the URL can fire it.
 *
 * Every /api/cron/* route calls this FIRST, before anything else.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export function guardCron(req: NextRequest): NextResponse | null {
  const expected = `Bearer ${serverEnv().CRON_SECRET}`;
  if (req.headers.get('authorization') !== expected) {
    console.warn('[cron] REJECTED', { path: req.nextUrl.pathname });
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  return null;
}
