import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';
import { EntitlementService } from '@/server/services/entitlement.service';
import { isValidPkMobile, toE164 } from '@/lib/phone';

/**
 * STAFF.
 *
 * Staff do NOT log in. They are names on a calendar with a set of services they
 * can perform. That's it.
 *
 * A 6-stylist salon with high churn and shared devices will not adopt a
 * separate staff app — that is an install nobody performs and an account nobody
 * maintains. When staff need to see their day, we send it to them on WhatsApp,
 * which is where they already are.
 */
export interface StaffRow {
  id: string;
  full_name: string;
  phone: string;
  gender: 'female' | 'male' | null;
  is_bookable: boolean;
  service_ids: string[];
}

export class StaffService {
  static async list(businessId: string): Promise<StaffRow[]> {
    const { data } = await db()
      .from('staff')
      .select('id, full_name, phone, gender, is_bookable, staff_services(service_id)')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .neq('status', 'left')
      .order('created_at');

    return (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      full_name: s.full_name as string,
      phone: s.phone as string,
      gender: (s.gender as StaffRow['gender']) ?? null,
      is_bookable: s.is_bookable as boolean,
      service_ids: ((s.staff_services as { service_id: string }[]) ?? []).map(x => x.service_id),
    }));
  }

  static async create(
    businessId: string,
    branchId: string,
    input: { fullName: string; phone: string; gender: 'female' | 'male' | null;
             serviceIds: string[] },
  ): Promise<string> {
    if (!input.fullName.trim()) throw new ApiError('VALIDATION_FAILED', 'Enter their name.');
    if (!isValidPkMobile(input.phone)) {
      throw new ApiError('VALIDATION_FAILED',
        'That doesn\u2019t look like a Pakistani mobile number. It should start with 3.');
    }

    /**
     * The Trial plan caps staff at 5. Enforced HERE, not in the UI — a cap that
     * only exists in a React component is a cap that a curl request ignores.
     */
    const existing = await StaffService.list(businessId);
    await EntitlementService.requireWithinLimit(businessId, 'staff.basic', existing.length);

    const { data: role } = await db().from('roles')
      .select('id').is('business_id', null).eq('code', 'staff').single();

    const { data, error } = await db().from('staff')
      .insert({
        business_id: businessId,
        branch_id: branchId,
        role_id: role!.id,
        full_name: input.fullName.trim(),
        phone: toE164(input.phone),
        gender: input.gender,
        status: 'active',
        is_bookable: true,
        user_id: null,   // staff do not log in
      })
      .select('id').single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ApiError('VALIDATION_FAILED',
          'Someone with that number is already on your team.');
      }
      throw new ApiError('INTERNAL', 'Could not add them.');
    }

    if (input.serviceIds.length) {
      await db().from('staff_services').insert(
        input.serviceIds.map(sid => ({ staff_id: data.id, service_id: sid })),
      );
    }

    return data.id;
  }

  static async update(
    staffId: string,
    patch: { fullName?: string; gender?: 'female' | 'male' | null;
             isBookable?: boolean; serviceIds?: string[] },
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.fullName !== undefined)   update.full_name = patch.fullName.trim();
    if (patch.gender !== undefined)     update.gender = patch.gender;
    if (patch.isBookable !== undefined) update.is_bookable = patch.isBookable;

    if (Object.keys(update).length) {
      await db().from('staff').update(update).eq('id', staffId);
    }

    // Which services she can perform. Replace wholesale — simpler than diffing,
    // and this list is tiny.
    if (patch.serviceIds !== undefined) {
      await db().from('staff_services').delete().eq('staff_id', staffId);
      if (patch.serviceIds.length) {
        await db().from('staff_services').insert(
          patch.serviceIds.map(sid => ({ staff_id: staffId, service_id: sid })),
        );
      }
    }
  }

  /**
   * SOFT DELETE. A stylist who leaves still performed hundreds of appointments,
   * and those records — and her commission history — must survive her leaving.
   */
  static async remove(staffId: string): Promise<void> {
    await db().from('staff')
      .update({ deleted_at: new Date().toISOString(), status: 'left', is_bookable: false })
      .eq('id', staffId);
  }
}
