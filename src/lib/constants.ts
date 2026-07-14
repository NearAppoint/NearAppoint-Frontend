/**
 * Business rules. Every one is enforced SERVER-SIDE, here.
 * The frontend may mirror these for UX, but its copy is decorative.
 */
export const BOOKING = {
  MAX_SERVICES_PER_BOOKING: 3,   // above this we tell the customer to call. Honest limit.
  HOLD_MINUTES: 10,              // pending_payment window while they enter a JazzCash PIN
  MAX_RESCHEDULES: 2,
  MIN_LEAD_TIME_MINUTES: 60,     // online only. The counter can book anything.
  MAX_ADVANCE_DAYS: 60,
  FREE_CANCEL_HOURS: 4,          // full booking-fee refund before this
  RESCHEDULE_CUTOFF_HOURS: 2,
  GRACE_MINUTES: 15,
  NO_SHOW_THRESHOLD_MINUTES: 30,
  DEFAULT_SLOT_GRANULARITY: 15,
} as const;

/**
 * NO-SHOW DEFENCE.
 *
 * There is NO booking fee. Booking on NearAppoint is free, always.
 *
 * That means this reliability system is the ONLY thing standing between a
 * salon and an empty chair at 6pm on a Saturday. It has to actually work.
 *
 * Three layers, in order of how often they fire:
 *
 *   1. WhatsApp at T-2h: "Still coming? [Yes] [Reschedule] [Cancel]"
 *      The single highest-ROI message in the product. A customer who cancels
 *      at T-2h frees a slot we can still refill. One who ghosts costs everyone.
 *
 *   2. Reliability score. Repeat no-shows lose the ability to RESERVE.
 *      They can still walk in — we are not banning them from the salon, we
 *      are declining to hold a chair for someone who has stopped showing up.
 *
 *   3. The business sees the risk before it accepts:
 *      "This customer has 2 no-shows in the last 90 days."
 *
 * WATCH THIS NUMBER. If the no-show rate on platform bookings goes above ~15%,
 * salons will stop trusting the calendar and go back to WhatsApp — and losing
 * supply is how this business dies. At that point, revisit a commitment
 * mechanism.
 */
export const RELIABILITY = {
  // Customer (BR-70..76)
  CUSTOMER_START: 100,
  NO_SHOW_PENALTY: -10,
  LATE_CANCEL_PENALTY: -3,
  COMPLETION_REWARD: +2,          // recovery is possible. People have bad months.

  // 3 no-shows in 90 days -> the business is WARNED at booking time.
  NO_SHOWS_BEFORE_WARNING: 3,
  // 5 -> cannot RESERVE for 30 days. Can still walk in.
  NO_SHOWS_BEFORE_SUSPENSION: 5,
  SUSPENSION_DAYS: 30,

  // Business (BR-60..67) — the mechanism that makes "real availability" a
  // system rather than a slogan.
  BUSINESS_START: 100,
  BIZ_LATE_CANCEL_PENALTY: -5,
  BIZ_NO_SHOW_PENALTY: -15,       // they didn't honour a booking we promised
  BIZ_WEEKLY_RECOVERY: +1,
  BIZ_RANKING_PENALTY_BELOW: 70,
  BIZ_DELIST_BELOW: 50,
} as const;

/** Bounds a business may configure within. Outside these, the API rejects. */
export const CONFIG_BOUNDS = {
  min_lead_time_minutes:     [0, 1440],
  max_advance_days:          [7, 180],
  cancellation_window_hours: [0, 48],
  reschedule_window_hours:   [0, 24],
  grace_period_minutes:      [0, 30],
  no_show_threshold_minutes: [10, 120],
} as const;

export const RATE_LIMITS = {
  // The single most abusable endpoint in the product. Every abuse is an SMS
  // you pay for, and a fraud vector.
  OTP_PER_PHONE_PER_HOUR: 3,
  OTP_PER_IP_PER_HOUR: 10,
  OTP_VERIFY_ATTEMPTS: 5,        // then the code is BURNED, not just rejected

  BOOKING_PER_CUSTOMER_PER_HOUR: 10,   // a human does not book 10 appointments an hour
  SEARCH_PER_IP_PER_MIN: 120,
  AVAILABILITY_PER_IP_PER_MIN: 60,
  BUSINESS_WRITES_PER_MIN: 300,        // the front desk is fast. Be generous.
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
