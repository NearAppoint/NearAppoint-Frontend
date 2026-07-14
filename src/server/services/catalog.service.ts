import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * HER MENU.
 *
 * Groups are hers — she names them, creates them, reorders them.
 * The six business categories are ours and she cannot change them.
 *
 * PRICE IS BRANCH-SCOPED, NOT SERVICE-SCOPED. The same haircut costs more in
 * DHA than in Johar Town, and a business with two branches must be able to
 * price them differently. `services` holds the definition; `branch_services`
 * holds the money.
 */
export interface ServiceRow {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_after_minutes: number;
  price: number | null;
  booking_policy: 'bookable' | 'consultation_only' | 'disabled';
  policy_reason: string | null;
  is_bookable_online: boolean;
  group_id: string | null;
  display_order: number;
}

export interface GroupRow {
  id: string;
  name: string;
  display_order: number;
  services: ServiceRow[];
}

export class CatalogService {
  /** The whole menu, grouped, with branch prices. */
  static async menu(businessId: string, branchId: string): Promise<GroupRow[]> {
    const sb = db();

    const [{ data: groups }, { data: services }, { data: prices }] = await Promise.all([
      sb.from('service_groups')
        .select('id, name, display_order')
        .eq('business_id', businessId).is('deleted_at', null)
        .order('display_order'),
      sb.from('services')
        .select('id, name, duration_minutes, buffer_after_minutes, booking_policy, is_bookable_online, group_id, display_order, subcategories(policy_reason)')
        .eq('business_id', businessId).is('deleted_at', null)
        .order('display_order'),
      sb.from('branch_services')
        .select('service_id, price')
        .eq('branch_id', branchId).is('deleted_at', null),
    ]);

    const priceOf = new Map<string, number>(
      (prices ?? []).map((p: { service_id: string; price: number }) => [p.service_id, Number(p.price)]),
    );

    const toRow = (s: Record<string, unknown>): ServiceRow => ({
      id: s.id as string,
      name: s.name as string,
      duration_minutes: s.duration_minutes as number,
      buffer_after_minutes: s.buffer_after_minutes as number,
      price: priceOf.get(s.id as string) ?? null,
      booking_policy: s.booking_policy as ServiceRow['booking_policy'],
      policy_reason: (s.subcategories as { policy_reason?: string } | null)?.policy_reason ?? null,
      is_bookable_online: s.is_bookable_online as boolean,
      group_id: (s.group_id as string) ?? null,
      display_order: s.display_order as number,
    });

    const rows = (services ?? []).map(toRow);

    const out: GroupRow[] = (groups ?? []).map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      display_order: g.display_order as number,
      services: rows.filter(s => s.group_id === g.id),
    }));

    // Services with no group still have to appear, or she'll think we lost them.
    const ungrouped = rows.filter(s => !s.group_id);
    if (ungrouped.length) {
      out.push({ id: 'ungrouped', name: 'Ungrouped', display_order: 999, services: ungrouped });
    }

    return out;
  }

  /** Load our templates for her category. One tap, 11 services. */
  static async seedFromTemplates(businessId: string): Promise<number> {
    const { data, error } = await db().rpc('seed_services_from_templates', {
      p_business_id: businessId,
    });
    if (error) throw new ApiError('INTERNAL', 'Could not load the service templates.');
    return (data as number) ?? 0;
  }

  static async createGroup(businessId: string, name: string): Promise<string> {
    if (!name.trim()) throw new ApiError('VALIDATION_FAILED', 'Give the group a name.');

    const { count } = await db().from('service_groups')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId).is('deleted_at', null);

    const { data, error } = await db().from('service_groups')
      .insert({ business_id: businessId, name: name.trim(), display_order: count ?? 0 })
      .select('id').single();

    if (error) throw new ApiError('INTERNAL', 'Could not create the group.');
    return data.id;
  }

  /**
   * Create a service. Hers, or one of ours — the API doesn't care.
   *
   * NOTE: the price goes to branch_services, NOT to services. A service is a
   * definition; a price is a fact about a place.
   */
  static async createService(
    businessId: string,
    branchId: string,
    input: { name: string; groupId: string | null; durationMinutes: number;
             bufferMinutes: number; price: number },
  ): Promise<string> {
    if (!input.name.trim()) throw new ApiError('VALIDATION_FAILED', 'Give the service a name.');
    if (input.durationMinutes < 5 || input.durationMinutes > 480) {
      throw new ApiError('VALIDATION_FAILED', 'Duration must be between 5 minutes and 8 hours.');
    }
    if (input.price < 0) throw new ApiError('VALIDATION_FAILED', 'Price cannot be negative.');

    const { data: biz } = await db().from('businesses')
      .select('primary_category_id').eq('id', businessId).single();

    const { data: svc, error } = await db().from('services')
      .insert({
        business_id: businessId,
        category_id: biz!.primary_category_id,
        group_id: input.groupId,
        name: input.name.trim(),
        duration_minutes: input.durationMinutes,
        buffer_after_minutes: input.bufferMinutes,
        booking_policy: 'bookable',
        is_bookable_online: true,
      })
      .select('id').single();

    if (error) throw new ApiError('INTERNAL', 'Could not create the service.');

    await db().from('branch_services').insert({
      branch_id: branchId,
      service_id: svc.id,
      price: input.price,
      currency: 'PKR',
    });

    return svc.id;
  }

  static async setPrice(branchId: string, serviceId: string, price: number): Promise<void> {
    if (price < 0) throw new ApiError('VALIDATION_FAILED', 'Price cannot be negative.');

    const { error } = await db().from('branch_services')
      .upsert(
        { branch_id: branchId, service_id: serviceId, price, currency: 'PKR' },
        { onConflict: 'branch_id,service_id' },
      );
    if (error) throw new ApiError('INTERNAL', 'Could not save the price.');
  }

  static async updateService(
    serviceId: string,
    patch: { name?: string; durationMinutes?: number; bufferMinutes?: number;
             isBookableOnline?: boolean; groupId?: string | null },
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined)             update.name = patch.name.trim();
    if (patch.durationMinutes !== undefined)  update.duration_minutes = patch.durationMinutes;
    if (patch.bufferMinutes !== undefined)    update.buffer_after_minutes = patch.bufferMinutes;
    if (patch.isBookableOnline !== undefined) update.is_bookable_online = patch.isBookableOnline;
    if (patch.groupId !== undefined)          update.group_id = patch.groupId;

    if (!Object.keys(update).length) return;

    const { error } = await db().from('services').update(update).eq('id', serviceId);
    if (error) throw new ApiError('INTERNAL', 'Could not save the service.');
  }

  /**
   * SOFT DELETE. Always.
   *
   * A hard delete would orphan every appointment that ever used this service —
   * and appointment_items denormalises the name and price precisely so that
   * history survives a menu change. Deleting the row would break that promise.
   */
  static async deleteService(serviceId: string): Promise<void> {
    await db().from('services')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', serviceId);
  }

  static async deleteGroup(groupId: string): Promise<void> {
    // Services fall back to ungrouped rather than vanishing with the group.
    // She deleted a folder, not her menu.
    await db().from('services').update({ group_id: null }).eq('group_id', groupId);
    await db().from('service_groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId);
  }
}
