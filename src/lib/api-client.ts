import { auth } from '@/lib/auth';
import type { ApiError } from '@/types/api';

/**
 * The client-side API client.
 *
 * AFTER THE MERGE, this calls /api/v1/* on the SAME origin. There is no
 * cross-domain hop, no CORS, no second Vercel project, no second env var list.
 *
 * WHAT DID NOT CHANGE — and this is the important part:
 *
 *   The browser still cannot touch the database. Every request still goes
 *   through a route handler in src/app/api/, which is the only code allowed to
 *   import from src/server/. The isolation is identical.
 *
 *   It is now enforced by the COMPILER (`import 'server-only'`) rather than by
 *   two repos and a promise not to copy-paste a key.
 */
export class ApiException extends Error {
  constructor(readonly status: number, readonly error: ApiError) {
    super(error.title);
  }

  /**
   * A 409 SLOT_TAKEN arrives WITH alternatives already loaded.
   * A dead-end error is a lost booking. An error that offers "6:15 or 6:30?"
   * is a recovery. Always render these.
   */
  get alternatives(): Array<{ start_at: string; staff_id: string; staff_name: string }> {
    return (this.error.meta?.alternatives as never) ?? [];
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Required on anything that creates an appointment or moves money. */
  idempotencyKey?: string;
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

  // Same-origin. No API_URL, no CORS, no preflight.
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
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
