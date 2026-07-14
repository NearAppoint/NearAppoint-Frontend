import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { LifecycleService } from '@/server/services/lifecycle.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

async function assertOwned(id: string, businessId: string) {
  const { data } = await db().from('appointments')
    .select('id').eq('id', id).eq('business_id', businessId).maybeSingle();
  if (!data) throw new ApiError('NOT_FOUND', 'Not found.');
}

/**
 * POST /api/v1/appointments/:id/cancel
 * Body: { no_show?: boolean, reason?: string }
 *
 * Releases the slot. Immediately. The terminal status drops out of the EXCLUDE
 * predicate and the chair is sellable again — no cron, no cleanup.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);

    const b = await req.json().catch(() => ({}));
    await LifecycleService.cancel(id, ctx.userId, b.reason ?? null, !!b.no_show);

    return ok({ id, no_show: !!b.no_show });
  } catch (e) { return fail(e, rid); }
}
