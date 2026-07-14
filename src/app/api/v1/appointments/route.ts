import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { AppointmentService } from '@/server/services/appointment.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/** GET /api/v1/appointments?date=2026-07-14 */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const date = req.nextUrl.searchParams.get('date')
      ?? new Date().toISOString().slice(0, 10);
    return ok(await AppointmentService.day(ctx.branchId, date));
  } catch (e) { return fail(e, rid); }
}
