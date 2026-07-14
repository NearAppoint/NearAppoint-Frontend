import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { CatalogService } from '@/server/services/catalog.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/services/seed
 *
 * She picked "Hair Salon". Load our 11 templates, pre-grouped, with sensible
 * durations. She edits from there.
 *
 * PRICES ARE NOT SET. A haircut in Johar Town is not a haircut in DHA, and we
 * do not pretend to know what she charges.
 */
export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);
    const count = await CatalogService.seedFromTemplates(ctx.businessId);
    return ok({ created: count });
  } catch (e) { return fail(e, rid); }
}
