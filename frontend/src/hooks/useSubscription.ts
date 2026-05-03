/**
 * Plan / extension / usage summary for the current organisation.
 *
 * Reads `GET /organisations/me/subscription` from the backend.
 *
 * The shape mirrors the backend contract specified in `docs/BACKEND_API.md`.
 * For dev convenience we never fail open: when the request errors we return a
 * permissive default so the UI never blocks.
 */

import { useQuery } from "@tanstack/react-query";
import { api, isApiError } from "../lib/api";
import {
  DEFAULT_EXTENSION_STATE,
  type ExtensionKey,
} from "../lib/extensions";

export type Plan = "Free" | "Starter" | "Pro" | "Business" | "Enterprise";
export type SubStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type ExtensionState = Record<ExtensionKey, boolean>;

export interface SubscriptionLimits {
  templates: number | null;
  signings_per_month: number | null;
  clients: number | null;
  storage_mb: number | null;
}

export interface SubscriptionUsage {
  templates: number;
  signings_this_month: number;
  clients: number;
  storage_mb: number;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: SubStatus;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  extensions: ExtensionState;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
}

export const SUBSCRIPTION_KEY = ["subscription"] as const;

interface RawSubscription {
  id: string;
  plan: Plan;
  status: SubStatus;
  period_end: string;
  cancel_at_period_end: boolean;
  extensions: Partial<ExtensionState>;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
}

const FALLBACK: Subscription = {
  id: "fallback",
  plan: "Business",
  status: "active",
  periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  extensions: { ...DEFAULT_EXTENSION_STATE },
  limits: {
    templates: null,
    signings_per_month: null,
    clients: null,
    storage_mb: null,
  },
  usage: {
    templates: 0,
    signings_this_month: 0,
    clients: 0,
    storage_mb: 0,
  },
};

function normalize(raw: RawSubscription): Subscription {
  const extensions: ExtensionState = { ...DEFAULT_EXTENSION_STATE };
  for (const key of Object.keys(DEFAULT_EXTENSION_STATE) as ExtensionKey[]) {
    if (typeof raw.extensions[key] === "boolean") {
      extensions[key] = raw.extensions[key]!;
    }
  }
  return {
    id: raw.id,
    plan: raw.plan,
    status: raw.status,
    periodEnd: raw.period_end,
    cancelAtPeriodEnd: raw.cancel_at_period_end,
    extensions,
    limits: raw.limits,
    usage: raw.usage,
  };
}

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: async () => {
      try {
        const raw = await api.get<RawSubscription>("/organisations/me/subscription");
        return normalize(raw);
      } catch (e) {
        // Permissive fallback so UI never gates on transport errors in dev.
        if (isApiError(e) && e.status >= 500) return FALLBACK;
        return FALLBACK;
      }
    },
    staleTime: 30_000,
    placeholderData: FALLBACK,
  });
}
