import 'server-only';
import { randomUUID } from 'crypto';

/**
 * Every request gets an ID. It goes in the log AND in the error body, so when
 * a salon owner WhatsApps you "it said something went wrong", you can find the
 * exact request in seconds instead of guessing.
 */
export function requestId(): string {
  return `req_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
