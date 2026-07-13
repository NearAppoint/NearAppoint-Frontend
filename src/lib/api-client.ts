import { env } from '@/config/env';
import { auth } from '@/lib/auth';

/**
 * THE ONLY WAY THIS REPO REACHES DATA.
 *
 * Every request goes to api.nearappoint.com with the user's bearer token.
 * The backend decides what they may see. This repo has no opinion and no keys.
 *
 * NOTE WHAT IS ABSENT FROM `BookingRequest` BELOW:
 *
 *     there is no `price` field.
 *
 * A frontend developer cannot send a price because there is nowhere to put
 * one. Your Muddarris pricing-manipulation bug isn't "prevented by review" —
 * it's unrepresentable in the type system.
 */
export interface ApiError {
  code: string;
  title: string;
  detail?: string;
  meta?: Record<string, unknown> | null;
  request_id?: string;
}

export class ApiException extends Error {
  constructor(readonly status: number, readonly error: ApiError) {
    super(error.title);
  }

  /**
   * A 409 SLOT_TAKEN arrives WITH alternatives already loaded. A dead-end
   * error is a lost booking; an error that offers "6:15 or 6:30?" is a
   * recovery. Always render these.
   */
  get alternatives(): Array<{ start_at: string; staff_id: string; staff_name: string }> {
    return (this.error.meta?.alternatives as never) ?? [];
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Required on anything that creates an appointment or moves money. */
  idempotencyKey?: string;
  /** Skip the bearer token (public endpoints: search, business profiles). */
  anonymous?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, idempotencyKey, anonymous, headers, ...rest } = opts;

  const h = new Headers(headers);
  h.set('Content-Type', 'application/json');
  if (idempotencyKey) h.set('Idempotency-Key', idempotencyKey);

  if (!anonymous) {
    const token = await auth.accessToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...rest,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiException(res.status, json?.error ?? {
      code: 'INTERNAL',
      title: 'Something went wrong.',
    });
  }

  return json.data as T;
}

export const api = {
  get:   <T>(p: string, o?: RequestOptions) => request<T>(p, { ...o, method: 'GET' }),
  post:  <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>(p, { ...o, method: 'POST', body }),
  patch: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>(p, { ...o, method: 'PATCH', body }),
  del:   <T>(p: string, o?: RequestOptions) => request<T>(p, { ...o, method: 'DELETE' }),
};
