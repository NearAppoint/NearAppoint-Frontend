import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { serverEnv } from '@/server/env';
import { ApiError } from '@/server/lib/errors';

/**
 * Rate limiting.
 *
 * The OTP endpoint is the most abusable thing in this product. Every abusive
 * request is an SMS you PAY FOR, and a fraud vector. Left open, "SMS pumping"
 * can burn a real amount of money overnight, and you find out from the invoice.
 *
 * Limits are cheap to enforce and expensive to omit.
 */
let redis: Redis | null = null;

function client(): Redis | null {
  const e = serverEnv();
  if (!e.UPSTASH_REDIS_REST_URL || !e.UPSTASH_REDIS_REST_TOKEN) {
    // Local dev without Redis. Fail OPEN in development, but this must never
    // be the case in production — /api/health flags it.
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: e.UPSTASH_REDIS_REST_URL,
      token: e.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function limiter(name: string, requests: number, window: `${number} ${'s' | 'm' | 'h'}`): Ratelimit | null {
  const r = client();
  if (!r) return null;
  const key = `${name}:${requests}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `na:rl:${name}`,
      analytics: true,
    }));
  }
  return limiters.get(key)!;
}

/**
 * @param identifier phone number, IP, or user id — whatever we're limiting ON
 */
export async function rateLimit(
  name: string,
  identifier: string,
  requests: number,
  window: `${number} ${'s' | 'm' | 'h'}`,
): Promise<void> {
  const l = limiter(name, requests, window);
  if (!l) return;   // dev without Redis

  const { success, reset } = await l.limit(identifier);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new ApiError('RATE_LIMITED', 'Too many attempts. Please wait a moment.', {
      retry_after_seconds: retryAfter,
    });
  }
}

/** Behind Vercel, x-forwarded-for is the client. Never trust it for auth — only for limits. */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
