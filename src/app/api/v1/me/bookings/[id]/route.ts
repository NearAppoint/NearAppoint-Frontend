import type { NextRequest } from 'next/server';
import { requireAuth } from '@/server/services/auth.service';
import { PublicService } from '@/server/services/public.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  try {
    const { id } = await params;
    const actor = await requireAuth(req);
    await PublicService.cancel(id, actor.userId);
    return ok({ id });
  } catch (e) { return fail(e, rid); }
}
