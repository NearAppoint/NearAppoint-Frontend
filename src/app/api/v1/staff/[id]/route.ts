import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { StaffService } from '@/server/services/staff.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

async function assertOwned(staffId: string, businessId: string) {
  const { data } = await db().from('staff')
    .select('id').eq('id', staffId).eq('business_id', businessId).maybeSingle();
  if (!data) throw new ApiError('NOT_FOUND', 'Not found.');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);

    const body = await req.json();
    await StaffService.update(id, {
      fullName:   body.full_name,
      gender:     body.gender,
      isBookable: body.is_bookable,
      serviceIds: body.service_ids,
    });

    return ok({ id });
  } catch (e) { return fail(e, rid); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);
    await StaffService.remove(id);
    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
