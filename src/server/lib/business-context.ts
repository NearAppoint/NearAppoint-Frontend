import 'server-only';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/server/services/auth.service';
import { AccountService } from '@/server/services/account.service';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * Every business route needs: who are you, which business, which branch.
 *
 * Resolved on the SERVER from the session. The client NEVER sends a business_id
 * — if it could, `GET /services?business_id=<someone-else's-uuid>` would return
 * another salon's entire menu. That is the class of bug that ends companies,
 * and it is one forgotten check away at all times.
 */
export interface BusinessContext {
  userId: string;
  businessId: string;
  branchId: string;
}

export async function businessContext(req: NextRequest): Promise<BusinessContext> {
  const actor = await requireAuth(req);
  const account = await AccountService.get(actor.userId);

  if (!account || account.accountType !== 'business' || !account.businessId) {
    throw new ApiError('FORBIDDEN', 'This is a business-only area.');
  }

  const { data: branch } = await db()
    .from('branches')
    .select('id')
    .eq('business_id', account.businessId)
    .is('deleted_at', null)
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (!branch) throw new ApiError('NOT_FOUND', 'No branch found for this business.');

  return { userId: actor.userId, businessId: account.businessId, branchId: branch.id };
}
