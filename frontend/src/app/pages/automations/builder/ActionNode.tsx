import { lookupAction } from "../../../../lib/automation/catalog";
import type { WorkflowStep } from "../../../../lib/automation/types";
import type { CanvasStepDescriptor } from "./stepDescriptor";

export function describeActionStep(step: WorkflowStep & { kind: "action" }): CanvasStepDescriptor {
  const meta = lookupAction(step.type);
  return {
    icon: meta.icon,
    iconBg: "bg-foreground/5",
    iconColor: "text-foreground/80",
    kindLabel: "Acțiune",
    title: meta.label,
    subtitle: meta.description,
  };
}
