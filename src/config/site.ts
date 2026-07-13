/**
 * Marketing content + claims. ONE place.
 *
 * ⚠️  THE NUMBERS BELOW ARE FROM THE DESIGN MOCK. THEY ARE NOT TRUE.
 *
 * You have 0 businesses, 0 customers, 0 appointments, 0 cities.
 *
 * Publishing invented stats is bad. Publishing invented customer testimonials
 * with real-sounding names ("Zara Khan, Owner, Pearl Beauty Parlor") is false
 * advertising — and in a market that runs on word of mouth, one salon owner
 * asking to speak to Zara ends you.
 *
 * Set showStats / showTestimonials to false, or put real numbers here.
 * Honest early-stage copy converts better anyway:
 *   "Launching in Lahore. Free for our first 20 salons."
 */
export const SITE = {
  name: 'NearAppoint',
  tagline: 'Find. Book. Arrive.',
  url: 'https://www.nearappoint.com',

  showStats: true,
  showTestimonials: true,

  stats: {
    businesses:   '2,400+',
    customers:    '85,000+',
    appointments: '320,000+',
    cities:       '18',
    rating:       '4.9',
  },

  nav: [
    { href: '#business',   label: 'Businesses' },
    { href: '#categories', label: 'Categories' },
    { href: '#features',   label: 'Features' },
    { href: '#faq',        label: 'Pricing' },
    { href: '#benefits',   label: 'About' },
  ],

  cities: ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Rawalpindi'],
} as const;
