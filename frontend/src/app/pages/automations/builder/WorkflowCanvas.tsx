import { Fragment } from "react";
import {
  ArrowDown,
  Bot,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import { cn } from "../../../../lib/utils";
import type { Workflow, WorkflowStep } from "../../../../lib/automation/types";
import { describeActionStep } from "./ActionNode";
import { describeAIStep } from "./AINode";
import { BranchColumn, describeConditionStep } from "./ConditionNode";
import type { CanvasStepDescriptor } from "./stepDescriptor";
import { TriggerNode } from "./TriggerNode";

export interface CanvasProps {
  workflow: Workflow;
  selectedPath: string | null;
  onSelectStep: (path: string | null) => void;
  onSelectTrigger: () => void;
  onAddStep: (parentPath: string, index: number) => void;
  onRemoveStep: (path: string) => void;
  /** Preview-only: hides add/remove affordances (șabloane). */
  readOnly?: boolean;
}

export function WorkflowCanvas({
  workflow,
  selectedPath,
  onSelectStep,
  onSelectTrigger,
  onAddStep,
  onRemoveStep,
  readOnly = false,
}: CanvasProps) {
  return (
    <div className="space-y-2">
      <TriggerNode
        workflow={workflow}
        active={selectedPath === "trigger"}
        readOnly={readOnly}
        onClick={onSelectTrigger}
      />
      <Connector />
      <StepList
        steps={workflow.steps}
        parentPath="root"
        selectedPath={selectedPath}
        onSelectStep={onSelectStep}
        onAddStep={onAddStep}
        onRemoveStep={onRemoveStep}
        depth={0}
        readOnly={readOnly}
      />
    </div>
  );
}

function StepList({
  steps,
  parentPath,
  selectedPath,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  depth,
  branchTone = "neutral",
  readOnly,
}: {
  steps: WorkflowStep[];
  parentPath: string;
  selectedPath: string | null;
  onSelectStep: (path: string | null) => void;
  onAddStep: (parentPath: string, index: number) => void;
  onRemoveStep: (path: string) => void;
  depth: number;
  branchTone?: "neutral" | "then" | "else";
  readOnly: boolean;
}) {
  return (
    <div className="space-y-2">
      {!readOnly && <AddStepRow onClick={() => onAddStep(parentPath, 0)} />}
      {steps.map((step, i) => {
        const path = `${parentPath}.${i}`;
        return (
          <Fragment key={step.id}>
            <StepCard
              step={step}
              path={path}
              active={selectedPath === path}
              onSelect={() => {
                if (!readOnly) onSelectStep(path);
              }}
              onRemove={() => onRemoveStep(path)}
              depth={depth}
              branchTone={branchTone}
              readOnly={readOnly}
            />
            {step.kind === "condition" && (
              <div className="grid gap-3 pl-6 md:grid-cols-2">
                <BranchColumn label="Atunci" tone="then">
                  <StepList
                    steps={step.then}
                    parentPath={`${path}.then`}
                    selectedPath={selectedPath}
                    onSelectStep={onSelectStep}
                    onAddStep={onAddStep}
                    onRemoveStep={onRemoveStep}
                    depth={depth + 1}
                    branchTone="then"
                    readOnly={readOnly}
                  />
                </BranchColumn>
                <BranchColumn label="Altfel" tone="else">
                  <StepList
                    steps={step.else}
                    parentPath={`${path}.else`}
                    selectedPath={selectedPath}
                    onSelectStep={onSelectStep}
                    onAddStep={onAddStep}
                    onRemoveStep={onRemoveStep}
                    depth={depth + 1}
                    branchTone="else"
                    readOnly={readOnly}
                  />
                </BranchColumn>
              </div>
            )}
            {!readOnly && <AddStepRow onClick={() => onAddStep(parentPath, i + 1)} />}
          </Fragment>
        );
      })}
    </div>
  );
}

function StepCard({
  step,
  path,
  active,
  onSelect,
  onRemove,
  branchTone,
  readOnly,
}: {
  step: WorkflowStep;
  path: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  depth: number;
  branchTone: "neutral" | "then" | "else";
  readOnly: boolean;
}) {
  const meta = describeStep(step);
  const Icon = meta.icon;
  const ringTone =
    branchTone === "then"
      ? "ring-emerald-400/40"
      : branchTone === "else"
        ? "ring-amber-400/40"
        : "ring-foreground/10";
  return (
    <div
      className={cn(
        "group/step relative flex items-center gap-3 rounded-2xl border bg-frame px-4 py-3",
        active
          ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/30"
          : cn("border-border ring-1", ringTone),
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={readOnly}
        className={cn(
          "flex flex-1 items-center gap-3 text-left",
          readOnly && "cursor-default",
        )}
        aria-label={`Selectează pasul ${path}`}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            meta.iconBg,
            meta.iconColor,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.85} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {meta.kindLabel}
            </span>
            {meta.aiBadge && <Badge variant="accent">AI</Badge>}
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{meta.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{meta.subtitle}</p>
        </div>
      </button>
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover/step:opacity-100 focus:opacity-100"
          title="Șterge pasul"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function AddStepRow({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.03] hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> Adaugă pas
      </button>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center text-muted-foreground" aria-hidden>
      <ArrowDown className="h-3.5 w-3.5" />
    </div>
  );
}

function describeStep(step: WorkflowStep): CanvasStepDescriptor {
  if (step.kind === "action") return describeActionStep(step);
  if (step.kind === "ai") return describeAIStep(step);
  if (step.kind === "condition") return describeConditionStep(step);
  if (step.kind === "delay") {
    return {
      icon: Clock,
      iconBg: "bg-foreground/5",
      iconColor: "text-foreground/80",
      kindLabel: "Așteptare",
      title: formatDelay(step.minutes),
      subtitle: "Întârziere între pași",
    };
  }
  return {
    icon: Bot,
    iconBg: "bg-foreground/5",
    iconColor: "text-foreground/80",
    kindLabel: "Necunoscut",
    title: "Pas necunoscut",
    subtitle: "",
  };
}

function formatDelay(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Așteptare nedefinită";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "oră" : "ore"}`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "zi" : "zile"}`;
}
