import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { AppointmentService, type ApptStatus } from '@/server/services/appointment.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

/** PATCH /api/v1/appointments/:id — move it through its lifecycle. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);

    // Tenant guard. Without it, PATCH with another salon's appointment id would
    // let you complete or cancel THEIR bookings.
    const { data } = await db().from('appointments')
      .select('id').eq('id', id).eq('business_id', ctx.businessId).maybeSingle();
    if (!data) throw new ApiError('NOT_FOUND', 'Not found.');

    const body = await req.json();
    const status = String(body.status ?? '') as ApptStatus;

    const allowed: ApptStatus[] = [
      'in_progress', 'completed', 'no_show', 'cancelled_by_business',
    ];
    if (!allowed.includes(status)) {
      throw new ApiError('VALIDATION_FAILED', 'That status change is not allowed here.');
    }

    await AppointmentService.setStatus(
      id, status, ctx.userId,
      body.final_amount !== undefined ? Number(body.final_amount) : undefined,
    );

    return ok({ id, status });
  } catch (e) { return fail(e, rid); }
}
