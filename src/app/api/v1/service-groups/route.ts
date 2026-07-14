import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { CatalogService } from '@/server/services/catalog.service';
import { created, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/** POST /api/v1/service-groups — she names her own groups. */
export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const body = await req.json();
    const id = await CatalogService.createGroup(ctx.businessId, String(body.name ?? ''));
    return created({ id });
  } catch (e) { return fail(e, rid); }
}
