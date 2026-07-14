import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { ScheduleService } from '@/server/services/schedule.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    return ok(await ScheduleService.hours(ctx.branchId));
  } catch (e) { return fail(e, rid); }
}

export async function PUT(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const body = await req.json();
    await ScheduleService.setHours(ctx.branchId, body.hours ?? []);
    return ok(await ScheduleService.hours(ctx.branchId));
  } catch (e) { return fail(e, rid); }
}
