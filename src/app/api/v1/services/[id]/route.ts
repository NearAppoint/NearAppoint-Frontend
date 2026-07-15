import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { CatalogService } from '@/server/services/catalog.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Confirm this service belongs to this business BEFORE touching it.
 *
 * Without this, PATCH /api/v1/services/<another-salon's-uuid> would edit their
 * menu. A 404 — not a 403 — because a 403 confirms the row exists and lets you
 * enumerate every service on the platform.
 */
async function assertOwned(serviceId: string, businessId: string) {
  const { data } = await db().from('services')
    .select('id').eq('id', serviceId).eq('business_id', businessId).maybeSingle();
  if (!data) throw new ApiError('NOT_FOUND', 'Not found.');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const ctx = await businessContext(req);
    await assertOwned(id, ctx.businessId);

    const body = await req.json();

    if (body.price !== undefined) {
      await CatalogService.setPrice(ctx.branchId, id, Number(body.price));
    }

    await CatalogService.updateService(id, {
      name:             body.name,
      durationMinutes:  body.duration_minutes,
      bufferMinutes:    body.buffer_minutes,
      isBookableOnline: body.is_bookable_online,
      groupId:          body.group_id,
      description:      body.description,
      imageUrl:         body.image_url,
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
    await CatalogService.deleteService(id);
    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
