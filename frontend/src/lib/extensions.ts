/**
 * Extension registry — single source of truth for the paid extension catalogue
 * the platform exposes. Mirrors the modules called out in `full_desc.txt` and
 * `tasks.txt`.
 *
 * The base workspace (Notebook, Notes, Planner, Documents, Dashboard, Settings)
 * is always available; only paid extensions appear here.
 */

import {
  Bot,
  BriefcaseBusiness,
  Building2,
  FileText,
  KanbanSquare,
  MessageSquare,
  Scale,
  type LucideIcon,
} from "lucide-react";

export type ExtensionKey =
  | "contracts_pro"
  | "ticketing_pro"
  | "hr_pro"
  | "internal_chat"
  | "legislation_monitor"
  | "ai_assistant"
  | "multi_site_teams";

export const EXTENSION_KEYS: readonly ExtensionKey[] = [
  "contracts_pro",
  "ticketing_pro",
  "hr_pro",
  "internal_chat",
  "legislation_monitor",
  "ai_assistant",
  "multi_site_teams",
] as const;

export interface ExtensionMeta {
  key: ExtensionKey;
  /** Romanian display label used across UI surfaces. */
  label: string;
  /** Short description for marketing/settings cards. */
  description: string;
  icon: LucideIcon;
  /** Marketing-tier hint shown alongside gating UI. */
  tierHint?: string;
  /** Whether the extension is publicly orderable yet (false = roadmap only). */
  available: boolean;
}

export const EXTENSIONS: Record<ExtensionKey, ExtensionMeta> = {
  contracts_pro: {
    key: "contracts_pro",
    label: "Contracts Pro",
    description:
      "Gestionare clienți, șabloane, solicitări de semnare și contracte semnate.",
    icon: FileText,
    tierHint: "Pachet de bază pentru cabinetele care semnează contracte.",
    available: true,
  },
  ticketing_pro: {
    key: "ticketing_pro",
    label: "Ticketing Pro",
    description: "Sistem Jira-light: tickete, kanban, asignări și calendar.",
    icon: KanbanSquare,
    available: true,
  },
  hr_pro: {
    key: "hr_pro",
    label: "HR Pro",
    description:
      "Pontaj, concedii, review-uri, cereri de adeverințe și planificare vacanțe.",
    icon: BriefcaseBusiness,
    available: true,
  },
  internal_chat: {
    key: "internal_chat",
    label: "Internal Chat",
    description:
      "Chat intern între membrii organizației, cu @bot care derivă tickete.",
    icon: MessageSquare,
    available: true,
  },
  legislation_monitor: {
    key: "legislation_monitor",
    label: "Legislation Monitor",
    description:
      "Update-uri legislative filtrate pe domeniul de activitate și cod CAEN.",
    icon: Scale,
    available: true,
  },
  ai_assistant: {
    key: "ai_assistant",
    label: "AI Assistant",
    description:
      "Sumarizări, digesturi și planner smart bazate pe AI. Tracking separat de uzaj.",
    icon: Bot,
    tierHint: "Necesită un add-on de credite AI.",
    available: true,
  },
  multi_site_teams: {
    key: "multi_site_teams",
    label: "Multi-Site\nTeams",
    description:
      "Echipe, sucursale, locații pentru afaceri cu mai multe puncte de lucru.",
    icon: Building2,
    tierHint: "Pe roadmap — nu este încă activabil.",
    available: false,
  },
};

/**
 * Default permissive set used in dev: everything that is `available` is on,
 * roadmap extensions stay off.
 */
export const DEFAULT_EXTENSION_STATE: Record<ExtensionKey, boolean> = {
  contracts_pro: true,
  ticketing_pro: true,
  hr_pro: true,
  internal_chat: true,
  legislation_monitor: true,
  ai_assistant: true,
  multi_site_teams: false,
};

export function extensionLabel(key: ExtensionKey): string {
  return EXTENSIONS[key].label;
}

/** Pentru toast-uri, aria-label, badge-uri (fără line break). */
export function labelOneLine(label: string): string {
  return label.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function extensionLabelOneLine(key: ExtensionKey): string {
  return labelOneLine(EXTENSIONS[key].label);
}
