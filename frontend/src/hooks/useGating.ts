import { useSubscription } from "./useSubscription";
import type { SubscriptionFeatures, SubscriptionLimits } from "./useSubscription";

export interface GatingResult {
  /** Whether the subscription data is loaded */
  ready: boolean;
  /** Returns true if the feature is enabled on the current plan */
  canUse: (feature: keyof SubscriptionFeatures) => boolean;
  /** Returns true if the usage has hit (or exceeded) the plan limit */
  isLimitReached: (key: keyof SubscriptionLimits) => boolean;
  /** Remaining count before limit (Infinity if unlimited) */
  remaining: (key: keyof SubscriptionLimits) => number;
  /** Usage percentage 0-100 (0 if unlimited) */
  usagePct: (key: keyof SubscriptionLimits) => number;
  /** Current plan name */
  plan: string | undefined;
}

export function useGating(): GatingResult {
  const { data: sub, isSuccess } = useSubscription();

  const canUse = (feature: keyof SubscriptionFeatures): boolean => {
    if (!sub) return false;
    return sub.features[feature] === true;
  };

  const isLimitReached = (key: keyof SubscriptionLimits): boolean => {
    if (!sub) return false;
    const limit = sub.limits[key];
    if (limit === null) return false; // unlimited
    const usage = sub.usage[key as keyof typeof sub.usage] as number;
    return usage >= limit;
  };

  const remaining = (key: keyof SubscriptionLimits): number => {
    if (!sub) return 0;
    const limit = sub.limits[key];
    if (limit === null) return Infinity;
    const usage = sub.usage[key as keyof typeof sub.usage] as number;
    return Math.max(0, limit - usage);
  };

  const usagePct = (key: keyof SubscriptionLimits): number => {
    if (!sub) return 0;
    const limit = sub.limits[key];
    if (!limit) return 0;
    const usage = sub.usage[key as keyof typeof sub.usage] as number;
    return Math.min(100, Math.round((usage / limit) * 100));
  };

  return {
    ready: isSuccess,
    canUse,
    isLimitReached,
    remaining,
    usagePct,
    plan: sub?.plan,
  };
}
