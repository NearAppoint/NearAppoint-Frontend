import { NextResponse } from 'next/server';
import { serverEnvReport, serverEnv } from '@/server/env';
import { db } from '@/server/database/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Your non-negotiable #6. Asserts the things that fail SILENTLY:
 *
 *   1. Every required env var exists.
 *   2. The database is reachable.
 *   3. THE DOUBLE-BOOKING CONSTRAINTS EXIST.
 *
 * (3) is the one that matters. If a migration is skipped, or someone drops a
 * constraint to unblock a test and forgets to restore it, the app keeps working
 * PERFECTLY. Every screen loads. Every booking succeeds. Nothing errors.
 *
 * And then two customers book the same 6pm slot on a Saturday, both get a
 * confirmation, and that salon owner never trusts the calendar again.
 *
 * This turns a silent, unrecoverable failure into a loud 503.
 * Point uptime monitoring here.
 */
type Check = { ok: boolean; detail?: string };

export async function GET() {
  const checks: Record<string, Check> = {};

  const e = serverEnvReport();
  checks.env = { ok: e.ok, detail: e.ok ? undefined : `missing: ${e.missing.join(', ')}` };
  if (!e.ok) {
    return NextResponse.json({ ok: false, checks, ts: new Date().toISOString() }, { status: 503 });
  }

  try {
    const { error } = await db().from('service_categories').select('id').limit(1);
    checks.database = { ok: !error, detail: error?.message };
  } catch (err) {
    checks.database = { ok: false, detail: (err as Error).message };
  }

  try {
    const { data, error } = await db().from('health_constraints').select('conname');
    if (error) {
      checks.double_booking_guard = { ok: false, detail: `Cannot verify: ${error.message}` };
    } else {
      const found = (data ?? []).length;
      checks.double_booking_guard = found === 2 ? { ok: true } : {
        ok: false,
        detail: `CRITICAL: expected 2 exclusion constraints, found ${found}. ` +
                `Double-booking is NOT prevented. The product's core promise is broken.`,
      };
    }
  } catch (err) {
    checks.double_booking_guard = { ok: false, detail: (err as Error).message };
  }

  const cfg = serverEnv();
  const rlOn = !!(cfg.UPSTASH_REDIS_REST_URL && cfg.UPSTASH_REDIS_REST_TOKEN);
  checks.rate_limiting = rlOn ? { ok: true } : {
    ok: process.env.NODE_ENV !== 'production',
    detail: 'Redis not configured. The OTP endpoint is UNPROTECTED — every abuse costs you an SMS.',
  };

  checks.payments = cfg.SAFEPAY_API_KEY
    ? { ok: true }
    : { ok: true, detail: 'Safepay not configured (expected until Phase 2).' };

  const ok = Object.values(checks).every(c => c.ok);
  return NextResponse.json({ ok, checks, ts: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
