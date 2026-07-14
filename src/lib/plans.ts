/**
 * Plan display data for the pricing page.
 *
 * NOTE: this is for RENDERING ONLY. The actual gate is EntitlementService,
 * which reads the database. If these two ever disagree, the database is right
 * and this file is a bug.
 *
 * Never write `if (plan === 'business')` in a component. Ask the server.
 */
export interface PlanDisplay {
  code: 'trial' | 'starter' | 'business' | 'enterprise';
  name: string;
  tagline: string;
  priceMonthly: number | null;   // null = "Contact us"
  priceAnnual: number | null;
  trialDays: number;
  highlight?: boolean;
  features: string[];
  notIncluded?: string[];
}

export const PLANS: PlanDisplay[] = [
  {
    code: 'trial',
    name: 'Trial',
    tagline: 'Everything you need to run your salon. Free for 30 days.',
    priceMonthly: 0,
    priceAnnual: 0,
    trialDays: 30,
    features: [
      'Business profile & verification',
      'Appointment calendar',
      'Unlimited bookings',
      'Service management',
      'Staff management (up to 5)',
      'Customer management',
      'Reviews & ratings',
      'Basic dashboard & analytics',
      'WhatsApp confirmations & reminders',
      'Mobile dashboard',
    ],
  },
  {
    code: 'starter',
    name: 'Starter',
    tagline: 'For a salon that is getting busy.',
    priceMonthly: 2999,
    priceAnnual: 29990,
    trialDays: 0,
    features: [
      'Everything in Trial',
      'Advanced calendar (drag to reschedule, seasonal hours)',
      'Staff management (up to 15)',
      'Customer CRM, notes & history',
      'Revenue dashboard',
      'Business reports',
      'WhatsApp marketing campaigns',
      'SMS integration (credits separate)',
      'Coupons & promotional offers',
      'Priority email support',
    ],
  },
  {
    code: 'business',
    name: 'Business',
    tagline: 'For a salon that is running hard.',
    priceMonthly: 5999,
    priceAnnual: 59990,
    trialDays: 0,
    highlight: true,
    features: [
      'Everything in Starter',
      'Unlimited staff',
      'Advanced analytics (peak hours, retention)',
      'Staff roles & permissions',
      'Loyalty program & memberships',
      'Referral program',
      'Marketing campaigns',
      'AI business insights & peak-hour prediction',
      'Premium business profile',
      'Featured listing eligibility',
      'Phone support',
    ],
    notIncluded: ['Multi-branch management'],
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    tagline: 'Multi-branch, franchise, custom.',
    priceMonthly: null,
    priceAnnual: null,
    trialDays: 0,
    features: [
      'Everything in Business',
      'Multi-branch & franchise management',
      'Branch-wise analytics',
      'Dedicated account manager',
      'API access & custom integrations',
      'Custom roles & permissions',
      'Data export',
      'Staff training',
      'Early access to new features',
    ],
  },
];

/** Annual = 10 months. Two free. */
export function annualSavingMonths(): number {
  return 2;
}
