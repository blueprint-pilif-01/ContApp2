import { ChevronRight } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import { cn } from "../../../../lib/utils";
import { lookupTrigger } from "../../../../lib/automation/catalog";
import type { Workflow } from "../../../../lib/automation/types";

export function TriggerNode({
  workflow,
  active,
  readOnly = false,
  onClick,
}: {
  workflow: Workflow;
  active: boolean;
  readOnly?: boolean;
  onClick: () => void;
}) {
  const trigger = lookupTrigger(workflow.trigger.kind);
  const Icon = trigger.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={readOnly}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-frame px-4 py-3 text-left transition-colors",
        active
          ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/30"
          : "border-border hover:border-foreground/30",
        readOnly && "cursor-default hover:border-border",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trigger
          </span>
          {trigger.aiPowered && <Badge variant="accent">AI</Badge>}
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{trigger.label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{trigger.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
