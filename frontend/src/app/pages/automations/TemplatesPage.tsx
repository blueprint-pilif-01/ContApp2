import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATES,
  type TemplateCategoryId,
} from "./templates/catalog";
import { TemplateCard } from "./templates/TemplateCard";
import { TemplatePreviewDrawer } from "./templates/TemplatePreviewDrawer";
import {
  generateId,
  useSaveWorkflow,
} from "../../../lib/automation/storage";
import type {
  Workflow,
  WorkflowTemplate,
} from "../../../lib/automation/types";

type FilterId = TemplateCategoryId | "all" | "ai";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const saveMutation = useSaveWorkflow();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [previewing, setPreviewing] = useState<WorkflowTemplate | null>(null);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (filter === "ai" && !t.uses_ai) return false;
      if (filter !== "all" && filter !== "ai" && t.category !== filter) return false;
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = `${t.name} ${t.description} ${t.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filter, search]);

  const handleUse = (tpl: WorkflowTemplate) => {
    const workflow: Workflow = {
      id: generateId("wf"),
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
    saveMutation.mutate(workflow, {
      onSuccess: (saved) => navigate(`/app/automations/workflows/${saved.id}`),
    });
  };

  const filterOptions: { id: FilterId; label: string }[] = [
    { id: "all", label: "Toate" },
    { id: "ai", label: "AI" },
    ...TEMPLATE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Șabloane"
        description={`${TEMPLATES.length} fluxuri pre-construite. Pornește în 30 de secunde.`}
        actions={
          <Button size="sm" onClick={() => navigate("/app/automations/workflows/new")}>
            <Plus className="h-4 w-4" /> Pornește gol
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm">
          <Input
            placeholder="Caută în cele 20+ șabloane..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="overflow-x-auto">
          <SegmentedControl<FilterId>
            value={filter}
            onChange={setFilter}
            options={filterOptions}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Niciun șablon nu corespunde"
          description="Schimbă filtrul sau șterge căutarea."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onPreview={() => setPreviewing(tpl)}
              onUse={() => handleUse(tpl)}
            />
          ))}
        </div>
      )}

      <TemplatePreviewDrawer
        open={previewing !== null}
        tpl={previewing}
        onClose={() => setPreviewing(null)}
        onUse={(t) => {
          handleUse(t);
          setPreviewing(null);
        }}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
