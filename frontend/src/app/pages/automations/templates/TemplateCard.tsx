import { Plus, Sparkles } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { TEMPLATE_CATEGORIES } from "./catalog";
import { lookupTrigger } from "../../../../lib/automation/catalog";
import type { WorkflowTemplate } from "../../../../lib/automation/types";
import { cn } from "../../../../lib/utils";

export function TemplateCard({
  tpl,
  onPreview,
  onUse,
}: {
  tpl: WorkflowTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const trigger = lookupTrigger(tpl.trigger.kind);
  const Icon = trigger.icon;
  const categoryMeta = TEMPLATE_CATEGORIES.find((c) => c.id === tpl.category);
  return (
    <article
      className={cn(
        "group/tpl flex flex-col rounded-2xl border border-border bg-frame p-4 transition-colors hover:border-foreground/25",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={
            tpl.uses_ai
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-foreground"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500"
          }
        >
          <Icon className="h-4 w-4" strokeWidth={1.85} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tpl.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {categoryMeta && <Badge variant="info">{categoryMeta.label}</Badge>}
        {tpl.uses_ai && (
          <Badge variant="accent" className="gap-1">
            <Sparkles className="h-3 w-3" /> AI
          </Badge>
        )}
        {tpl.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="neutral">
            #{tag}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{tpl.steps.length} pași</span>
        <span>{trigger.label}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
          Previzualizare
        </Button>
        <Button size="sm" className="flex-1" onClick={onUse}>
          <Plus className="h-3.5 w-3.5" /> Folosește
        </Button>
      </div>
    </article>
  );
}
