import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * BOOKING POLICY — the medical safety gate.
 *
 * Aesthetic Clinics span "a facial" to "an injectable that requires a
 * prescription and a licensed doctor." A single bookable list would let a
 * customer book Botox from a salon on a Tuesday, and the first complication is
 * a lawsuit — against a business WE listed and WE verified.
 *
 *   bookable           book it now, like a haircut
 *   consultation_only  book a CONSULT. The procedure is arranged offline, by
 *                      qualified people, with informed consent we are not
 *                      equipped to capture.
 *   disabled           we do not offer this. Ever. Botox, fillers, PRP.
 *
 * This is checked on the SERVER at booking time. It is also enforced by the
 * database (0007). Both, deliberately: this is a class of failure where being
 * doubly sure is cheap and being wrong is not.
 */
export type BookingPolicy = 'bookable' | 'consultation_only' | 'disabled';

export class BookingPolicyService {
  /**
   * Call this BEFORE creating any appointment. Throws if any requested service
   * is not bookable.
   */
  static async assertBookable(serviceIds: string[]): Promise<void> {
    const { data, error } = await db()
      .from('services')
      .select('id, name, booking_policy, subcategories(policy_reason)')
      .in('id', serviceIds);

    if (error) throw new ApiError('INTERNAL', 'Could not verify service availability.');

    for (const s of (data ?? []) as any[]) {
      if (s.booking_policy === 'disabled') {
        throw new ApiError('FORBIDDEN',
          `${s.name} cannot be booked through NearAppoint.`, {
          reason: s.subcategories?.policy_reason ??
            'This is a regulated medical procedure. Please contact the clinic directly.',
          service_id: s.id,
        });
      }

      if (s.booking_policy === 'consultation_only') {
        throw new ApiError('VALIDATION_FAILED',
          `${s.name} requires a consultation first.`, {
          reason: s.subcategories?.policy_reason ??
            'A qualified practitioner needs to assess you before this treatment.',
          service_id: s.id,
          // Give them the next action. An error that dead-ends is a lost booking;
          // an error that offers "book the consult instead" is a conversion.
          action: 'book_consultation',
        });
      }
    }
  }

  /**
   * A clinic in a medical category cannot be LISTED without PMC verification.
   *
   * The database enforces this too (trigger t_assert_medical_verified). This
   * function exists so ops gets a readable error instead of a Postgres one.
   */
  static async assertMedicallyVerified(businessId: string): Promise<void> {
    const { data } = await db()
      .from('businesses')
      .select('display_name, medical_verified_at, service_categories!inner(requires_medical_license)')
      .eq('id', businessId)
      .maybeSingle();

    const needsLicense = (data as any)?.service_categories?.requires_medical_license;
    if (needsLicense && !(data as any)?.medical_verified_at) {
      throw new ApiError('BUSINESS_NOT_VERIFIED',
        'This clinic cannot be listed until its PMC registration has been verified.', {
        required_documents: ['pmc_certificate', 'practitioner_cnic', 'clinic_license'],
      });
    }
  }
}
