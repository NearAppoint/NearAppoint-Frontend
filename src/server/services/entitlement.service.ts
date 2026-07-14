import 'server-only';
import { db } from '@/server/database/client';
import { ApiError } from '@/server/lib/errors';

/**
 * ENTITLEMENTS — the single gate for "can this business use this feature?"
 *
 * There is exactly ONE way to ask this question, and it is here. If you find
 * yourself writing `if (plan === 'business')` anywhere in the codebase, stop.
 * That is how a Starter customer ends up with Business features for four
 * months and nobody notices until an accountant does.
 *
 * Feature keys are strings, checked against `plan_entitlements` in the DB.
 * Moving a feature between tiers is an UPDATE. Nothing ships.
 */
export type FeatureKey =
  // core — every plan, including trial
  | 'profile.basic' | 'profile.verification' | 'services.manage'
  | 'calendar.basic' | 'bookings.unlimited' | 'customers.basic'
  | 'staff.basic' | 'reviews.basic' | 'dashboard.basic' | 'analytics.basic'
  | 'notifications.email' | 'notifications.whatsapp_transactional'
  | 'mobile.dashboard' | 'support.standard'
  // starter+
  | 'calendar.advanced' | 'customers.crm' | 'customers.notes'
  | 'appointments.history' | 'analytics.revenue' | 'reports.business'
  | 'notifications.whatsapp_marketing' | 'notifications.sms'
  | 'marketing.coupons' | 'marketing.offers' | 'support.priority_email'
  // business+
  | 'analytics.advanced' | 'staff.roles' | 'marketing.loyalty'
  | 'marketing.memberships' | 'marketing.referral' | 'marketing.campaigns'
  | 'ai.insights' | 'ai.peak_prediction' | 'ai.revenue_reports'
  | 'profile.premium' | 'listing.featured_eligible' | 'support.phone'
  // enterprise
  | 'branches.multi' | 'branches.franchise' | 'analytics.branch'
  | 'support.dedicated' | 'api.access' | 'integrations.custom'
  | 'reports.advanced' | 'roles.custom' | 'data.export'
  | 'support.priority' | 'training.staff' | 'features.early_access'
  // add-ons
  | 'addon.featured_listing' | 'addon.sponsored' | 'addon.whatsapp_bulk'
  | 'addon.sms_credits' | 'addon.ai_marketing' | 'addon.analytics_pack'
  | 'addon.gift_cards' | 'addon.premium_verification';

export class EntitlementService {
  /** Does this business have this feature — via its plan OR an add-on? */
  static async has(businessId: string, feature: FeatureKey): Promise<boolean> {
    const { data, error } = await db().rpc('has_feature', {
      p_business_id: businessId,
      p_feature_key: feature,
    });
    if (error) {
      // Fail CLOSED. A broken entitlement check must never hand out a paid
      // feature for free — it must deny and page someone.
      console.error('[entitlement] check failed, denying', { businessId, feature, error });
      return false;
    }
    return data === true;
  }

  /** null = unlimited. A number = capped. */
  static async limit(businessId: string, feature: FeatureKey): Promise<number | null> {
    const { data } = await db().rpc('feature_limit', {
      p_business_id: businessId,
      p_feature_key: feature,
    });
    return (data as number | null) ?? null;
  }

  /** Throws a 402 with an upgrade path. Use at the top of gated routes. */
  static async require(businessId: string, feature: FeatureKey): Promise<void> {
    if (await EntitlementService.has(businessId, feature)) return;

    const plan = await EntitlementService.requiredPlanFor(feature);
    throw new ApiError('SUBSCRIPTION_INACTIVE', 'This feature is not on your plan.', {
      feature,
      required_plan: plan,
      upgrade_url: '/settings/billing',
    });
  }

  /**
   * Enforces a countable limit (e.g. staff on Trial is capped at 5).
   *
   * NOTE: the message is honest and non-punitive. A salon owner who hits a cap
   * should feel informed, not scolded. She is a customer, not a violator.
   */
  static async requireWithinLimit(
    businessId: string,
    feature: FeatureKey,
    currentCount: number,
  ): Promise<void> {
    await EntitlementService.require(businessId, feature);
    const cap = await EntitlementService.limit(businessId, feature);
    if (cap !== null && currentCount >= cap) {
      throw new ApiError('SUBSCRIPTION_INACTIVE',
        `Your plan includes up to ${cap}. Upgrade to add more.`, {
        feature, limit: cap, current: currentCount, upgrade_url: '/settings/billing',
      });
    }
  }

  /** Everything this business can do. One call, for the whole session. */
  static async all(businessId: string): Promise<Set<FeatureKey>> {
    const { data } = await db()
      .from('subscriptions')
      .select('plan_entitlements:plan_id(feature_key)')
      .eq('business_id', businessId)
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    const fromPlan = ((data as any)?.plan_entitlements ?? []).map((e: any) => e.feature_key);

    const { data: addons } = await db()
      .from('business_addons')
      .select('feature_key')
      .eq('business_id', businessId)
      .eq('status', 'active');

    return new Set([
      ...fromPlan,
      ...(addons ?? []).map((a: any) => a.feature_key),
    ] as FeatureKey[]);
  }

  private static async requiredPlanFor(feature: FeatureKey): Promise<string | null> {
    const { data } = await db()
      .from('plan_entitlements')
      .select('plans!inner(code, display_order)')
      .eq('feature_key', feature)
      .order('display_order', { referencedTable: 'plans', ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as any)?.plans?.code ?? null;
  }
}
