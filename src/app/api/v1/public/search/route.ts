import type { NextRequest } from 'next/server';
import { PublicService } from '@/server/services/public.service';
import { authenticate } from '@/server/services/auth.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/public/search
 *
 * Public — no auth required. But if she IS signed in, we read her gender and
 * apply the hard filter: a women-only salon never appears for a male customer.
 */
export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const q = req.nextUrl.searchParams;

    let gender: 'female' | 'male' | null = null;
    const actor = await authenticate(req).catch(() => null);
    if (actor) {
      const { data } = await db().from('customers')
        .select('gender').eq('id', actor.userId).maybeSingle();
      if (data?.gender === 'female' || data?.gender === 'male') gender = data.gender;
    }

    const results = await PublicService.search({
      city: q.get('city') ?? 'Lahore',
      query: q.get('q') ?? undefined,
      category: q.get('category') ?? undefined,
      gender,
      lat: q.get('lat') ? Number(q.get('lat')) : null,
      lng: q.get('lng') ? Number(q.get('lng')) : null,
    });

    return ok(results);
  } catch (e) { return fail(e, rid); }
}
