import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { AppointmentService } from '@/server/services/appointment.service';
import { created, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/appointments/walk-in
 *
 * THE MOST-USED ENDPOINT IN THE PRODUCT.
 *
 * She uses this forty times a day, standing up, with a customer in front of her
 * and a queue behind. If it takes twenty seconds she will reach for the paper
 * register instead, and we will have lost her.
 *
 * Body: { staff_id, service_ids[], phone?, full_name?, start_at? }
 * NOT in the body: price. There is nowhere to put one.
 */
export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const body = await req.json();

    const result = await AppointmentService.createWalkIn({
      businessId: ctx.businessId,
      branchId:   ctx.branchId,
      staffId:    String(body.staff_id ?? ''),
      serviceIds: Array.isArray(body.service_ids) ? body.service_ids : [],
      phone:      body.phone ? String(body.phone) : null,
      fullName:   body.full_name ? String(body.full_name) : null,
      startAt:    body.start_at ?? new Date().toISOString(),
      createdBy:  ctx.userId,
    });

    return created(result);
  } catch (e) { return fail(e, rid); }
}
