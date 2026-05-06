import { Plus } from "lucide-react";
import { Drawer } from "../../../../components/ui/Drawer";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { WorkflowCanvas } from "../builder/WorkflowCanvas";
import type { Workflow, WorkflowTemplate } from "../../../../lib/automation/types";

function TemplatePreviewBody({ tpl }: { tpl: WorkflowTemplate }) {
  const dummyWorkflow: Workflow = {
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    enabled: false,
    trigger: tpl.trigger,
    steps: tpl.steps,
    tags: tpl.tags,
    source: "template",
    template_id: tpl.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Etichete
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tpl.tags.map((t) => (
            <Badge key={t} variant="neutral">
              #{t}
            </Badge>
          ))}
        </div>
      </div>
      <WorkflowCanvas
        workflow={dummyWorkflow}
        selectedPath={null}
        onSelectStep={() => {}}
        onSelectTrigger={() => {}}
        onAddStep={() => {}}
        onRemoveStep={() => {}}
        readOnly
      />
    </div>
  );
}

export function TemplatePreviewDrawer({
  open,
  tpl,
  onClose,
  onUse,
  loading,
}: {
  open: boolean;
  tpl: WorkflowTemplate | null;
  onClose: () => void;
  onUse: (tpl: WorkflowTemplate) => void;
  loading?: boolean;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={tpl?.name}
      description={tpl?.description}
      width="lg"
      footer={
        tpl && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              {tpl.steps.length} pași · {tpl.uses_ai ? "Cu AI" : "Fără AI"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Închide
              </Button>
              <Button
                onClick={() => onUse(tpl)}
                {...(loading !== undefined ? { loading } : {})}
              >
                <Plus className="h-4 w-4" /> Folosește acest șablon
              </Button>
            </div>
          </div>
        )
      }
    >
      {tpl && <TemplatePreviewBody tpl={tpl} />}
    </Drawer>
  );
}
