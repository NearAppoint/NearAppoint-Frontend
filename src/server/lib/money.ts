import 'server-only';
import { serverEnv } from '@/server/env';

/**
 * The booking fee. SERVER ONLY.
 *
 * `import 'server-only'` means a client component importing this is a build
 * error. The fee is resolved on the server, from the server's environment,
 * and the client is simply told the total.
 *
 * Your non-negotiable #1, made structural.
 */
export function bookingFeePKR(): number {
  return serverEnv().BOOKING_FEE_PKR;
}
