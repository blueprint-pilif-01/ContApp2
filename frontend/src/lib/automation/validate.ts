import type { Workflow, WorkflowStep } from "./types";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  step_path?: string;
}

export function validateWorkflow(wf: Workflow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!wf.name.trim()) {
    issues.push({ severity: "error", message: "Numele workflow-ului este obligatoriu." });
  }
  if (!wf.trigger?.kind) {
    issues.push({ severity: "error", message: "Selectează un trigger." });
  }
  if (wf.steps.length === 0) {
    issues.push({
      severity: "warning",
      message: "Workflow-ul nu are niciun pas — nu va produce efecte.",
    });
  }
  walk(wf.steps, "0", issues);
  return issues;
}

function walk(steps: WorkflowStep[], pathPrefix: string, issues: ValidationIssue[]) {
  steps.forEach((step, i) => {
    const path = `${pathPrefix}.${i}`;
    if (step.kind === "delay" && (!Number.isFinite(step.minutes) || step.minutes <= 0)) {
      issues.push({
        severity: "error",
        message: "Pasul de așteptare trebuie să aibă o durată pozitivă.",
        step_path: path,
      });
    }
    if (step.kind === "condition") {
      if (!step.expr.trim()) {
        issues.push({
          severity: "warning",
          message: "Condiția nu are expresie definită — va fi tratată ca true.",
          step_path: path,
        });
      }
      walk(step.then, `${path}.then`, issues);
      walk(step.else, `${path}.else`, issues);
    }
  });
}

export function isValid(issues: ValidationIssue[]): boolean {
  return !issues.some((i) => i.severity === "error");
}
