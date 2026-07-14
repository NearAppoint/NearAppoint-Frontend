import type { NextRequest } from 'next/server';
import { guardCron } from '@/server/lib/cron';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/**
 * Releases `pending_payment` holds past their 10-minute window.
 *
 * DELIBERATELY NOT LOAD-BEARING. Availability queries ALSO filter on
 * hold_expires_at, so if this cron dies, slots still show correctly as free —
 * the rows just linger. A dead cron degrades tidiness; it does NOT corrupt
 * correctness.
 *
 * Muddarris lesson: a cron that is load-bearing for correctness is a cron that
 * will eventually cost you a Saturday.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCron(req);
  if (blocked) return blocked;

  const rid = requestId();
  try {
    const { data, error } = await db()
      .from('appointments')
      .update({ status: 'expired' })
      .eq('status', 'pending_payment')
      .lt('hold_expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    const n = data?.length ?? 0;
    if (n > 0) console.info('[cron:expire-holds]', { expired: n, rid });
    return ok({ expired: n });
  } catch (e) {
    return fail(e, rid);
  }
}
