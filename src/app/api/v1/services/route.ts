import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { CatalogService } from '@/server/services/catalog.service';
import { ok, created, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/** GET /api/v1/services — the whole menu, grouped. */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const menu = await CatalogService.menu(ctx.businessId, ctx.branchId);
    return ok(menu);
  } catch (e) { return fail(e, rid); }
}

/** POST /api/v1/services — add a service. Hers or ours; we don't distinguish. */
export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const body = await req.json();

    const id = await CatalogService.createService(ctx.businessId, ctx.branchId, {
      name: String(body.name ?? ''),
      groupId: body.group_id ?? null,
      durationMinutes: Number(body.duration_minutes ?? 30),
      bufferMinutes: Number(body.buffer_minutes ?? 0),
      price: Number(body.price ?? 0),
    });

    return created({ id });
  } catch (e) { return fail(e, rid); }
}
