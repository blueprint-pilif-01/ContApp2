import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Eye,
  Filter as FilterIcon,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { SectionCard } from "../../../components/ui/SectionCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import {
  useDeleteWorkflow,
  useRuns,
  useToggleWorkflow,
  useWorkflows,
} from "../../../lib/automation/storage";
import { lookupTrigger } from "../../../lib/automation/catalog";
import { useCollectionList, useCollectionCreate } from "../../../hooks/useCollection";
import { Drawer } from "../../../components/ui/Drawer";
import { api } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";
import { fmtRelative, cn } from "../../../lib/utils";
import type { Workflow } from "../../../lib/automation/types";

type FilterMode = "all" | "active" | "inactive" | "ai";

interface LegacyRule {
  id: number;
  name: string;
  trigger: "days_before_deadline" | "on_status_change" | "on_create";
  trigger_value: number;
  action: "create_task" | "send_notification" | "send_email";
  applies_to: "contracts" | "tasks" | "hr_leaves";
  enabled: boolean;
  last_run?: string;
  affected_count?: number;
  created_at: string;
}

const legacyTriggerLabels: Record<string, string> = {
  days_before_deadline: "Zile înainte de deadline",
  on_status_change: "La schimbare status",
  on_create: "La creare",
};
const legacyActionLabels: Record<string, string> = {
  create_task: "Crează ticket",
  send_notification: "Trimite notificare",
  send_email: "Trimite email",
};
const legacyEntityLabels: Record<string, string> = {
  contracts: "Contracte",
  tasks: "Tickete",
  hr_leaves: "Concedii HR",
};

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { data: workflows = [], isLoading } = useWorkflows();
  const { data: runs = [] } = useRuns();
  const toggle = useToggleWorkflow();
  const remove = useDeleteWorkflow();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const runCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of runs) map[r.workflow_id] = (map[r.workflow_id] ?? 0) + 1;
    return map;
  }, [runs]);

  const filtered = workflows.filter((w) => {
    if (filter === "active" && !w.enabled) return false;
    if (filter === "inactive" && w.enabled) return false;
    if (filter === "ai" && !w.steps.some((s) => s.kind === "ai")) return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack = `${w.name} ${w.description ?? ""} ${(w.tags ?? []).join(" ")}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow-uri"
        description="Reguli multi-pas cu trigger, condiții, întârzieri și acțiuni AI."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/automations/templates")}>
              <Sparkles className="h-4 w-4" /> Din șablon
            </Button>
            <Button size="sm" onClick={() => navigate("/app/automations/workflows/new")}>
              <Plus className="h-4 w-4" /> Workflow nou
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm">
          <Input
            placeholder="Caută după nume, descriere, etichete..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <SegmentedControl<FilterMode>
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "Toate" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
            { id: "ai", label: "Cu AI" },
          ]}
        />
      </div>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={
            workflows.length === 0
              ? "Niciun workflow încă"
              : "Nu corespunde niciun workflow filtrului curent"
          }
          description={
            workflows.length === 0
              ? "Pornește dintr-un șablon sau construiește unul de la zero — durează un minut."
              : "Schimbă filtrul sau șterge căutarea."
          }
          action={
            workflows.length === 0 ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/app/automations/templates")}>
                  <Sparkles className="h-4 w-4" /> Vezi șabloane
                </Button>
                <Button onClick={() => navigate("/app/automations/workflows/new")}>
                  <Plus className="h-4 w-4" /> Workflow nou
                </Button>
              </div>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((wf) => (
            <WorkflowRow
              key={wf.id}
              workflow={wf}
              runCount={runCounts[wf.id] ?? 0}
              onOpen={() => navigate(`/app/automations/workflows/${wf.id}`)}
              onToggle={() => toggle.mutate(wf.id)}
              onDelete={() => setConfirmDeleteId(wf.id)}
            />
          ))}
        </ul>
      )}

      <LegacyRulesSection />

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Șterge workflow"
        description="Această acțiune nu poate fi anulată. Istoricul rulărilor rămâne."
        confirmLabel="Șterge"
        variant="danger"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) remove.mutate(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}

function WorkflowRow({
  workflow,
  runCount,
  onOpen,
  onToggle,
  onDelete,
}: {
  workflow: Workflow;
  runCount: number;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const trigger = lookupTrigger(workflow.trigger.kind);
  const Icon = trigger.icon;
  const aiStepCount = workflow.steps.reduce((acc, s) => acc + (s.kind === "ai" ? 1 : 0), 0);

  return (
    <li
      className={cn(
        "rounded-2xl border bg-frame transition-colors",
        workflow.enabled ? "border-border" : "border-border/70 opacity-70",
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex flex-1 items-center gap-4 px-4 py-3.5 text-left hover:bg-foreground/[0.02]"
          onClick={onOpen}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              workflow.enabled ? "bg-amber-500/15 text-amber-500" : "bg-foreground/5 text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.85} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {workflow.name}
              </span>
              <Badge variant={workflow.enabled ? "success" : "neutral"}>
                {workflow.enabled ? "Activ" : "Inactiv"}
              </Badge>
              {aiStepCount > 0 && (
                <Badge variant="accent" className="gap-1">
                  <Sparkles className="h-3 w-3" /> AI · {aiStepCount}
                </Badge>
              )}
              {workflow.source === "ai_generated" && (
                <Badge variant="info">Generat AI</Badge>
              )}
              {workflow.source === "template" && <Badge variant="info">Din șablon</Badge>}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {trigger.label} · {workflow.steps.length} pași · {runCount} rulări
            </p>
            {workflow.description && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                {workflow.description}
              </p>
            )}
          </div>
          <div className="hidden text-right text-[11px] text-muted-foreground md:block">
            <p>Actualizat</p>
            <p className="text-foreground/80">{fmtRelative(workflow.updated_at)}</p>
          </div>
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <div className="flex shrink-0 items-center gap-1 border-l border-border px-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              workflow.enabled
                ? "text-amber-500 hover:bg-amber-500/10"
                : "text-emerald-500 hover:bg-emerald-500/10",
            )}
            title={workflow.enabled ? "Dezactivează" : "Activează"}
          >
            {workflow.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
            title="Șterge"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function LegacyRulesSection() {
  const rules = useCollectionList<LegacyRule>("automation-rules", "/automation-rules");
  const create = useCollectionCreate<object, LegacyRule>("automation-rules", "/automation-rules");
  const toggle = useMutation({
    mutationFn: (r: LegacyRule) => api.put(`/automation-rules/${r.id}`, { enabled: !r.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/automation-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<LegacyRule["trigger"]>("days_before_deadline");
  const [newTriggerValue, setNewTriggerValue] = useState(5);
  const [newAction, setNewAction] = useState<LegacyRule["action"]>("send_notification");
  const [newAppliesTo, setNewAppliesTo] = useState<LegacyRule["applies_to"]>("contracts");

  const items = rules.data ?? [];

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate(
      {
        name: newName.trim(),
        trigger: newTrigger,
        trigger_value: newTriggerValue,
        action: newAction,
        applies_to: newAppliesTo,
        enabled: true,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewName("");
        },
      },
    );
  };

  return (
    <>
      <SectionCard
        icon={FilterIcon}
        title="Reguli simple (legacy)"
        description="Regulile vechi cu un singur trigger și o singură acțiune. Salvate pe server, compatibile cu motorul existent."
        padding="sm"
        actions={
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Regulă nouă
          </Button>
        }
      >
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nicio regulă legacy. Creează una pentru reminder-e rapide pe contracte, tickete sau
            concedii.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 px-2 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{rule.name}</span>
                    <Badge variant={rule.enabled ? "success" : "neutral"}>
                      {rule.enabled ? "Activ" : "Inactiv"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Când:</strong> {legacyTriggerLabels[rule.trigger] ?? rule.trigger}
                    {rule.trigger === "days_before_deadline" && ` (${rule.trigger_value} zile)`} ·{" "}
                    <strong>Acțiune:</strong> {legacyActionLabels[rule.action] ?? rule.action} ·{" "}
                    <strong>Pe:</strong> {legacyEntityLabels[rule.applies_to] ?? rule.applies_to}
                  </p>
                  {rule.affected_count !== undefined && (
                    <p className="text-[10px] text-muted-foreground">
                      <Eye className="mr-0.5 inline h-3 w-3" />
                      Afectează {rule.affected_count} elemente
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle.mutate(rule)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      rule.enabled
                        ? "text-amber-500 hover:bg-amber-500/10"
                        : "text-emerald-500 hover:bg-emerald-500/10",
                    )}
                    title={rule.enabled ? "Dezactivează" : "Activează"}
                  >
                    {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(rule.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    title="Șterge"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Regulă nouă"
        description="Configurează un trigger și o acțiune automată (API legacy)."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()} loading={create.isPending}>
              <Plus className="h-4 w-4" /> Crează
            </Button>
          </div>
        }
      >
        <Input
          label="Nume regulă"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex: Reminder 5 zile înainte de deadline"
        />

        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium">Trigger</p>
          <select
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value as LegacyRule["trigger"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="days_before_deadline">Zile înainte de deadline</option>
            <option value="on_status_change">La schimbare status</option>
            <option value="on_create">La creare element</option>
          </select>
        </div>

        {newTrigger === "days_before_deadline" && (
          <div className="mt-3">
            <Input
              label="Câte zile înainte"
              type="number"
              value={String(newTriggerValue)}
              onChange={(e) => setNewTriggerValue(Number(e.target.value) || 1)}
            />
          </div>
        )}

        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium">Acțiune</p>
          <select
            value={newAction}
            onChange={(e) => setNewAction(e.target.value as LegacyRule["action"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="send_notification">Trimite notificare</option>
            <option value="create_task">Crează ticket automat</option>
            <option value="send_email">Trimite email</option>
          </select>
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium">Se aplică pe</p>
          <select
            value={newAppliesTo}
            onChange={(e) => setNewAppliesTo(e.target.value as LegacyRule["applies_to"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="contracts">Contracte</option>
            <option value="tasks">Tickete</option>
            <option value="hr_leaves">Concedii HR</option>
          </select>
        </div>
      </Drawer>
    </>
  );
}
