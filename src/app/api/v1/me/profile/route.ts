import type { NextRequest } from 'next/server';
import { requireAuth } from '@/server/services/auth.service';
import { db } from '@/server/database/client';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';
import { ApiError } from '@/server/lib/errors';
import { toE164, isValidPkMobile } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    const actor = await requireAuth(req);
    const { data } = await db().from('customers')
      .select('phone, full_name, gender').eq('id', actor.userId).maybeSingle();
    return ok(data);
  } catch (e) { return fail(e, rid); }
}

/**
 * PATCH /api/v1/me/profile
 *
 * Google gives us an email, not a phone number. We ask for the number at the
 * moment she books — where the reason is obvious ("so we can remind you") —
 * rather than up front, where it's just a hurdle.
 */
export async function PATCH(req: NextRequest) {
  const rid = requestId();
  try {
    const actor = await requireAuth(req);
    const b = await req.json();

    const update: Record<string, unknown> = {};

    if (b.phone !== undefined) {
      if (!isValidPkMobile(String(b.phone))) {
        throw new ApiError('VALIDATION_FAILED',
          'That doesn\u2019t look like a Pakistani mobile number.');
      }
      update.phone = toE164(String(b.phone));
    }
    if (b.full_name !== undefined) update.full_name = String(b.full_name).trim() || null;
    if (b.gender !== undefined)    update.gender = b.gender || null;

    // customers.id is the auth user id, so upsert covers the case where a
    // Google signup never created the row.
    const { error } = await db().from('customers').upsert(
      { id: actor.userId, ...update },
      { onConflict: 'id' },
    );

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ApiError('VALIDATION_FAILED',
          'That number is already used by another account.');
      }
      throw new ApiError('INTERNAL', 'Could not save.');
    }

    return ok({ ok: true });
  } catch (e) { return fail(e, rid); }
}
