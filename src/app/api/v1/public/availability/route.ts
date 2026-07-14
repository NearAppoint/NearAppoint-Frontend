import type { NextRequest } from 'next/server';
import { PublicService } from '@/server/services/public.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/** GET /api/v1/public/availability?branch_id=&service_ids=a,b&date=&staff_id= */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const q = req.nextUrl.searchParams;
    const slots = await PublicService.slots(
      q.get('branch_id') ?? '',
      (q.get('service_ids') ?? '').split(',').filter(Boolean),
      q.get('date') ?? new Date().toISOString().slice(0, 10),
      q.get('staff_id') || null,
    );
    return ok(slots);
  } catch (e) { return fail(e, rid); }
}
