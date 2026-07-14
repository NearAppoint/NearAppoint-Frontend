import 'server-only';
import { NextResponse } from 'next/server';
import { ApiError, isExclusionViolation } from './errors';

/**
 * ONE response shape. Every endpoint. Forever.
 *
 * Frontend, admin and mobile all parse this. Change it and you break three
 * repos at once — so we get it right now and never touch it.
 */
export interface Meta {
  cursor?: string | null;
  has_more?: boolean;
  [k: string]: unknown;
}

export function ok<T>(data: T, meta?: Meta, status = 200) {
  return NextResponse.json({ data, meta: meta ?? null }, { status });
}

export function created<T>(data: T, meta?: Meta) {
  return ok(data, meta, 201);
}

export function fail(e: unknown, requestId?: string) {
  // The exclusion constraint fired. This means the system WORKED — two people
  // raced for one slot and the database refused the second. Never a 500.
  if (isExclusionViolation(e)) {
    return NextResponse.json({
      error: {
        code: 'SLOT_TAKEN',
        title: 'That slot is no longer available',
        detail: 'Someone booked it while you were choosing.',
        // The caller SHOULD catch this before it reaches here and attach
        // fresh alternatives. If it lands here bare, that's a bug worth fixing.
        meta: { alternatives: [] },
        request_id: requestId,
      },
    }, { status: 409 });
  }

  if (e instanceof ApiError) {
    return NextResponse.json({
      error: {
        code: e.code,
        title: e.message,
        meta: e.meta ?? null,
        request_id: requestId,
      },
    }, { status: e.status });
  }

  // Never leak an internal error message to a client. Log it, return an ID.
  console.error('[unhandled]', { requestId, error: e });
  return NextResponse.json({
    error: {
      code: 'INTERNAL',
      title: 'Something went wrong on our side.',
      request_id: requestId,
    },
  }, { status: 500 });
}
