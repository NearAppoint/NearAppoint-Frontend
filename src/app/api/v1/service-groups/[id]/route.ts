import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { CatalogService } from '@/server/services/catalog.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

async function assertOwned(groupId: string, businessId: string) {
  const { data } = await db().from('service_groups')
    .select('id').eq('id', groupId).eq('business_id', businessId).maybeSingle();
  if (!data) throw new ApiError('NOT_FOUND', 'Not found.');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);

    const body = await req.json();
    await db().from('service_groups')
      .update({ name: String(body.name ?? '').trim() })
      .eq('id', id);

    return ok({ id });
  } catch (e) { return fail(e, rid); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);
    await CatalogService.deleteGroup(id);
    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
