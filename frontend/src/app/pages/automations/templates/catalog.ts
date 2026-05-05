import type { WorkflowTemplate } from "../../../../lib/automation/types";

function tplStepId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export const TEMPLATE_CATEGORIES = [
  { id: "contracts", label: "Contracte" },
  { id: "ticketing", label: "Ticketing" },
  { id: "hr", label: "HR" },
  { id: "ai", label: "AI" },
  { id: "communication", label: "Comunicare" },
  { id: "reporting", label: "Rapoarte" },
  { id: "client_lifecycle", label: "Ciclu client" },
] as const;

export type TemplateCategoryId = (typeof TEMPLATE_CATEGORIES)[number]["id"];

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl_contract_expiry_3d",
    name: "Memento contract care expiră (3 zile)",
    description:
      "Notifică responsabilul cu 3 zile înainte de expirarea unui contract și creează un ticket de urmărire.",
    category: "contracts",
    tags: ["deadline", "memento", "contracte"],
    uses_ai: false,
    trigger: {
      kind: "days_before_deadline",
      entity: "contracts",
      config: { days: 3, deadline_field: "expires_at" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_notification",
        config: {
          to: "responsible",
          title: "Contract care expiră",
          body: "Contractul cu {{client.name}} expiră peste 3 zile.",
        },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: {
          title: "Verifică reînnoire contract {{contract.name}}",
          assignee: "responsible",
          due_in_days: 2,
        },
      },
    ],
  },
  {
    id: "tpl_contract_signed_welcome",
    name: "Welcome după semnare contract",
    description:
      "După ce un contract este semnat, trimite un email de bun venit și planifică un apel de onboarding.",
    category: "client_lifecycle",
    tags: ["onboarding", "client", "contract"],
    uses_ai: true,
    trigger: {
      kind: "on_status_change",
      entity: "contracts",
      config: { from: "*", to: "signed" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_draft_email",
        config: {
          subject: "Bine ai venit, {{client.first_name}}!",
          tone: "warm",
          brief:
            "Mulțumim pentru semnarea contractului. Următorii pași: apel de onboarding, acces în portal, persoană de contact.",
        },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { to: "{{client.email}}", subject_var: "subject", body_var: "ai_output" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_calendar_event",
        config: {
          title: "Onboarding {{client.name}}",
          duration_minutes: 30,
          within_days: 5,
        },
      },
    ],
  },
  {
    id: "tpl_contract_unsigned_reminder",
    name: "Reminder contract trimis dar nesemnat (7 zile)",
    description:
      "Dacă o invitație de semnare a fost trimisă acum 7 zile și nu a fost semnată, trimite un al doilea email.",
    category: "contracts",
    tags: ["follow-up", "vânzări"],
    uses_ai: false,
    trigger: {
      kind: "on_inactivity",
      entity: "contracts",
      config: { field: "last_invite_action_at", days: 7, status_in: ["sent", "viewed"] },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: {
          template: "follow_up_signing",
          to: "{{client.email}}",
        },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "add_tag",
        config: { tag: "follow-up-trimis" },
      },
    ],
  },
  {
    id: "tpl_ticket_urgent_triage",
    name: "Triage tickete urgente cu AI",
    description:
      "Ticketele noi sunt clasificate de AI; cele urgente primesc prioritate înaltă și un asignat sugerat.",
    category: "ai",
    tags: ["AI", "ticketing", "triage"],
    uses_ai: true,
    trigger: {
      kind: "on_create",
      entity: "tasks",
      config: {},
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_classify",
        config: {
          source_field: "description",
          labels: ["urgent", "normal", "informativ"],
        },
      },
      {
        id: tplStepId("cond"),
        kind: "condition",
        expr: "ai_output.label == 'urgent'",
        then: [
          {
            id: tplStepId("act"),
            kind: "action",
            type: "update_field",
            config: { field: "priority", value: "high" },
          },
          {
            id: tplStepId("ai"),
            kind: "ai",
            action: "ai_suggest_assignee",
            config: { context_fields: ["title", "description", "client_id"] },
          },
          {
            id: tplStepId("act"),
            kind: "action",
            type: "assign_user",
            config: { from_ai: true },
          },
          {
            id: tplStepId("act"),
            kind: "action",
            type: "send_notification",
            config: {
              to: "managers",
              title: "Ticket urgent triat automat",
              body: "{{task.title}}",
            },
          },
        ],
        else: [
          {
            id: tplStepId("act"),
            kind: "action",
            type: "add_tag",
            config: { tag: "{{ai_output.label}}" },
          },
        ],
      },
    ],
  },
  {
    id: "tpl_ticket_blocked_escalation",
    name: "Escaladează tickete blocate",
    description:
      "Dacă un ticket rămâne în stare 'blocat' mai mult de 24h, escaladează către manager.",
    category: "ticketing",
    tags: ["escaladare", "ticketing"],
    uses_ai: false,
    trigger: {
      kind: "on_inactivity",
      entity: "tasks",
      config: { status_in: ["blocked"], days: 1 },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_notification",
        config: {
          to: "managers",
          title: "Ticket blocat de peste 24h",
          body: "{{task.title}} — necesită intervenție.",
        },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "add_comment",
        config: { body: "Escaladat automat din cauza inactivității prelungite." },
      },
    ],
  },
  {
    id: "tpl_ticket_due_today",
    name: "Reminder zilnic tickete cu termen azi",
    description:
      "În fiecare dimineață la 09:00, trimite responsabililor lista de tickete cu termen astăzi.",
    category: "ticketing",
    tags: ["zilnic", "memento"],
    uses_ai: false,
    trigger: {
      kind: "recurring_schedule",
      config: { cron: "0 9 * * 1-5" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "post_chat_message",
        config: {
          channel: "ops",
          body: "Tickete cu termen astăzi pentru fiecare echipă — vezi atașamentul.",
        },
      },
    ],
  },
  {
    id: "tpl_hr_leave_pending",
    name: "Reminder cerere concediu neaprobată",
    description:
      "Dacă o cerere de concediu rămâne neaprobată de 48h, anunță managerul HR.",
    category: "hr",
    tags: ["HR", "concediu"],
    uses_ai: false,
    trigger: {
      kind: "on_inactivity",
      entity: "hr_leaves",
      config: { status_in: ["pending"], days: 2 },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_notification",
        config: { to: "hr_managers", title: "Cerere concediu neaprobată" },
      },
    ],
  },
  {
    id: "tpl_hr_birthday",
    name: "Felicitare zi de naștere angajat",
    description:
      "În ziua de naștere a unui angajat, postează automat un mesaj în chat-ul echipei.",
    category: "hr",
    tags: ["HR", "echipă", "moral"],
    uses_ai: false,
    trigger: {
      kind: "recurring_schedule",
      config: { cron: "0 9 * * *", filter: "employees.birthday == today" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "post_chat_message",
        config: {
          channel: "general",
          body: "🎂 La mulți ani, {{employee.first_name}}! O zi minunată!",
        },
      },
    ],
  },
  {
    id: "tpl_hr_onboarding_checklist",
    name: "Onboarding angajat nou",
    description:
      "La adăugarea unui nou angajat, generează checklist-ul de onboarding și asignează responsabili.",
    category: "hr",
    tags: ["onboarding", "HR"],
    uses_ai: false,
    trigger: {
      kind: "on_create",
      entity: "tasks",
      config: { tag_eq: "onboarding" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title: "Pregătire echipament pentru {{employee.name}}", assignee: "it_lead" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title: "Sesiune intro cu {{employee.name}}", assignee: "manager" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_calendar_event",
        config: { title: "Welcome 1:1", within_days: 1 },
      },
    ],
  },
  {
    id: "tpl_chat_summary_weekly",
    name: "Sumar săptămânal al chat-ului",
    description:
      "În fiecare vineri, AI-ul rezumă conversațiile cheie din chat-ul intern.",
    category: "ai",
    tags: ["AI", "chat", "săptămânal"],
    uses_ai: true,
    trigger: {
      kind: "recurring_schedule",
      config: { cron: "0 16 * * 5" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_summarize",
        config: { source: "chat.last_7d" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "post_chat_message",
        config: { channel: "leadership", body_var: "ai_output" },
      },
    ],
  },
  {
    id: "tpl_client_at_risk",
    name: "Detectează clienți la risc cu AI",
    description:
      "AI analizează activitatea recentă și marchează clienții care arată semne de churn.",
    category: "ai",
    tags: ["AI", "client", "retenție"],
    uses_ai: true,
    trigger: {
      kind: "ai_anomaly_detected",
      entity: "clients",
      config: { signal: "engagement_drop" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "add_tag",
        config: { tag: "at-risk" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title: "Re-engage client {{client.name}}", priority: "high" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_notification",
        config: { to: "account_manager" },
      },
    ],
  },
  {
    id: "tpl_lead_scoring",
    name: "Scoring lead cu AI",
    description:
      "Fiecare lead nou primește un scor 0–100 din partea AI și e prioritizat în pipeline.",
    category: "ai",
    tags: ["AI", "vânzări", "lead"],
    uses_ai: true,
    trigger: {
      kind: "on_create",
      entity: "clients",
      config: {},
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_score_lead",
        config: {},
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "update_field",
        config: { field: "lead_score", value_var: "ai_output.score" },
      },
      {
        id: tplStepId("cond"),
        kind: "condition",
        expr: "ai_output.score >= 75",
        then: [
          {
            id: tplStepId("act"),
            kind: "action",
            type: "send_notification",
            config: { to: "sales_lead", title: "Lead cu potențial mare" },
          },
        ],
        else: [],
      },
    ],
  },
  {
    id: "tpl_email_intake",
    name: "Intake email → ticket cu AI",
    description:
      "Emailurile care intră în adresa de support sunt clasificate, asignate și transformate în ticket.",
    category: "ai",
    tags: ["AI", "support", "email"],
    uses_ai: true,
    trigger: {
      kind: "on_webhook_received",
      config: { source: "support_inbox" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_extract_fields",
        config: { schema: { client_name: "string", topic: "string", urgency: "string" } },
      },
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_generate_task_description",
        config: {},
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title_var: "ai_output.topic", description_var: "ai_output" },
      },
    ],
  },
  {
    id: "tpl_invoice_overdue",
    name: "Reminder factură restantă",
    description:
      "Pentru facturile restante, trimite reminder politicos la 3, 7 și 14 zile.",
    category: "client_lifecycle",
    tags: ["facturi", "follow-up"],
    uses_ai: false,
    trigger: {
      kind: "days_before_deadline",
      entity: "invoices",
      config: { days: -3, deadline_field: "due_at" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { template: "invoice_reminder_polite" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "wait",
        config: { minutes: 60 * 24 * 4 },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { template: "invoice_reminder_firm" },
      },
    ],
  },
  {
    id: "tpl_legislation_digest",
    name: "Digest săptămânal legislație",
    description:
      "Vineri seara, AI-ul produce un digest cu schimbările legislative relevante pentru organizație.",
    category: "ai",
    tags: ["AI", "legislație", "săptămânal"],
    uses_ai: true,
    trigger: {
      kind: "recurring_schedule",
      config: { cron: "0 18 * * 5" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_summarize",
        config: { source: "legislation.last_7d", filter_by: "caen" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { to: "leadership", subject: "Digest legislativ săptămânal" },
      },
    ],
  },
  {
    id: "tpl_weekly_report",
    name: "Raport săptămânal automat",
    description:
      "Luni dimineață, generează un raport cu KPI-urile principale și îl distribuie echipei.",
    category: "reporting",
    tags: ["raport", "săptămânal"],
    uses_ai: false,
    trigger: {
      kind: "recurring_schedule",
      config: { cron: "0 8 * * 1" },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_document_from_template",
        config: { template: "weekly_kpi_report" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { to: "leadership", subject: "Raport săptămânal — {{week}}" },
      },
    ],
  },
  {
    id: "tpl_client_nps",
    name: "NPS client după proiect",
    description:
      "La închiderea unui proiect, trimite automat un sondaj NPS clientului.",
    category: "client_lifecycle",
    tags: ["NPS", "feedback", "client"],
    uses_ai: false,
    trigger: {
      kind: "on_status_change",
      entity: "tasks",
      config: { from: "*", to: "done", project_eq: true },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "wait",
        config: { minutes: 60 * 48 },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "send_email",
        config: { template: "nps_survey" },
      },
    ],
  },
  {
    id: "tpl_chat_to_ticket",
    name: "Chat → ticket via AI",
    description:
      "Când în chat apare un mesaj care sună ca o cerere acționabilă, AI propune un ticket.",
    category: "ai",
    tags: ["AI", "chat", "ticket"],
    uses_ai: true,
    trigger: {
      kind: "on_create",
      entity: "messages",
      config: {},
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_classify",
        config: { labels: ["actionable", "discussion", "social"] },
      },
      {
        id: tplStepId("cond"),
        kind: "condition",
        expr: "ai_output.label == 'actionable'",
        then: [
          {
            id: tplStepId("ai"),
            kind: "ai",
            action: "ai_generate_task_description",
            config: {},
          },
          {
            id: tplStepId("act"),
            kind: "action",
            type: "create_task",
            config: { description_var: "ai_output" },
          },
        ],
        else: [],
      },
    ],
  },
  {
    id: "tpl_meeting_summary",
    name: "Sumar întâlnire cu AI",
    description:
      "După o întâlnire din calendar, AI-ul rezumă notițele și creează tickete pentru fiecare action item.",
    category: "ai",
    tags: ["AI", "întâlnire", "productivitate"],
    uses_ai: true,
    trigger: {
      kind: "on_status_change",
      entity: "calendar_events",
      config: { from: "*", to: "ended" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_extract_fields",
        config: { schema: { decisions: "string", action_items: "string" } },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "loop_over",
        config: { source_var: "ai_output.action_items" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title_var: "item.title" },
      },
    ],
  },
  {
    id: "tpl_inactive_contract",
    name: "Contract fără activitate 30 zile",
    description:
      "Dacă pe un contract nu mai există activitate de 30 de zile, anunță responsabilul.",
    category: "contracts",
    tags: ["contract", "follow-up"],
    uses_ai: false,
    trigger: {
      kind: "on_inactivity",
      entity: "contracts",
      config: { days: 30 },
    },
    steps: [
      {
        id: tplStepId("act"),
        kind: "action",
        type: "create_task",
        config: { title: "Verifică status contract {{contract.name}}" },
      },
    ],
  },
  {
    id: "tpl_doc_extraction",
    name: "Extrage date din contract uploadat",
    description:
      "Când se urcă un document tip contract, AI extrage părțile, valoarea și datele cheie.",
    category: "ai",
    tags: ["AI", "documente"],
    uses_ai: true,
    trigger: {
      kind: "on_create",
      entity: "documents",
      config: { type_eq: "contract" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_extract_fields",
        config: {
          schema: {
            parties: "string",
            value: "string",
            start_date: "string",
            end_date: "string",
          },
        },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "update_field",
        config: { field_map: { parties: "ai_output.parties", value: "ai_output.value" } },
      },
    ],
  },
  {
    id: "tpl_client_translation",
    name: "Traducere mesaj client cu AI",
    description:
      "Când un client trimite un mesaj într-o limbă străină, AI-ul îl traduce pentru echipă.",
    category: "communication",
    tags: ["AI", "traducere", "client"],
    uses_ai: true,
    trigger: {
      kind: "on_create",
      entity: "messages",
      config: { language_neq: "ro" },
    },
    steps: [
      {
        id: tplStepId("ai"),
        kind: "ai",
        action: "ai_translate",
        config: { target_lang: "ro" },
      },
      {
        id: tplStepId("act"),
        kind: "action",
        type: "post_chat_message",
        config: { channel: "support", body_var: "ai_output" },
      },
    ],
  },
];
