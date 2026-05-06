import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Input, Textarea } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { SectionCard } from "../../../../components/ui/SectionCard";
import { Badge } from "../../../../components/ui/Badge";
import { runAgentStep, type AgentRunStep } from "../../../../lib/ai";
import { AI_ACTIONS, lookupAIAction } from "../../../../lib/automation/catalog";
import { cn } from "../../../../lib/utils";
import type { AIActionKind } from "../../../../lib/automation/types";

interface AgentStepDraft {
  id: string;
  action: AIActionKind;
  instruction: string;
}

interface AgentDraft {
  id: string;
  name: string;
  goal: string;
  systemPrompt: string;
  steps: AgentStepDraft[];
}

const STARTER_AGENTS: AgentDraft[] = [
  {
    id: "agent_triage",
    name: "Triage Concierge",
    goal: "Triajează ticketele noi: clasifică, sugerează un asignat și produce o descriere clară.",
    systemPrompt:
      "Ești un agent de triage. Primești titluri și descrieri scurte ale ticketelor și răspunzi concis, în română.",
    steps: [
      {
        id: "s1",
        action: "ai_classify",
        instruction: "Clasifică în [urgent | normal | informativ].",
      },
      {
        id: "s2",
        action: "ai_suggest_assignee",
        instruction: "Sugerează cine ar trebui să preia, pe baza istoricului recent.",
      },
      {
        id: "s3",
        action: "ai_generate_task_description",
        instruction: "Refrazează descrierea ca un task clar și acționabil.",
      },
    ],
  },
  {
    id: "agent_lead_qual",
    name: "Lead Qualifier",
    goal: "Calificare lead nou: scor, sumar și schiță de email.",
    systemPrompt:
      "Ești un agent de vânzări. Lucrezi în limba română. Răspunzi politicos și concis.",
    steps: [
      { id: "s1", action: "ai_score_lead", instruction: "Estimează scorul 0–100." },
      { id: "s2", action: "ai_summarize", instruction: "Rezumă semnalele cele mai relevante." },
      { id: "s3", action: "ai_draft_email", instruction: "Schițează un follow-up scurt." },
    ],
  },
];

export function AgentDesigner() {
  const [agent, setAgent] = useState<AgentDraft>(() => STARTER_AGENTS[0]!);
  const [stepRuns, setStepRuns] = useState<Record<string, AgentRunStep | "loading">>({});

  const updateStep = (id: string, patch: Partial<AgentStepDraft>) => {
    setAgent((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addStep = () => {
    setAgent((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: `s_${Date.now().toString(36)}`,
          action: "ai_summarize",
          instruction: "",
        },
      ],
    }));
  };

  const removeStep = (id: string) => {
    setAgent((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.id !== id) }));
  };

  const runStep = async (idx: number) => {
    const step = agent.steps[idx];
    if (!step) return;
    setStepRuns((prev) => ({ ...prev, [step.id]: "loading" }));
    const result = await runAgentStep(agent.id, idx, {
      goal: agent.goal,
      system_prompt: agent.systemPrompt,
      action: step.action,
      instruction: step.instruction,
    });
    setStepRuns((prev) => ({
      ...prev,
      [step.id]: result ?? { index: idx, status: "error", error: "AI temporar indisponibil." },
    }));
  };

  const runAll = async () => {
    for (let i = 0; i < agent.steps.length; i++) {
      // Sequential — each step waits for the previous to finish.
      await runStep(i);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Pornește dintr-un agent existent:</p>
          <div className="flex gap-1.5">
            {STARTER_AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAgent(a);
                  setStepRuns({});
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  agent.id === a.id
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <SectionCard
          icon={Bot}
          title="Definire agent"
          description="Numele, scopul și prompt-ul de sistem comun."
          padding="sm"
        >
          <Input
            label="Nume"
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
          />
          <div className="mt-3" />
          <Textarea
            label="Scop"
            value={agent.goal}
            onChange={(e) => setAgent({ ...agent, goal: e.target.value })}
            rows={2}
          />
          <div className="mt-3" />
          <Textarea
            label="Prompt de sistem"
            value={agent.systemPrompt}
            onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
            rows={4}
            hint="Tonul, limba, comportamentul de bază al agentului."
          />
        </SectionCard>

        <SectionCard
          icon={Sparkles}
          title="Pași AI"
          description="Sunt rulați în ordine; fiecare pas vede output-ul celui anterior."
          actions={
            <Button variant="outline" size="xs" onClick={addStep}>
              <Plus className="h-3.5 w-3.5" /> Adaugă
            </Button>
          }
          padding="sm"
        >
          <ul className="space-y-2">
            {agent.steps.map((step, idx) => {
              const meta = lookupAIAction(step.action);
              const Icon = meta.icon;
              const run = stepRuns[step.id];
              return (
                <li
                  key={step.id}
                  className="rounded-2xl border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--accent)]/15">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                    </span>
                    <Select
                      className="flex-1"
                      value={step.action}
                      onChange={(e) => updateStep(step.id, { action: e.target.value as AIActionKind })}
                      options={AI_ACTIONS.map((a) => ({ value: a.kind, label: a.label }))}
                    />
                    <RunIndicator {...(run !== undefined ? { state: run } : {})} />
                    <button
                      type="button"
                      onClick={() => runStep(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                      title="Rulează pasul"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                      title="Șterge"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <Textarea
                      value={step.instruction}
                      onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                      rows={2}
                      placeholder="Instrucțiune specifică pentru acest pas..."
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setStepRuns({})} size="sm">
            Resetează rulările
          </Button>
          <Button onClick={runAll} size="sm">
            <Play className="h-4 w-4" /> Rulează agentul
          </Button>
        </div>
      </div>

      <SectionCard
        icon={Bot}
        title="Output pași"
        description="Rezultate live de la /ai/agent-run. Niciun text simulat."
        padding="sm"
      >
        <ul className="space-y-2">
          {agent.steps.map((step, idx) => {
            const meta = lookupAIAction(step.action);
            const run = stepRuns[step.id];
            return (
              <li
                key={step.id}
                className={cn(
                  "rounded-2xl border bg-background p-3",
                  run === "loading"
                    ? "border-[color:var(--accent)]/40"
                    : run && typeof run === "object" && run.status === "error"
                      ? "border-red-500/40"
                      : "border-border",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pas {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {run === undefined && "Neexecutat"}
                    {run === "loading" && "Se rulează..."}
                    {typeof run === "object" && run.status}
                  </span>
                </div>
                {typeof run === "object" && run.output && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-foreground/[0.03] p-2 text-xs text-foreground">
                    {run.output}
                  </pre>
                )}
                {typeof run === "object" && run.status === "error" && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {run.error || "AI temporar indisponibil."}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}

function RunIndicator({ state }: { state?: AgentRunStep | "loading" }) {
  if (state === "loading")
    return (
      <Badge variant="info" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Rulează
      </Badge>
    );
  if (typeof state === "object") {
    if (state.status === "success")
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> OK
        </Badge>
      );
    if (state.status === "error")
      return (
        <Badge variant="danger" className="gap-1">
          <XCircle className="h-3 w-3" /> Err
        </Badge>
      );
  }
  return null;
}
