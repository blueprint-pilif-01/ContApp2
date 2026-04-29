/**
 * Compatibility wrapper over {@link useExtensions} + {@link useSubscription}.
 *
 * Older code asked for plan-level capabilities (`canUse("clients")`) and
 * usage-limit checks (`isLimitReached("templates")`). Those are now expressed
 * as extension keys plus per-extension limits, so this hook keeps the old
 * surface area but delegates to the new model under the hood.
 */

import { useExtensions } from "./useExtensions";
import { useSubscription, type SubscriptionLimits } from "./useSubscription";
import { EXTENSION_KEYS, type ExtensionKey } from "../lib/extensions";

/**
 * Legacy capability keys the UI used to check. They are mapped to the
 * extension model below, so existing call sites keep compiling.
 */
export type LegacyFeature =
  | "clients"
  | "dossier"
  | "reports"
  | "csv_export"
  | "legislation"
  | "tasks"
  | "tickets"
  | "notes"
  | "invoices"
  | "chat"
  | "hr"
  | "ai";

const LEGACY_TO_EXTENSION: Record<LegacyFeature, ExtensionKey | "base"> = {
  clients: "contracts_pro",
  dossier: "contracts_pro",
  reports: "contracts_pro",
  csv_export: "contracts_pro",
  legislation: "legislation_monitor",
  tasks: "ticketing_pro",
  tickets: "ticketing_pro",
  chat: "internal_chat",
  hr: "hr_pro",
  ai: "ai_assistant",
  invoices: "contracts_pro",
  notes: "base",
};

export interface GatingResult {
  ready: boolean;
  /** Returns true iff the legacy or extension key is currently active. */
  canUse: (feature: LegacyFeature | ExtensionKey) => boolean;
  /** Returns true if usage has hit (or exceeded) the plan limit. */
  isLimitReached: (key: keyof SubscriptionLimits) => boolean;
  /** Remaining count before limit (Infinity if unlimited). */
  remaining: (key: keyof SubscriptionLimits) => number;
  /** Usage percentage 0-100 (0 if unlimited). */
  usagePct: (key: keyof SubscriptionLimits) => number;
  /** Current plan name. */
  plan: string | undefined;
}

function isExtensionKey(value: string): value is ExtensionKey {
  return (EXTENSION_KEYS as readonly string[]).includes(value);
}

export function useGating(): GatingResult {
  const ext = useExtensions();
  const { data: sub, isSuccess } = useSubscription();

  const canUse = (feature: LegacyFeature | ExtensionKey): boolean => {
    if (!ext.isReady) return false;
    if (isExtensionKey(feature)) return ext.canUse(feature);
    const mapped = LEGACY_TO_EXTENSION[feature as LegacyFeature];
    if (!mapped) return false;
    if (mapped === "base") return true;
    return ext.canUse(mapped);
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
    ready: ext.isReady && isSuccess,
    canUse,
    isLimitReached,
    remaining,
    usagePct,
    plan: sub?.plan,
  };
}
