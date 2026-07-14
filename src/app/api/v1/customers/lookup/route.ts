import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { AppointmentService } from '@/server/services/appointment.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/customers/lookup?phone=3001234567
 *
 * She types a number. If they've been before, their name and history appear
 * instantly. That moment — "Sana, 6 visits, last came 3 weeks ago" — is when
 * she understands what this product actually is.
 */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const phone = req.nextUrl.searchParams.get('phone') ?? '';
    return ok(await AppointmentService.lookupCustomer(ctx.businessId, phone));
  } catch (e) { return fail(e, rid); }
}
