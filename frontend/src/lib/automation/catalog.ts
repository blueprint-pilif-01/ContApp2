import {
  AlarmClock,
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  Bot,
  Calendar,
  CalendarClock,
  CalendarPlus,
  CheckSquare,
  ClipboardEdit,
  Clock,
  Coins,
  FileSignature,
  FileText,
  Filter,
  Globe,
  HandCoins,
  Hash,
  Languages,
  ListChecks,
  Mail,
  MailPlus,
  MessageSquarePlus,
  MousePointerClick,
  PenLine,
  PiggyBank,
  Plus,
  Repeat,
  ScanText,
  Send,
  Smile,
  Sparkles,
  Tag,
  Target,
  TimerReset,
  TrendingUp,
  UserCheck,
  Webhook,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  ActionKind,
  AIActionKind,
  EntityKind,
  TriggerKind,
} from "./types";

export interface CatalogEntry<K extends string> {
  kind: K;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tag used for grouping in pickers. */
  group: string;
  /** Whether this item produces or consumes AI calls (used for "AI" badges). */
  aiPowered?: boolean;
}

export const ENTITY_LABELS: Record<EntityKind, string> = {
  contracts: "Contracte",
  tasks: "Tickete",
  hr_leaves: "Concedii HR",
  clients: "Clienți",
  invoices: "Facturi",
  messages: "Mesaje chat",
  calendar_events: "Evenimente calendar",
  documents: "Documente",
};

export const ENTITY_OPTIONS: { value: EntityKind; label: string }[] = (
  Object.keys(ENTITY_LABELS) as EntityKind[]
).map((k) => ({ value: k, label: ENTITY_LABELS[k] }));

export const TRIGGERS: CatalogEntry<TriggerKind>[] = [
  {
    kind: "on_create",
    label: "La creare element",
    description: "Se rulează când o entitate nouă este adăugată în workspace.",
    icon: Plus,
    group: "Evenimente entitate",
  },
  {
    kind: "on_update",
    label: "La actualizare",
    description: "Pornește la fiecare modificare a unei entități urmărite.",
    icon: PenLine,
    group: "Evenimente entitate",
  },
  {
    kind: "on_delete",
    label: "La ștergere",
    description: "Se rulează când o entitate este ștearsă (soft sau hard delete).",
    icon: AlertTriangle,
    group: "Evenimente entitate",
  },
  {
    kind: "on_status_change",
    label: "La schimbare status",
    description: "Reacționează când statusul devine egal cu o valoare specifică.",
    icon: ArrowRightLeft,
    group: "Evenimente entitate",
  },
  {
    kind: "on_field_change",
    label: "La schimbare câmp",
    description: "Pornește când un câmp anume își schimbă valoarea.",
    icon: ClipboardEdit,
    group: "Evenimente entitate",
  },
  {
    kind: "on_assignment",
    label: "La asignare",
    description: "Reacționează când o entitate este asignată unui membru.",
    icon: UserCheck,
    group: "Evenimente entitate",
  },
  {
    kind: "days_before_deadline",
    label: "Zile înainte de deadline",
    description: "Notifică / acționează cu N zile înainte de un termen.",
    icon: AlarmClock,
    group: "Timp",
  },
  {
    kind: "on_date_reached",
    label: "La o dată specifică",
    description: "Rulează la o dată calendaristică, o singură dată.",
    icon: Calendar,
    group: "Timp",
  },
  {
    kind: "recurring_schedule",
    label: "Program recurent",
    description: "Pornește pe interval recurent (ex.: zilnic, săptămânal, lunar).",
    icon: Repeat,
    group: "Timp",
  },
  {
    kind: "on_value_threshold",
    label: "Prag valoare depășit",
    description: "Reacționează când o valoare numerică trece peste / sub un prag.",
    icon: TrendingUp,
    group: "Date",
  },
  {
    kind: "on_inactivity",
    label: "La inactivitate",
    description: "Pornește când nu apar evenimente noi pe o entitate timp de N zile.",
    icon: TimerReset,
    group: "Date",
  },
  {
    kind: "on_webhook_received",
    label: "Webhook extern primit",
    description: "Acceptă un POST extern pe un endpoint generat. Util pentru integrări.",
    icon: Webhook,
    group: "Integrări",
  },
  {
    kind: "ai_anomaly_detected",
    label: "Anomalie detectată de AI",
    description: "Se rulează când AI-ul găsește o anomalie (ex.: client la risc).",
    icon: Sparkles,
    group: "AI",
    aiPowered: true,
  },
  {
    kind: "manual_trigger",
    label: "Declanșare manuală",
    description: "Permite rularea pe loc dintr-un buton, oriunde în aplicație.",
    icon: MousePointerClick,
    group: "Manual",
  },
];

export const ACTIONS: CatalogEntry<ActionKind>[] = [
  {
    kind: "send_notification",
    label: "Trimite notificare",
    description: "Notificare în aplicație către unul sau mai mulți utilizatori.",
    icon: Bell,
    group: "Comunicare",
  },
  {
    kind: "send_email",
    label: "Trimite email",
    description: "Email tranzacțional cu subiect, corp și destinatari personalizabili.",
    icon: Mail,
    group: "Comunicare",
  },
  {
    kind: "send_sms",
    label: "Trimite SMS",
    description: "SMS scurt către un număr (necesită provider SMS conectat).",
    icon: Send,
    group: "Comunicare",
  },
  {
    kind: "post_chat_message",
    label: "Postează în chat intern",
    description: "Mesaj automat într-un canal de chat intern.",
    icon: MessageSquarePlus,
    group: "Comunicare",
  },
  {
    kind: "create_task",
    label: "Crează ticket",
    description: "Adaugă un ticket nou cu titlu, asignat și termen.",
    icon: CheckSquare,
    group: "Workflow",
  },
  {
    kind: "update_task",
    label: "Actualizează ticket",
    description: "Modifică un ticket existent: status, prioritate, asignat.",
    icon: ListChecks,
    group: "Workflow",
  },
  {
    kind: "assign_user",
    label: "Asignează utilizator",
    description: "Setează responsabilul pentru o entitate.",
    icon: UserCheck,
    group: "Workflow",
  },
  {
    kind: "update_field",
    label: "Actualizează câmp",
    description: "Modifică valoarea unui câmp pe entitatea declanșatoare.",
    icon: PenLine,
    group: "Workflow",
  },
  {
    kind: "add_tag",
    label: "Adaugă etichetă",
    description: "Adaugă una sau mai multe etichete pe entitate.",
    icon: Tag,
    group: "Workflow",
  },
  {
    kind: "add_comment",
    label: "Adaugă comentariu",
    description: "Postează un comentariu intern sau către client.",
    icon: ClipboardEdit,
    group: "Workflow",
  },
  {
    kind: "create_calendar_event",
    label: "Crează eveniment calendar",
    description: "Adaugă în calendarul intern un eveniment cu invitați.",
    icon: CalendarPlus,
    group: "Workflow",
  },
  {
    kind: "outbound_webhook",
    label: "Trimite webhook",
    description: "POST către un URL extern (Zapier, Make, sistem propriu).",
    icon: Globe,
    group: "Integrări",
  },
  {
    kind: "create_document_from_template",
    label: "Generează document",
    description: "Crează un document din șablon, cu câmpurile populate.",
    icon: FileSignature,
    group: "Documente",
  },
  {
    kind: "request_approval",
    label: "Cere aprobare",
    description: "Trimite o cerere de aprobare către un manager înainte de pasul următor.",
    icon: HandCoins,
    group: "Workflow",
  },
  {
    kind: "wait",
    label: "Așteaptă",
    description: "Întârziere fixă (minute, ore, zile) între pași.",
    icon: Clock,
    group: "Control",
  },
  {
    kind: "loop_over",
    label: "Iterează peste o listă",
    description: "Rulează pașii pentru fiecare element dintr-o colecție.",
    icon: Repeat,
    group: "Control",
  },
];

export const AI_ACTIONS: CatalogEntry<AIActionKind>[] = [
  {
    kind: "ai_summarize",
    label: "AI: Sumarizare",
    description: "Comprimă un text lung într-un rezumat concis.",
    icon: ScanText,
    group: "AI Conținut",
    aiPowered: true,
  },
  {
    kind: "ai_draft_email",
    label: "AI: Compune email",
    description: "Generează un email pe baza contextului (client, contract, ticket).",
    icon: MailPlus,
    group: "AI Conținut",
    aiPowered: true,
  },
  {
    kind: "ai_classify",
    label: "AI: Clasificare",
    description: "Clasifică un text într-una din categoriile date.",
    icon: Filter,
    group: "AI Analiză",
    aiPowered: true,
  },
  {
    kind: "ai_extract_fields",
    label: "AI: Extrage câmpuri",
    description: "Extrage date structurate din text liber (ex.: nume, sume, date).",
    icon: ScanText,
    group: "AI Analiză",
    aiPowered: true,
  },
  {
    kind: "ai_translate",
    label: "AI: Traducere",
    description: "Traduce un text într-o altă limbă, păstrând tonul.",
    icon: Languages,
    group: "AI Conținut",
    aiPowered: true,
  },
  {
    kind: "ai_sentiment",
    label: "AI: Sentiment",
    description: "Detectează tonul (pozitiv / neutru / negativ) al unui mesaj.",
    icon: Smile,
    group: "AI Analiză",
    aiPowered: true,
  },
  {
    kind: "ai_suggest_assignee",
    label: "AI: Sugerează responsabil",
    description: "Recomandă cine ar trebui să preia ticketul, pe baza istoricului.",
    icon: UserCheck,
    group: "AI Decizie",
    aiPowered: true,
  },
  {
    kind: "ai_predict_due_date",
    label: "AI: Predicție termen",
    description: "Estimează un termen realist pentru un task.",
    icon: CalendarClock,
    group: "AI Decizie",
    aiPowered: true,
  },
  {
    kind: "ai_generate_task_description",
    label: "AI: Descriere ticket",
    description: "Compune o descriere structurată pornind de la un titlu scurt.",
    icon: Wand2,
    group: "AI Conținut",
    aiPowered: true,
  },
  {
    kind: "ai_score_lead",
    label: "AI: Scor lead",
    description: "Evaluează un client / lead pe scala 0–100 după potențial.",
    icon: Target,
    group: "AI Analiză",
    aiPowered: true,
  },
];

const TRIGGER_INDEX = new Map<TriggerKind, CatalogEntry<TriggerKind>>(
  TRIGGERS.map((t) => [t.kind, t]),
);
const ACTION_INDEX = new Map<ActionKind, CatalogEntry<ActionKind>>(
  ACTIONS.map((a) => [a.kind, a]),
);
const AI_ACTION_INDEX = new Map<AIActionKind, CatalogEntry<AIActionKind>>(
  AI_ACTIONS.map((a) => [a.kind, a]),
);

export function lookupTrigger(kind: TriggerKind): CatalogEntry<TriggerKind> {
  return TRIGGER_INDEX.get(kind) ?? FALLBACK_TRIGGER;
}

export function lookupAction(kind: ActionKind): CatalogEntry<ActionKind> {
  return ACTION_INDEX.get(kind) ?? FALLBACK_ACTION;
}

export function lookupAIAction(kind: AIActionKind): CatalogEntry<AIActionKind> {
  return AI_ACTION_INDEX.get(kind) ?? FALLBACK_AI_ACTION;
}

const FALLBACK_TRIGGER: CatalogEntry<TriggerKind> = {
  kind: "manual_trigger",
  label: "Declanșare necunoscută",
  description: "Tipul de trigger nu este recunoscut.",
  icon: Zap,
  group: "Manual",
};

const FALLBACK_ACTION: CatalogEntry<ActionKind> = {
  kind: "send_notification",
  label: "Acțiune necunoscută",
  description: "Tipul de acțiune nu este recunoscut.",
  icon: Zap,
  group: "Comunicare",
};

const FALLBACK_AI_ACTION: CatalogEntry<AIActionKind> = {
  kind: "ai_summarize",
  label: "Acțiune AI necunoscută",
  description: "Acțiunea AI nu este recunoscută.",
  icon: Bot,
  group: "AI Conținut",
  aiPowered: true,
};

/** Used for the AI badge / "Necesită credite AI" hint. */
export const AI_TRIGGER_KINDS = new Set<TriggerKind>(
  TRIGGERS.filter((t) => t.aiPowered).map((t) => t.kind),
);

/** Helper for icon picking when a step kind is generic (delay / condition). */
export const STEP_KIND_ICONS: Record<string, LucideIcon> = {
  action: Zap,
  ai: Bot,
  condition: Filter,
  delay: Clock,
};

/** Total counts shown in marketing-style headers. */
export const CATALOG_COUNTS = {
  triggers: TRIGGERS.length,
  actions: ACTIONS.length + AI_ACTIONS.length,
  ai_actions: AI_ACTIONS.length,
} as const;

/** Icons re-exported just so seed/insights pages don't need their own imports. */
export const KPI_ICONS = {
  workflows: Zap,
  runs: Repeat,
  success: CheckSquare,
  ai: Bot,
  saved: PiggyBank,
  triggers: Hash,
  actions: ListChecks,
  contracts: FileText,
  finance: Coins,
} as const;
