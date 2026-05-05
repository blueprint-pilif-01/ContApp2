import { Bot } from "lucide-react";
import { Drawer } from "../../../components/ui/Drawer";
import { Badge } from "../../../components/ui/Badge";
import { fmtRelative } from "../../../lib/utils";
import type { WorkflowRun } from "../../../lib/automation/types";

export function RunDetailDrawer({
  open,
  run,
  onClose,
}: {
  open: boolean;
  run: WorkflowRun | null;
  onClose: () => void;
}) {
  if (!run) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={run.workflow_name}
      description={`Început ${fmtRelative(run.started_at)} · ${run.steps.length} pași`}
      width="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StepStatusBadge status={run.status} />
          {run.id.startsWith("run_seed_") && (
            <Badge variant="neutral" className="text-[10px]">
              Date exemplu — nu provin de la AI
            </Badge>
          )}
          {run.finished_at && (
            <span className="text-[11px] text-muted-foreground">
              Finalizat {fmtRelative(run.finished_at)}
            </span>
          )}
        </div>

        <ol className="space-y-3">
          {run.steps.map((step, idx) => (
            <li
              key={`${run.id}-${step.step_path}-${idx}`}
              className="rounded-xl border border-border bg-background p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pas {step.step_index + 1}
                </span>
                <Badge variant="neutral" className="text-[10px]">
                  {step.kind}
                </Badge>
                <StepStatusBadge status={step.status} />
              </div>
              {step.log && (
                <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{step.log}</p>
              )}
              {step.error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {step.error}
                </p>
              )}
              {step.kind === "ai" && (
                <div className="mt-2 rounded-lg border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/5 p-2">
                  <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Bot className="h-3 w-3" /> Ieșire AI
                  </p>
                  {step.ai_output ? (
                    <p className="text-xs text-foreground whitespace-pre-wrap">{step.ai_output}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nu există ieșire înregistrată pentru acest pas (motorul sau backend-ul nu au
                      populat încă câmpul).
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Drawer>
  );
}

function StepStatusBadge({ status }: { status: WorkflowRun["steps"][number]["status"] }) {
  if (status === "running") return <Badge variant="info">În rulare</Badge>;
  if (status === "success") return <Badge variant="success">Succes</Badge>;
  if (status === "error") return <Badge variant="danger">Eroare</Badge>;
  return <Badge variant="neutral">Sărit</Badge>;
}
