import type { NextRequest } from 'next/server';
import { requireAuth } from '@/server/services/auth.service';
import { PublicService } from '@/server/services/public.service';
import { ok, created, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const actor = await requireAuth(req);
    return ok(await PublicService.myBookings(actor.userId));
  } catch (e) { return fail(e, rid); }
}

/**
 * POST /api/v1/me/bookings
 *
 * Body: { business_id, branch_id, staff_id, service_ids[], start_at }
 * NOT in the body: a price. There is nowhere to put one.
 */
export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const actor = await requireAuth(req);
    const b = await req.json();

    if (!b.staff_id)   throw new ApiError('VALIDATION_FAILED', 'Pick a time first.');
    if (!b.start_at)   throw new ApiError('VALIDATION_FAILED', 'Pick a time first.');
    if (!b.service_ids?.length) throw new ApiError('VALIDATION_FAILED', 'Pick a service.');

    const result = await PublicService.book({
      businessId: b.business_id,
      branchId:   b.branch_id,
      staffId:    b.staff_id,
      serviceIds: b.service_ids,
      customerId: actor.userId,
      startAt:    b.start_at,
      notes:      b.notes,
    });

    return created(result);
  } catch (e) { return fail(e, rid); }
}
