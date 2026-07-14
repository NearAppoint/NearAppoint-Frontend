import type { NextRequest } from 'next/server';
import { businessContext } from '@/server/lib/business-context';
import { ReportService } from '@/server/services/report.service';
import { EntitlementService } from '@/server/services/entitlement.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/** GET /api/v1/reports?from=2026-07-08&to=2026-07-14 */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const ctx = await businessContext(req);

    /**
     * Basic analytics is in EVERY plan, including Trial.
     *
     * A salon that can't see whether she made more this week than last has no
     * reason to keep the subscription. Gating the ONE screen that proves the
     * product is working would be a spectacular own goal.
     */
    await EntitlementService.require(ctx.businessId, 'analytics.basic');

    const q = req.nextUrl.searchParams;
    const to   = q.get('to')   ?? new Date().toISOString().slice(0, 10);
    const from = q.get('from') ?? daysAgo(6);

    return ok(await ReportService.build(ctx.branchId, from, to));
  } catch (e) { return fail(e, rid); }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
