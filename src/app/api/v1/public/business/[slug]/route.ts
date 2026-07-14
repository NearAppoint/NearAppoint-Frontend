import type { NextRequest } from 'next/server';
import { PublicService } from '@/server/services/public.service';
import { ok, fail } from '@/server/lib/response';
import { requestId } from '@/server/lib/request-id';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const rid = requestId();
  try {
    const { slug } = await params;
    return ok(await PublicService.business(slug));
  } catch (e) { return fail(e, rid); }
}
