import { Filter as FilterIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";
import type { WorkflowStep } from "../../../../lib/automation/types";
import type { CanvasStepDescriptor } from "./stepDescriptor";

export function describeConditionStep(step: WorkflowStep & { kind: "condition" }): CanvasStepDescriptor {
  return {
    icon: FilterIcon,
    iconBg: "bg-foreground/5",
    iconColor: "text-foreground/80",
    kindLabel: "Condiție",
    title: step.expr.trim() || "Fără expresie",
    subtitle: `${step.then.length} pași Atunci · ${step.else.length} pași Altfel`,
  };
}

export function BranchColumn({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "then" | "else";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 bg-foreground/[0.02] p-3",
        tone === "then" ? "border-emerald-500/45" : "border-amber-500/45",
      )}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
