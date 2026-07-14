import 'server-only';
/**
 * Error contract. RFC 7807 Problem Details.
 *
 * THE RULE: every error in a booking flow carries the NEXT ACTION.
 *
 * A 409 that says "slot taken" and stops is a dead end and a lost booking.
 * A 409 that arrives WITH three alternative times already loaded is a recovery.
 * That is a product requirement, not an API nicety.
 */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SLOT_TAKEN'                    // exclusion constraint fired. Always with alternatives.
  | 'SLOT_UNAVAILABLE'              // outside hours / on a break / on leave
  | 'HOLD_EXPIRED'
  | 'BOOKING_SUSPENDED'             // customer reliability (BR-74)
  | 'TOO_MANY_RESCHEDULES'
  | 'OUTSIDE_CANCELLATION_WINDOW'
  | 'BUSINESS_NOT_VERIFIED'
  | 'SUBSCRIPTION_INACTIVE'
  | 'RATE_LIMITED'
  | 'PAYMENT_FAILED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SLOT_TAKEN: 409,
  SLOT_UNAVAILABLE: 409,
  HOLD_EXPIRED: 410,
  BOOKING_SUSPENDED: 403,
  TOO_MANY_RESCHEDULES: 422,
  OUTSIDE_CANCELLATION_WINDOW: 422,
  BUSINESS_NOT_VERIFIED: 403,
  SUBSCRIPTION_INACTIVE: 402,
  RATE_LIMITED: 429,
  PAYMENT_FAILED: 402,
  IDEMPOTENCY_CONFLICT: 409,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}

/** Postgres exclusion_violation. The double-booking constraint firing. */
export const PG_EXCLUSION_VIOLATION = '23P01';
/** Postgres unique_violation. Usually a duplicate — often not an error to the user. */
export const PG_UNIQUE_VIOLATION = '23505';

export function isExclusionViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === PG_EXCLUSION_VIOLATION;
}
