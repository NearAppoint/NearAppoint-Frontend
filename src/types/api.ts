/**
 * The API contract. Shared between the browser and the route handlers.
 *
 * This file is NOT server-only — both sides import it. It contains types only,
 * never logic, never secrets.
 */
export interface ApiError {
  code: string;
  title: string;
  detail?: string;
  meta?: Record<string, unknown> | null;
  request_id?: string;
}

/**
 * API contract. Mirrors what the backend returns.
 *
 * NOT generated from the database — deliberately. This repo should only know
 * about what the API exposes, not about the shape of our tables. If a column
 * gets renamed, the API absorbs it and the frontend never notices.
 */
export type AppointmentStatus =
  | 'pending_payment' | 'confirmed' | 'rescheduled' | 'checked_in' | 'late'
  | 'in_progress' | 'completed' | 'no_show'
  | 'cancelled_by_customer' | 'cancelled_by_business' | 'expired';

/** Money is ALWAYS a formatted string from the API. The frontend never does arithmetic on it. */
export interface Money {
  amount: number;
  currency: 'PKR';
  formatted: string;   // "Rs 1,500" — rendered by the backend. Never build this here.
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  business_name: string;
  address_line: string;
  landmark: string | null;   // Show this MORE prominently than the address.
  city: string;
  area: string | null;
  distance_km: number | null;
  rating_avg: number | null;
  rating_count: number;
  is_new: boolean;           // no reviews yet -> "New" badge, never "0 stars"
  gender_policy: 'women_only' | 'men_only' | 'unisex';
  cover_url: string | null;
  next_available_at: string | null;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;   // NEVER includes buffer. Buffer is invisible to customers.
  price: Money;
  price_is_from: boolean;
}

export interface StaffMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating_avg: number | null;
}

export interface Slot {
  start_at: string;           // ISO 8601 with offset. Always.
  staff_id: string;
  staff_name: string;
}

/**
 * THE BOOKING REQUEST.
 *
 * Look at what is not here. There is no `price`. There is no `total`. There is
 * no `currency`. The client sends IDs and a time. The backend resolves the
 * money from the database.
 *
 * Do not add a price field to this interface. Ever.
 */
export interface BookingRequest {
  branch_id: string;
  service_ids: string[];      // max 3 (BOOKING.MAX_SERVICES_PER_BOOKING)
  staff_id: string | null;    // null = "Any available" (more slots, better for everyone)
  start_at: string;
  customer_notes?: string;
}

export interface Appointment {
  id: string;
  reference: string;          // "NA-8F3K2" — what support asks for on WhatsApp
  status: AppointmentStatus;
  branch: Branch;
  services: Service[];
  staff: StaffMember | null;
  start_at: string;
  end_at: string;
  total: Money;
  booking_fee: Money | null;
  can_reschedule: boolean;    // backend decides. Never compute this client-side.
  can_cancel: boolean;
  cancel_refunds_fee: boolean;
}
