/**
 * Plan / feature / usage summary for the current account.
 *
 * NOTE: the Go backend does not expose a "subscription summary" endpoint
 * today — it only has id-based CRUD for subscription plans and subscriptions.
 * Until the backend adds one, we fall back to a permissive default so the
 * UI renders without gating the user out of anything.
 */

export type Plan = "Free" | "Starter" | "Pro" | "Business" | "Enterprise";
export type SubStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface SubscriptionFeatures {
  clients: boolean;
  dossier: boolean;
  reports: boolean;
  csv_export: boolean;
  legislation: boolean;
  tasks: boolean;
  notes: boolean;
  invoices: boolean;
}

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
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
}

export const SUBSCRIPTION_KEY = ["subscription"] as const;

const PLACEHOLDER: Subscription = {
  id: "local",
  plan: "Business",
  status: "active",
  periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  features: {
    clients: true,
    dossier: true,
    reports: true,
    csv_export: true,
    legislation: true,
    tasks: true,
    notes: true,
    invoices: true,
  },
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

/**
 * Returns the current-plan summary. Until the backend exposes one, this
 * resolves synchronously to a permissive placeholder so gating never
 * blocks the UI.
 */
export function useSubscription() {
  return {
    data: PLACEHOLDER,
    isSuccess: true,
    isLoading: false,
    isError: false,
    error: null,
  };
}
