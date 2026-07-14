import 'server-only';
import { db } from '@/server/database/client';
import { ApiError, isExclusionViolation } from '@/server/lib/errors';

/**
 * THE APPOINTMENT LIFECYCLE.
 *
 * Before this, she could Start and Complete. She could not CANCEL.
 *
 * Which meant a no-show at 6pm on a Saturday left that appointment sitting in
 * 'checked_in' forever — inside the EXCLUDE constraint's predicate, blocking
 * the chair. She could not sell it to the walk-in standing in front of her.
 *
 * Terminal statuses drop OUT of the predicate and release the slot
 * automatically. That is the whole fix, and it needs no cron and no cleanup.
 */
export class LifecycleService {
  /**
   * Cancel, or mark a no-show. Both release the slot.
   *
   * The difference is what it means for the customer's reliability — and since
   * we removed the booking fee, reliability is the ONLY no-show defence we have
   * left. It is load-bearing.
   */
  static async cancel(
    appointmentId: string, actor: string, reason: string | null, noShow: boolean,
  ): Promise<void> {
    const { error } = await db().rpc('cancel_appointment', {
      p_appointment_id: appointmentId,
      p_actor: actor,
      p_reason: reason,
      p_no_show: noShow,
    });
    if (error) {
      throw new ApiError('VALIDATION_FAILED',
        (error as { message?: string }).message ?? 'Could not cancel.');
    }
  }

  /**
   * Undo. She tapped Complete on the wrong row.
   *
   * That happens forty times a day at a busy counter, and without an undo she
   * will be AFRAID to use the button — which means she'll stop marking things
   * complete, and the day's revenue stops being true.
   */
  static async reopen(appointmentId: string, actor: string): Promise<void> {
    const { error } = await db().rpc('reopen_appointment', {
      p_appointment_id: appointmentId,
      p_actor: actor,
    });

    if (error) {
      // Someone took the slot while it was free. Tell her the truth — that is
      // far better than silently double-booking the chair.
      if (isExclusionViolation(error)) {
        throw new ApiError('SLOT_TAKEN',
          'Someone else has taken that slot. You\u2019ll need to book them in again at a new time.');
      }
      throw new ApiError('VALIDATION_FAILED',
        (error as { message?: string }).message ?? 'Could not reopen.');
    }
  }

  /**
   * Move it. ONE TRANSACTION.
   *
   * If the new time collides, the constraint fires and the whole thing rolls
   * back — the customer KEEPS HER ORIGINAL SLOT.
   *
   * A naive delete-then-insert would drop her booking and then fail, leaving
   * her with nothing at all. That is the worst possible outcome, and it is what
   * most implementations do.
   */
  static async reschedule(
    appointmentId: string, startAt: string, staffId: string, actor: string,
  ): Promise<{ endsAt: string }> {
    const { data, error } = await db().rpc('reschedule_appointment', {
      p_appointment_id: appointmentId,
      p_new_start_at: startAt,
      p_new_staff_id: staffId,
      p_actor: actor,
    });

    if (error) {
      if (isExclusionViolation(error)) {
        throw new ApiError('SLOT_TAKEN',
          'That time isn\u2019t free. The original booking is untouched \u2014 pick another slot.');
      }
      throw new ApiError('VALIDATION_FAILED',
        (error as { message?: string }).message ?? 'Could not move it.');
    }

    return { endsAt: (data as any[])?.[0]?.out_ends_at };
  }

  /**
   * Complete, with an adjusted bill.
   *
   * Quoted Rs 3,600, charged Rs 4,000 because the colour took an extra tube.
   *
   * We record BOTH. The quote is never overwritten — it's what the customer was
   * told, and it's a promise. Silently editing it would make her reports lie,
   * and would erase the record that someone was charged more than quoted. That
   * ends in a WhatsApp argument she cannot win.
   */
  static async complete(
    appointmentId: string, actor: string, finalAmount?: number, reason?: string,
  ): Promise<void> {
    const { error } = await db().rpc('complete_appointment', {
      p_appointment_id: appointmentId,
      p_actor: actor,
      p_final_amount: finalAmount ?? null,
      p_reason: reason ?? null,
    });
    if (error) {
      throw new ApiError('VALIDATION_FAILED',
        (error as { message?: string }).message ?? 'Could not complete.');
    }
  }
}
