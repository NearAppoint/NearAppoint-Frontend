import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * OPENING HOURS.
 *
 * Three layers exist in the schema (weekly template -> seasonal override ->
 * breaks). This feature builds only the first. Ramadan hours and Friday-prayer
 * breaks come next — but they are NOT optional extras.
 *
 * Salons INVERT their hours for 30 days of Ramadan and run near-24/7 before
 * Eid, which is their highest-revenue week of the year. A product that can't
 * express that is useless to her at the exact moment it matters most.
 */
export interface DayHours {
  day_of_week: number;   // 0 = Sunday
  opens_at: string;      // "11:00"
  closes_at: string;     // "21:00"
  is_closed: boolean;
}

export class ScheduleService {
  static async hours(branchId: string): Promise<DayHours[]> {
    const { data } = await db()
      .from('schedule_templates')
      .select('day_of_week, opens_at, closes_at, is_closed')
      .eq('branch_id', branchId)
      .is('staff_id', null)
      .order('day_of_week');

    if (!data?.length) {
      // A business with no hours has no calendar. Seed sensible defaults rather
      // than showing her an empty grid and letting her wonder what's broken.
      await db().rpc('seed_default_hours', { p_branch_id: branchId });
      const { data: seeded } = await db()
        .from('schedule_templates')
        .select('day_of_week, opens_at, closes_at, is_closed')
        .eq('branch_id', branchId)
        .is('staff_id', null)
        .order('day_of_week');
      return (seeded ?? []).map(clean);
    }

    return data.map(clean);
  }

  static async setHours(branchId: string, hours: DayHours[]): Promise<void> {
    for (const h of hours) {
      if (!h.is_closed && h.opens_at >= h.closes_at) {
        // Past-midnight closing is legitimate (Chaand Raat) but not supported
        // in this feature. Reject it honestly rather than silently producing a
        // zero-length day.
        throw new ApiError('VALIDATION_FAILED',
          `Closing time must be after opening time on ${dayName(h.day_of_week)}.`);
      }

      await db().from('schedule_templates').upsert(
        {
          branch_id: branchId,
          staff_id: null,
          day_of_week: h.day_of_week,
          opens_at: h.opens_at,
          closes_at: h.closes_at,
          is_closed: h.is_closed,
        },
        { onConflict: 'branch_id,staff_id,day_of_week' },
      );
    }
  }
}

function clean(r: Record<string, unknown>): DayHours {
  return {
    day_of_week: r.day_of_week as number,
    opens_at: String(r.opens_at).slice(0, 5),    // "11:00:00" -> "11:00"
    closes_at: String(r.closes_at).slice(0, 5),
    is_closed: r.is_closed as boolean,
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayName = (n: number) => DAYS[n] ?? '';
