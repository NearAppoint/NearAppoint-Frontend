/**
 * Money.
 *
 * MUDDARRIS LESSON, ENCODED:
 *   'PKR' vs 'pkr' compared as raw strings across modules is how money
 *   silently disappears.
 *
 * There is exactly ONE valid representation and it is uppercase. This is
 * enforced in THREE places:
 *   1. Here, at the type level.
 *   2. In Postgres: `create domain currency_code check (value = upper(value))`
 *      — the database physically refuses 'pkr'.
 *   3. By architecture: no other repo has a database connection, so no other
 *      repo can insert a currency at all.
 */
export type Currency = 'PKR' | 'USD';

const VALID: readonly Currency[] = ['PKR', 'USD'] as const;

export function normalizeCurrency(raw: string): Currency {
  const up = raw.trim().toUpperCase() as Currency;
  if (!VALID.includes(up)) throw new Error(`Unsupported currency: "${raw}"`);
  return up;
}

/** Whole rupees. PKR has no practical subunit in this market. */
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * NOTE: bookingFeePKR() is NOT here. It reads a server env var and lives in
 * src/server/lib/money.ts.
 *
 * The client sends { service_ids, start_at }. It does not send a price, and it
 * does not send a fee. There is no field for either. If one ever appears in a
 * request body, reject it — someone is probing.
 */
