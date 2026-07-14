import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * REPORTS.
 *
 * Four questions she actually asks:
 *
 *   1. Am I making more or less than last week?
 *   2. WHEN am I busy?          -> so she can staff the right hours
 *   3. Who on my team is earning?
 *   4. Are people coming back?  -> the only number that predicts survival
 *
 * Everything is COMPUTED from appointments. Nothing is stored in a "stats"
 * table — a stats table that drifts from reality is worse than no stats, and
 * it will drift the first time someone reopens a completed appointment.
 */
export interface Summary {
  revenue: number;
  revenue_prev: number;
  revenue_change: number | null;
  appointments: number;
  completed: number;
  no_shows: number;
  no_show_rate: number;
  repeat_rate: number;
}

export interface DayRevenue { date: string; day: string; revenue: number; count: number }
export interface PeakCell   { dow: number; hour: number; count: number }
export interface StaffRow   { staff_id: string; name: string; appointments: number; services: number; revenue: number }
export interface ServiceRow { name: string; count: number; revenue: number }

export interface Report {
  summary: Summary;
  by_day: DayRevenue[];
  peak: PeakCell[];
  staff: StaffRow[];
  services: ServiceRow[];
}

export class ReportService {
  static async build(branchId: string, from: string, to: string): Promise<Report> {
    const sb = db();

    const [summary, byDay, peak, staff, services] = await Promise.all([
      sb.rpc('report_summary',        { p_branch_id: branchId, p_from: from, p_to: to }),
      sb.rpc('report_revenue_by_day', { p_branch_id: branchId, p_from: from, p_to: to }),
      sb.rpc('report_peak_hours',     { p_branch_id: branchId, p_from: from, p_to: to }),
      sb.rpc('report_by_staff',       { p_branch_id: branchId, p_from: from, p_to: to }),
      sb.rpc('report_top_services',   { p_branch_id: branchId, p_from: from, p_to: to }),
    ]);

    if (summary.error) {
      console.error('[reports]', summary.error);
      throw new ApiError('INTERNAL', 'Could not build the report.');
    }

    return {
      summary: summary.data as Summary,
      by_day:  (byDay.data   ?? []) as DayRevenue[],
      peak:    (peak.data    ?? []) as PeakCell[],
      staff:   (staff.data   ?? []) as StaffRow[],
      services:(services.data ?? []) as ServiceRow[],
    };
  }
}
