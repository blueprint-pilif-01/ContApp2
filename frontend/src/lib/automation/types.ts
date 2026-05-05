export type EntityKind =
  | "contracts"
  | "tasks"
  | "hr_leaves"
  | "clients"
  | "invoices"
  | "messages"
  | "calendar_events"
  | "documents";

export type TriggerKind =
  | "on_create"
  | "on_update"
  | "on_delete"
  | "on_status_change"
  | "on_field_change"
  | "on_assignment"
  | "days_before_deadline"
  | "on_date_reached"
  | "recurring_schedule"
  | "on_value_threshold"
  | "on_inactivity"
  | "on_webhook_received"
  | "ai_anomaly_detected"
  | "manual_trigger";

export type ActionKind =
  | "send_notification"
  | "send_email"
  | "send_sms"
  | "post_chat_message"
  | "create_task"
  | "update_task"
  | "assign_user"
  | "update_field"
  | "add_tag"
  | "add_comment"
  | "create_calendar_event"
  | "outbound_webhook"
  | "create_document_from_template"
  | "request_approval"
  | "wait"
  | "loop_over";

export type AIActionKind =
  | "ai_summarize"
  | "ai_draft_email"
  | "ai_classify"
  | "ai_extract_fields"
  | "ai_translate"
  | "ai_sentiment"
  | "ai_suggest_assignee"
  | "ai_predict_due_date"
  | "ai_generate_task_description"
  | "ai_score_lead";

export interface WorkflowTrigger {
  kind: TriggerKind;
  entity?: EntityKind;
  config: Record<string, unknown>;
}

export type WorkflowStep =
  | {
      id: string;
      kind: "action";
      type: ActionKind;
      config: Record<string, unknown>;
    }
  | {
      id: string;
      kind: "ai";
      action: AIActionKind;
      config: Record<string, unknown>;
    }
  | {
      id: string;
      kind: "condition";
      expr: string;
      then: WorkflowStep[];
      else: WorkflowStep[];
    }
  | {
      id: string;
      kind: "delay";
      minutes: number;
    };

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  /** Source flag — distinguishes locally-built workflows from templates seeded by the catalog. */
  source?: "user" | "template" | "ai_generated";
  /** Reference to template id when instantiated from a template. */
  template_id?: string;
}

export type RunStatus = "running" | "success" | "error" | "skipped";

export interface WorkflowRunStep {
  step_index: number;
  step_path: string;
  kind: WorkflowStep["kind"];
  status: RunStatus;
  started_at: string;
  finished_at?: string;
  log?: string;
  ai_output?: string;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_label: string;
  started_at: string;
  finished_at?: string;
  status: RunStatus;
  steps: WorkflowRunStep[];
  affected_entity?: { kind: EntityKind; id: string | number; label: string };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "contracts"
    | "ticketing"
    | "hr"
    | "ai"
    | "communication"
    | "reporting"
    | "client_lifecycle";
  tags: string[];
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  uses_ai: boolean;
}
