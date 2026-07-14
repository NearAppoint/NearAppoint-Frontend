import 'server-only';
import { db } from '@/server/database/client';
import { ApiError, isExclusionViolation } from '@/server/lib/errors';
import { toE164, isValidPkMobile } from '@/lib/phone';

/**
 * APPOINTMENTS.
 *
 * The only way an appointment is created is through create_walk_in() in the
 * database — one transaction, with the EXCLUDE constraint as the final word.
 *
 * We never check availability and then insert. That is a race condition with a
 * nicer name: two receptionists on two tablets tapping "Start" for the same
 * stylist 50ms apart will BOTH pass any check you can write in application
 * code. The constraint is what makes the promise true.
 */
export type ApptStatus =
  | 'pending_payment' | 'confirmed' | 'rescheduled' | 'checked_in' | 'late'
  | 'in_progress' | 'completed' | 'no_show'
  | 'cancelled_by_customer' | 'cancelled_by_business' | 'expired';

export interface CalendarItem {
  id: string;
  reference: string;
  status: ApptStatus;
  customer_name: string;
  customer_phone: string | null;
  staff_id: string | null;
  staff_name: string | null;
  services: string[];
  start_at: string;      // what the customer sees
  end_at: string;
  occupies_end_at: string;   // includes buffer — SHE sees this, the customer never does
  total: number;
  source: string;
}

export class AppointmentService {
  /** Everything on the calendar for one day. */
  static async day(branchId: string, date: string): Promise<CalendarItem[]> {
    // The business day. Not midnight-to-midnight — a Chaand Raat booking at
    // 23:30 belongs to today, not tomorrow.
    const from = `${date}T00:00:00+05:00`;
    const to   = `${date}T23:59:59+05:00`;

    const { data, error } = await db()
      .from('appointments')
      .select(`
        id, reference, status, source, total, time_range,
        business_customers ( full_name, phone ),
        appointment_items ( service_name, occupies_range, service_range, staff_id,
                            staff ( full_name ) )
      `)
      .eq('branch_id', branchId)
      .not('status', 'in', '(cancelled_by_customer,cancelled_by_business,expired,no_show)')
      .gte('time_range', from)
      .lt('time_range', to);

    if (error) throw new ApiError('INTERNAL', 'Could not load the calendar.');

    return (data ?? []).map((a: Record<string, any>) => {
      const items = a.appointment_items ?? [];
      const first = items[0];

      const starts = items.map((i: any) => parseRange(i.service_range)[0]).filter(Boolean);
      const svcEnds = items.map((i: any) => parseRange(i.service_range)[1]).filter(Boolean);
      const occEnds = items.map((i: any) => parseRange(i.occupies_range)[1]).filter(Boolean);

      return {
        id: a.id,
        reference: a.reference,
        status: a.status,
        customer_name: a.business_customers?.full_name ?? 'Walk-in',
        customer_phone: a.business_customers?.phone?.startsWith('+92')
          ? a.business_customers.phone : null,
        staff_id: first?.staff_id ?? null,
        staff_name: first?.staff?.full_name ?? null,
        services: items.map((i: any) => i.service_name),
        start_at: min(starts),
        end_at: max(svcEnds),
        occupies_end_at: max(occEnds),
        total: Number(a.total),
        source: a.source,
      };
    }).sort((x, y) => x.start_at.localeCompare(y.start_at));
  }

  /**
   * Create a walk-in.
   *
   * Note what is NOT a parameter: a price. The database resolves it from
   * branch_services. There is nowhere for the client to put one.
   */
  static async createWalkIn(input: {
    businessId: string; branchId: string; staffId: string;
    serviceIds: string[]; phone: string | null; fullName: string | null;
    startAt: string; createdBy: string;
  }): Promise<{ id: string; reference: string; endsAt: string }> {
    if (!input.serviceIds.length) {
      throw new ApiError('VALIDATION_FAILED', 'Pick at least one service.');
    }
    if (!input.staffId) {
      throw new ApiError('VALIDATION_FAILED', 'Pick who will do it.');
    }
    if (input.phone && !isValidPkMobile(input.phone)) {
      throw new ApiError('VALIDATION_FAILED',
        'That doesn\u2019t look like a Pakistani mobile number.');
    }

    const { data, error } = await db().rpc('create_walk_in', {
      p_business_id: input.businessId,
      p_branch_id:   input.branchId,
      p_staff_id:    input.staffId,
      p_service_ids: input.serviceIds,
      p_phone:       input.phone ? toE164(input.phone) : null,
      p_full_name:   input.fullName,
      p_start_at:    input.startAt,
      p_created_by:  input.createdBy,
    });

    if (error) {
      /**
       * 23P01 = exclusion_violation. The double-booking constraint fired.
       *
       * THIS IS NOT A FAILURE. THIS IS THE SYSTEM WORKING.
       *
       * She tried to give Hina a customer while Hina is mid-haircut. The
       * database refused. Tell her that, in her language — not a 500.
       */
      if (isExclusionViolation(error)) {
        throw new ApiError('SLOT_TAKEN',
          'That stylist is already busy at this time. Pick someone else, or a later start.');
      }
      console.error('[createWalkIn]', error);
      throw new ApiError('INTERNAL', (error as { message?: string }).message ?? 'Could not add the walk-in.');
    }

    const row = (data as any[])?.[0];
    return { id: row.out_appointment_id, reference: row.out_reference, endsAt: row.out_ends_at };
  }

  static async setStatus(
    appointmentId: string, status: ApptStatus, actor: string, finalAmount?: number,
  ): Promise<void> {
    const { error } = await db().rpc('set_appointment_status', {
      p_appointment_id: appointmentId,
      p_status: status,
      p_actor: actor,
      p_final_amount: finalAmount ?? null,
    });
    if (error) throw new ApiError('INTERNAL', 'Could not update the appointment.');
  }

  /**
   * Does this business already know this phone number?
   *
   * When she types a number at the counter and his name, his usual service and
   * his six previous visits appear instantly — that is the moment she
   * understands what this product is for. It is the best demo we have.
   */
  static async lookupCustomer(businessId: string, phone: string) {
    if (!isValidPkMobile(phone)) return null;

    const { data } = await db()
      .from('business_customers')
      .select('id, full_name, phone, total_visits, last_visit_at, notes, preferred_staff_id')
      .eq('business_id', businessId)
      .eq('phone', toE164(phone))
      .is('deleted_at', null)
      .maybeSingle();

    return data;
  }
}

/* ---- tstzrange parsing. Postgres gives us ["2026-07-14 14:00+05","..."). ---- */
function parseRange(r: string | null): [string, string] {
  if (!r) return ['', ''];
  const m = r.match(/^[\[(]"?([^",]+)"?,"?([^",)\]]+)"?[\])]$/);
  if (!m) return ['', ''];
  return [new Date(m[1]!).toISOString(), new Date(m[2]!).toISOString()];
}
const min = (a: string[]) => a.length ? a.reduce((x, y) => (x < y ? x : y)) : '';
const max = (a: string[]) => a.length ? a.reduce((x, y) => (x > y ? x : y)) : '';
