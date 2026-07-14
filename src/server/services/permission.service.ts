import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * THE SINGLE AUTHORIZATION DECISION POINT.  (ADR-007)
 *
 * Why this exists rather than "just use RLS":
 *
 *   RLS is excellent for simple ownership (`user_id = auth.uid()`). Our model
 *   is businesses -> branches -> staff -> roles, plus platform admins, plus
 *   admin impersonation, plus cross-tenant analytics. Expressing all of that
 *   in policy expressions produces policies that nobody can audit and that the
 *   query planner cannot optimise.
 *
 *   Authorization logic that has to be REASONED ABOUT belongs in code you can
 *   unit-test. RLS stays on as the seatbelt that catches the bug you shipped
 *   anyway.
 *
 * Every mutating route calls requirePermission() as its FIRST statement.
 */
export type Permission =
  // appointments
  | 'appointments:read:all'      // whole branch
  | 'appointments:read:own'      // a stylist sees HER book and nobody else's
  | 'appointments:write'
  | 'appointments:cancel'
  | 'appointments:complete'
  // catalog
  | 'services:write'
  | 'pricing:write'              // OWNER ONLY by default — see note below
  // people
  | 'staff:read'
  | 'staff:write'
  | 'staff:commission:read:all'
  | 'staff:commission:read:own'
  | 'leaves:approve'
  | 'customers:read'
  | 'customers:notes:write'
  // insight
  | 'analytics:read'
  | 'revenue:read'
  | 'marketing:write'
  // control
  | 'settings:write'
  | 'subscription:manage'
  | 'roles:write'
  | 'audit:read'
  // platform
  | 'business:verify'
  | 'business:suspend'
  | 'refunds:issue'
  | 'impersonate';

/**
 * NOTE ON `pricing:write` — deliberately withheld from Manager by default.
 *
 * In a commission salon, whoever can change a price can change a stylist's
 * earnings. That is a fraud vector and a reliable source of internal disputes.
 * An owner may grant it explicitly. She should never grant it by accident.
 */

export interface Actor {
  userId: string;
  staffId: string | null;
  businessId: string | null;
  branchId: string | null;
  isPlatformAdmin: boolean;
  permissions: Permission[];
}

export class PermissionService {
  /** Resolve who is acting, from a verified JWT subject. */
  static async resolve(userId: string): Promise<Actor> {
    const sb = db();

    const { data: staff } = await sb
      .from('staff')
      .select('id, business_id, branch_id, roles ( permissions )')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    const { data: admin } = await sb
      .from('admin_users')
      .select('permissions')
      .eq('user_id', userId)
      .maybeSingle();

    const staffPerms = ((staff as any)?.roles?.permissions ?? []) as Permission[];
    const adminPerms = ((admin as any)?.permissions ?? []) as Permission[];

    return {
      userId,
      staffId: staff?.id ?? null,
      businessId: staff?.business_id ?? null,
      branchId: staff?.branch_id ?? null,
      isPlatformAdmin: !!admin,
      permissions: [...staffPerms, ...adminPerms],
    };
  }

  static can(actor: Actor | null, perm: Permission): boolean {
    return !!actor?.permissions.includes(perm);
  }

  /** Throws. First line of every mutating route handler. */
  static require(actor: Actor | null, perm: Permission): asserts actor is Actor {
    if (!actor) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
    if (!actor.permissions.includes(perm)) {
      throw new ApiError('FORBIDDEN', 'You do not have access to this.');
    }
  }

  /**
   * TENANT GUARD. Call on every route that takes a business_id or branch_id
   * from the client.
   *
   * Without this, `GET /api/v1/businesses/{someone-elses-uuid}/customers`
   * returns another salon's entire customer list. That is the company-ending
   * bug, and it is one forgotten line away at all times.
   */
  static requireBusiness(actor: Actor | null, businessId: string): asserts actor is Actor {
    if (!actor) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
    if (actor.isPlatformAdmin) return;
    if (actor.businessId !== businessId) {
      // Deliberately a 404, not a 403. A 403 confirms the resource exists,
      // which lets an attacker enumerate your businesses.
      throw new ApiError('NOT_FOUND', 'Not found.');
    }
  }
}
