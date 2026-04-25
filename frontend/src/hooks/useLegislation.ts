/**
 * Legislation feed — not yet exposed by the backend. These hooks return
 * empty data so the Legislation page can render a "coming soon" state.
 */

export interface LegislationUpdate {
  id: string;
  title: string;
  summary: string;
  category_code: string;
  category_name: string;
  source_name: string;
  source_url: string;
  published_at: string;
}

export interface LegislationResponse {
  updates: LegislationUpdate[];
  pageInfo: { page: number; limit: number; total: number; totalPages: number };
}

export interface LegislationCategory {
  code: string;
  name: string;
}

export interface LegislationPreferences {
  category_codes: string[];
  notify_mode: "instantly" | "daily" | "weekly" | "none";
  email_enabled: boolean;
}

const EMPTY_RESPONSE: LegislationResponse = {
  updates: [],
  pageInfo: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

const EMPTY_PREFS: LegislationPreferences = {
  category_codes: [],
  notify_mode: "none",
  email_enabled: false,
};

export function useLegislationUpdates(): {
  data: LegislationResponse;
  isLoading: false;
  isError: false;
} {
  return { data: EMPTY_RESPONSE, isLoading: false, isError: false };
}

export function useLegislationCategories(): {
  data: LegislationCategory[];
  isLoading: false;
  isError: false;
} {
  return { data: [], isLoading: false, isError: false };
}

export function useLegislationPreferences(): {
  data: LegislationPreferences;
  isLoading: false;
  isError: false;
} {
  return { data: EMPTY_PREFS, isLoading: false, isError: false };
}

export function useUpdateLegislationPreferences() {
  return {
    mutate: () => undefined,
    mutateAsync: async () => undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
  };
}
