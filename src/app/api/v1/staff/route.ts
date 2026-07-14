import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { StaffService } from '@/server/services/staff.service';
import { ok, created, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    return ok(await StaffService.list(ctx.businessId));
  } catch (e) { return fail(e, rid); }
}

export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const body = await req.json();

    const id = await StaffService.create(ctx.businessId, ctx.branchId, {
      fullName: String(body.full_name ?? ''),
      phone: String(body.phone ?? ''),
      gender: body.gender ?? null,
      serviceIds: Array.isArray(body.service_ids) ? body.service_ids : [],
    });

    return created({ id });
  } catch (e) { return fail(e, rid); }
}
