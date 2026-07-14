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
  /** Needed by reschedule: availability must be asked for the SAME services,
      or the new slot won't be long enough and the constraint will refuse it. */
  service_ids: string[];
  start_at: string;      // what the customer sees
  end_at: string;
  occupies_end_at: string;   // includes buffer — SHE sees this, the customer never does
  total: number;
  source: string;
}

export class AppointmentService {
  /**
   * Everything on the calendar for one day.
   *
   * ⚠️  THIS USED TO BE BROKEN, AND IT BROKE SILENTLY.
   *
   * The old version filtered with .gte('time_range', from) — comparing a
   * tstzrange to a timestamp. Postgres doesn't error on that; it coerces and
   * quietly matches nothing.
   *
   * So a customer booked a real appointment, the database stored it perfectly,
   * the EXCLUDE constraint held the slot — and the owner's calendar said
   * "0 appointments".
   *
   * That is the worst failure this product can have. Not a crash — a calendar
   * that is confidently, silently WRONG. She turns up, the customer turns up,
   * and she has no idea who they are.
   *
   * Now it asks the right question in SQL: does this appointment OVERLAP the
   * day? Which also correctly catches a booking that starts at 23:30 and runs
   * past midnight — it belongs to both days, and she needs to see it on both.
   */
  static async day(branchId: string, date: string): Promise<CalendarItem[]> {
    const { data, error } = await db().rpc('appointments_for_day', {
      p_branch_id: branchId,
      p_date: date,
    });

    if (error) {
      console.error('[calendar]', error);
      throw new ApiError('INTERNAL', 'Could not load the calendar.');
    }

    return ((data ?? []) as any[]).map(a => ({
      id: a.id,
      reference: a.reference,
      status: a.status,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      staff_id: a.staff_id,
      staff_name: a.staff_name,
      services: a.services ?? [],
      service_ids: a.service_ids ?? [],
      start_at: a.start_at ? new Date(a.start_at).toISOString() : '',
      end_at: a.end_at ? new Date(a.end_at).toISOString() : '',
      occupies_end_at: a.occupies_end_at ? new Date(a.occupies_end_at).toISOString() : '',
      total: Number(a.total),
      source: a.source,
    }));
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

