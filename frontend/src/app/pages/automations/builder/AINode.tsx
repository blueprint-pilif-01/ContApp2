import { lookupAIAction } from "../../../../lib/automation/catalog";
import type { WorkflowStep } from "../../../../lib/automation/types";
import type { CanvasStepDescriptor } from "./stepDescriptor";

export function describeAIStep(step: WorkflowStep & { kind: "ai" }): CanvasStepDescriptor {
  const meta = lookupAIAction(step.action);
  return {
    icon: meta.icon,
    iconBg: "bg-[color:var(--accent)]/15",
    iconColor: "text-foreground",
    kindLabel: "Acțiune AI",
    title: meta.label,
    subtitle: meta.description,
    aiBadge: true,
  };
}
