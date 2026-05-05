/**
 * Local legislation feed used until the backend exposes a persisted module.
 * It keeps the UI contract from full_desc.txt usable without dead API calls.
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
  caen_codes?: string[];
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
  notify_mode: "instant" | "daily" | "weekly" | "never";
  email_enabled: boolean;
}

const CATEGORIES: LegislationCategory[] = [
  { code: "fiscal", name: "Fiscal" },
  { code: "munca", name: "Muncă" },
  { code: "gdpr", name: "GDPR" },
  { code: "comercial", name: "Comercial" },
];

const STATIC_UPDATES: LegislationUpdate[] = [
  {
    id: "leg-2026-05-fiscal-1",
    title: "Actualizări procedurale pentru declarații fiscale",
    summary:
      "Sunt consolidate termenele operaționale pentru depuneri și corecții, cu impact pentru firmele care lucrează lunar cu raportări contabile.",
    category_code: "fiscal",
    category_name: "Fiscal",
    source_name: "ANAF",
    source_url: "https://www.anaf.ro",
    published_at: "2026-05-03T09:00:00.000Z",
    caen_codes: ["6920", "7022"],
  },
  {
    id: "leg-2026-05-munca-1",
    title: "Clarificări pentru evidența timpului de lucru",
    summary:
      "Noile precizări urmăresc trasabilitatea programului, concediilor și aprobărilor interne pentru organizațiile cu angajați și program flexibil.",
    category_code: "munca",
    category_name: "Muncă",
    source_name: "Ministerul Muncii",
    source_url: "https://mmuncii.ro",
    published_at: "2026-05-02T13:00:00.000Z",
    caen_codes: ["6202", "8559", "4719"],
  },
  {
    id: "leg-2026-05-gdpr-1",
    title: "Recomandări privind retenția documentelor cu date personale",
    summary:
      "Autoritatea recomandă politici clare de păstrare pentru contracte, documente de client și fișiere atașate fluxurilor de semnare.",
    category_code: "gdpr",
    category_name: "GDPR",
    source_name: "ANSPDCP",
    source_url: "https://www.dataprotection.ro",
    published_at: "2026-04-30T10:30:00.000Z",
    caen_codes: ["6920", "7022", "6202"],
  },
  {
    id: "leg-2026-05-comercial-1",
    title: "Bune practici pentru contractele comerciale digitale",
    summary:
      "Ghidul acoperă identificarea părților, câmpurile dinamice, evidența invitațiilor și arhivarea documentelor semnate electronic.",
    category_code: "comercial",
    category_name: "Comercial",
    source_name: "ONRC",
    source_url: "https://www.onrc.ro",
    published_at: "2026-04-29T08:45:00.000Z",
    caen_codes: ["7022", "6202", "4719"],
  },
];

const STATIC_RESPONSE: LegislationResponse = {
  updates: STATIC_UPDATES,
  pageInfo: {
    page: 1,
    limit: 20,
    total: STATIC_UPDATES.length,
    totalPages: 1,
  },
};

const DEFAULT_PREFS: LegislationPreferences = {
  category_codes: [],
  notify_mode: "daily",
  email_enabled: true,
};

const PREFS_STORAGE_KEY = "contapp_legislation_preferences";

function readPreferences(): LegislationPreferences {
  if (typeof localStorage === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useLegislationUpdates(): {
  data: LegislationResponse;
  isLoading: false;
  isError: false;
} {
  return { data: STATIC_RESPONSE, isLoading: false, isError: false };
}

export function useLegislationCategories(): {
  data: LegislationCategory[];
  isLoading: false;
  isError: false;
} {
  return { data: CATEGORIES, isLoading: false, isError: false };
}

export function useLegislationPreferences(): {
  data: LegislationPreferences;
  isLoading: false;
  isError: false;
} {
  return { data: readPreferences(), isLoading: false, isError: false };
}

export function useUpdateLegislationPreferences() {
  return {
    mutate: (payload: Partial<LegislationPreferences>) => {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ ...readPreferences(), ...payload })
      );
    },
    mutateAsync: async (payload: Partial<LegislationPreferences>) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          PREFS_STORAGE_KEY,
          JSON.stringify({ ...readPreferences(), ...payload })
        );
      }
      return undefined;
    },
    isPending: false,
    isError: false,
    isSuccess: false,
  };
}
