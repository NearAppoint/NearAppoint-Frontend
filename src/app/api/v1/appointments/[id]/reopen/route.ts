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

/** POST /api/v1/appointments/:id/reopen — undo a mis-tap. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);
    await LifecycleService.reopen(id, ctx.userId);
    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
