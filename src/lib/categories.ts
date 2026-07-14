/**
 * The six MVP categories. Display only — the taxonomy lives in the database.
 *
 * NOTE ON AESTHETIC CLINICS:
 * Some of their subcategories are consultation-only, and three (Botox, dermal
 * fillers, PRP) are not offered at all. That policy lives on the subcategory
 * row in Postgres and is enforced server-side at booking time. It is NOT a UI
 * decision, and it must never become one.
 */
export interface CategoryDisplay {
  slug: string;
  name: string;
  icon: string;
  description: string;
  bookingType: 'slot' | 'event';
  medical?: boolean;
}

export const CATEGORIES: CategoryDisplay[] = [
  { slug: 'hair_salon',       name: 'Hair Salons',       icon: 'scissors', bookingType: 'slot',
    description: 'Cuts, colour, styling, beard & grooming' },
  { slug: 'beauty_parlor',    name: 'Beauty Parlors',    icon: 'sparkles', bookingType: 'slot',
    description: 'Makeup, facials, threading, waxing & bridal' },
  { slug: 'nail_studio',      name: 'Nail Studios',      icon: 'hand',     bookingType: 'slot',
    description: 'Manicure, pedicure, gel, acrylic & nail art' },
  // Event booking: a bridal mehndi is a 4-hour commitment on a specific date,
  // usually with a deposit. Not a 15-minute slot.
  { slug: 'mehndi_studio',    name: 'Mehndi Studios',    icon: 'flower',   bookingType: 'event',
    description: 'Bridal, party & occasion mehndi' },
  { slug: 'wellness',         name: 'Wellness Centers',  icon: 'leaf',     bookingType: 'slot',
    description: 'Spa, massage, therapy & relaxation' },
  { slug: 'aesthetic_clinic', name: 'Aesthetic Clinics', icon: 'sparkle',  bookingType: 'slot',
    description: 'Skin treatments & aesthetic consultations', medical: true },
];
