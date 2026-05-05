import { useEffect, useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { Input, Textarea } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { TriggerPicker } from "./TriggerPicker";
import {
  ENTITY_OPTIONS,
  lookupAction,
  lookupAIAction,
  lookupTrigger,
} from "../../../../lib/automation/catalog";
import { explainWorkflow } from "../../../../lib/ai";
import type {
  EntityKind,
  Workflow,
  WorkflowStep,
  WorkflowTrigger,
} from "../../../../lib/automation/types";

interface InspectorProps {
  workflow: Workflow;
  selection:
    | { kind: "trigger" }
    | { kind: "step"; path: string; step: WorkflowStep }
    | null;
  onChangeTrigger: (next: WorkflowTrigger) => void;
  onChangeStep: (path: string, next: WorkflowStep) => void;
  onClose: () => void;
}

export function StepInspector({
  workflow,
  selection,
  onChangeTrigger,
  onChangeStep,
  onClose,
}: InspectorProps) {
  if (selection === null) {
    return <EmptyInspector workflow={workflow} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-sm font-semibold text-foreground">
          {selection.kind === "trigger" ? "Configurare trigger" : "Configurare pas"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          aria-label="Închide panou"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {selection.kind === "trigger" && (
        <TriggerInspector trigger={workflow.trigger} onChange={onChangeTrigger} />
      )}
      {selection.kind === "step" && (
        <StepEditor
          step={selection.step}
          onChange={(next) => onChangeStep(selection.path, next)}
        />
      )}
    </div>
  );
}

function TriggerInspector({
  trigger,
  onChange,
}: {
  trigger: WorkflowTrigger;
  onChange: (next: WorkflowTrigger) => void;
}) {
  const meta = lookupTrigger(trigger.kind);
  return (
    <div className="space-y-4">
      <Badge variant="info">{meta.label}</Badge>
      <p className="text-xs text-muted-foreground">{meta.description}</p>

      <TriggerPicker
        value={trigger.kind}
        onSelect={(kind) =>
          onChange({
            ...trigger,
            kind,
            // Reset config when trigger changes — fields differ wildly per kind.
            config: {},
          })
        }
      />

      <div className="space-y-3 rounded-2xl border border-border bg-background p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Configurare
        </p>
        <Select
          label="Aplicat pe"
          value={trigger.entity ?? ""}
          onChange={(e) => onChange({ ...trigger, entity: e.target.value as EntityKind })}
          options={[{ value: "", label: "— oricare entitate —" }, ...ENTITY_OPTIONS]}
        />
        {trigger.kind === "days_before_deadline" && (
          <Input
            label="Câte zile înainte"
            type="number"
            value={String((trigger.config.days as number) ?? 3)}
            onChange={(e) =>
              onChange({
                ...trigger,
                config: { ...trigger.config, days: Number(e.target.value) || 1 },
              })
            }
          />
        )}
        {trigger.kind === "recurring_schedule" && (
          <Input
            label="Cron (ex.: 0 9 * * 1-5)"
            value={String(trigger.config.cron ?? "0 9 * * *")}
            onChange={(e) =>
              onChange({ ...trigger, config: { ...trigger.config, cron: e.target.value } })
            }
            hint="Format standard cron — 5 câmpuri."
          />
        )}
        {trigger.kind === "on_status_change" && (
          <>
            <Input
              label="Status nou (la)"
              value={String(trigger.config.to ?? "")}
              onChange={(e) =>
                onChange({ ...trigger, config: { ...trigger.config, to: e.target.value } })
              }
              placeholder="ex.: signed, blocked, done"
            />
            <Input
              label="Status anterior (de la, opțional)"
              value={String(trigger.config.from ?? "")}
              onChange={(e) =>
                onChange({ ...trigger, config: { ...trigger.config, from: e.target.value } })
              }
              placeholder="ex.: pending"
            />
          </>
        )}
        {trigger.kind === "on_field_change" && (
          <Input
            label="Câmp urmărit"
            value={String(trigger.config.field ?? "")}
            onChange={(e) =>
              onChange({ ...trigger, config: { ...trigger.config, field: e.target.value } })
            }
            placeholder="ex.: priority, owner_id"
          />
        )}
        {trigger.kind === "on_value_threshold" && (
          <>
            <Input
              label="Câmp"
              value={String(trigger.config.field ?? "")}
              onChange={(e) =>
                onChange({ ...trigger, config: { ...trigger.config, field: e.target.value } })
              }
            />
            <Input
              label="Prag"
              type="number"
              value={String(trigger.config.threshold ?? 0)}
              onChange={(e) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, threshold: Number(e.target.value) },
                })
              }
            />
          </>
        )}
        {trigger.kind === "on_inactivity" && (
          <Input
            label="Zile fără activitate"
            type="number"
            value={String((trigger.config.days as number) ?? 7)}
            onChange={(e) =>
              onChange({
                ...trigger,
                config: { ...trigger.config, days: Number(e.target.value) || 1 },
              })
            }
          />
        )}
        {trigger.kind === "on_webhook_received" && (
          <Input
            label="Slug endpoint"
            value={String(trigger.config.slug ?? "")}
            onChange={(e) =>
              onChange({ ...trigger, config: { ...trigger.config, slug: e.target.value } })
            }
            hint="Va deveni disponibil la /webhooks/in/<slug> când backend-ul wire-uiește acest trigger."
          />
        )}
      </div>
    </div>
  );
}

function StepEditor({
  step,
  onChange,
}: {
  step: WorkflowStep;
  onChange: (next: WorkflowStep) => void;
}) {
  const [configText, setConfigText] = useState(() =>
    JSON.stringify("config" in step ? step.config : {}, null, 2),
  );
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if ("config" in step) {
      setConfigText(JSON.stringify(step.config, null, 2));
      setConfigError(null);
    }
  }, [step.id]);

  if (step.kind === "delay") {
    return (
      <div className="space-y-3">
        <Badge variant="info">Așteptare</Badge>
        <Input
          label="Durată (minute)"
          type="number"
          value={String(step.minutes)}
          onChange={(e) =>
            onChange({ ...step, minutes: Math.max(0, Number(e.target.value) || 0) })
          }
          hint="60 = 1 oră, 1440 = 1 zi."
        />
      </div>
    );
  }

  if (step.kind === "condition") {
    return (
      <div className="space-y-3">
        <Badge variant="info">Condiție</Badge>
        <Textarea
          label="Expresie"
          value={step.expr}
          onChange={(e) => onChange({ ...step, expr: e.target.value })}
          rows={3}
          placeholder='ex.: ai_output.label == "urgent"'
          hint="Folosește variabile precum {{trigger.field}} sau ai_output.<câmp>."
        />
        <p className="text-[11px] text-muted-foreground">
          Pașii din ramura <strong>Atunci</strong> rulează când expresia este adevărată; cei
          din <strong>Altfel</strong> când este falsă.
        </p>
      </div>
    );
  }

  const meta = step.kind === "ai" ? lookupAIAction(step.action) : lookupAction(step.type);
  const Icon = meta.icon;
  const isAI = step.kind === "ai";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={
            isAI
              ? "flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent)]/15"
              : "flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5"
          }
        >
          <Icon className="h-4 w-4" strokeWidth={1.85} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        </div>
        {isAI && <Badge variant="accent">AI</Badge>}
      </div>

      <Textarea
        label="Configurare (JSON)"
        value={configText}
        onChange={(e) => {
          setConfigText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value || "{}");
            setConfigError(null);
            if (step.kind === "ai") {
              onChange({ ...step, config: parsed });
            } else if (step.kind === "action") {
              onChange({ ...step, config: parsed });
            }
          } catch {
            setConfigError("JSON invalid — modificările nu se salvează.");
          }
        }}
        rows={10}
        {...(configError ? { error: configError } : {})}
        hint="Folosește variabile {{trigger.field}}, ai_output.X, {{client.email}} etc."
      />
    </div>
  );
}

function EmptyInspector({ workflow }: { workflow: Workflow }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    setExplanation("");
    try {
      for await (const chunk of explainWorkflow(workflow)) {
        setExplanation(chunk);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
        Selectează triggerul sau un pas pentru a-l configura. Sau cere AI-ului o
        explicație în limbaj natural a workflow-ului curent.
      </div>
      <Button variant="outline" size="sm" onClick={explain} disabled={loading}>
        <Sparkles className="h-4 w-4" />
        {loading ? "Se generează..." : "Explică-mi cu AI"}
      </Button>
      {explanation && (
        <div className="rounded-2xl border border-border bg-frame p-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Bot className="h-3.5 w-3.5" /> Explicație AI
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{explanation}</p>
        </div>
      )}
    </div>
  );
}
