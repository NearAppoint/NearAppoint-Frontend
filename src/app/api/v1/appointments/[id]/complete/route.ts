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
 * POST /api/v1/appointments/:id/complete
 * Body: { final_amount?: number, reason?: string }
 *
 * If the final amount differs from the quote, BOTH are recorded. The quote is
 * never overwritten — it's what the customer was told.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);

    const b = await req.json().catch(() => ({}));
    await LifecycleService.complete(
      id, ctx.userId,
      b.final_amount !== undefined ? Number(b.final_amount) : undefined,
      b.reason,
    );

    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
