import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { WorkflowCanvas } from "./builder/WorkflowCanvas";
import { StepInspector } from "./builder/StepInspector";
import {
  ActionPicker,
  type ActionPickerChoice,
} from "./builder/ActionPicker";
import {
  generateId,
  useDeleteWorkflow,
  useRecordRun,
  useSaveWorkflow,
  useWorkflow,
} from "../../../lib/automation/storage";
import { isValid, validateWorkflow } from "../../../lib/automation/validate";
import type {
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowStep,
  WorkflowTrigger,
} from "../../../lib/automation/types";

const EMPTY_TRIGGER: WorkflowTrigger = {
  kind: "days_before_deadline",
  entity: "contracts",
  config: { days: 3 },
};

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const { data: existing, isLoading } = useWorkflow(isNew ? undefined : id);
  const saveMutation = useSaveWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const recordRun = useRecordRun();

  const [draft, setDraft] = useState<Workflow | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pickerForPath, setPickerForPath] = useState<{ parentPath: string; index: number } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedFlash, setSavedFlash] = useState<null | "saved" | "tested">(null);

  useEffect(() => {
    if (isNew) {
      setDraft({
        id: generateId("wf"),
        name: "Workflow nou",
        description: "",
        enabled: false,
        trigger: { ...EMPTY_TRIGGER },
        steps: [],
        tags: [],
        source: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setSelectedPath("trigger");
    } else if (existing) {
      setDraft(existing);
    }
  }, [isNew, existing]);

  const issues = useMemo(() => (draft ? validateWorkflow(draft) : []), [draft]);
  const valid = isValid(issues);

  if (isLoading || !draft) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Se încarcă...</div>;
  }

  const selection = ((): React.ComponentProps<typeof StepInspector>["selection"] => {
    if (!selectedPath) return null;
    if (selectedPath === "trigger") return { kind: "trigger" };
    const step = stepAtPath(draft.steps, selectedPath);
    if (!step) return null;
    return { kind: "step", path: selectedPath, step };
  })();

  const update = (patch: Partial<Workflow>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev));
  };

  const handleAddStep = (choice: ActionPickerChoice) => {
    if (!pickerForPath) return;
    const newStep = createStepFromChoice(choice);
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.steps];
      const updated = insertStepAt(next, pickerForPath.parentPath, pickerForPath.index, newStep);
      return { ...prev, steps: updated, updated_at: new Date().toISOString() };
    });
    setPickerForPath(null);
    setSelectedPath(stepPath(pickerForPath.parentPath, pickerForPath.index));
  };

  const handleRemoveStep = (path: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updated = removeStepAt(prev.steps, path);
      return { ...prev, steps: updated, updated_at: new Date().toISOString() };
    });
    if (selectedPath === path) setSelectedPath(null);
  };

  const handleChangeStep = (path: string, next: WorkflowStep) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updated = setStepAt(prev.steps, path, next);
      return { ...prev, steps: updated, updated_at: new Date().toISOString() };
    });
  };

  const handleSave = () => {
    if (!draft || !valid) return;
    saveMutation.mutate(draft, {
      onSuccess: (saved) => {
        setSavedFlash("saved");
        setTimeout(() => setSavedFlash(null), 2200);
        if (isNew) navigate(`/app/automations/workflows/${saved.id}`, { replace: true });
      },
    });
  };

  const handleTestRun = () => {
    if (!draft) return;
    const startedAt = new Date();
    const steps: WorkflowRunStep[] = collectSteps(draft.steps).map((entry, idx) => ({
      step_index: idx,
      step_path: entry.path,
      kind: entry.step.kind,
      status: "success",
      started_at: new Date(startedAt.getTime() + idx * 200).toISOString(),
      finished_at: new Date(startedAt.getTime() + idx * 200 + 180).toISOString(),
    }));
    const run: WorkflowRun = {
      id: generateId("run"),
      workflow_id: draft.id,
      workflow_name: draft.name,
      trigger_label: `${draft.trigger.kind} (test)`,
      started_at: startedAt.toISOString(),
      finished_at: new Date(startedAt.getTime() + Math.max(steps.length, 1) * 220).toISOString(),
      status: "success",
      steps,
    };
    recordRun.mutate(run);
    setSavedFlash("tested");
    setTimeout(() => setSavedFlash(null), 2200);
  };

  const handleDelete = () => {
    if (!draft) return;
    deleteMutation.mutate(draft.id, {
      onSuccess: () => navigate("/app/automations/workflows"),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/app/automations/workflows")}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              aria-label="Înapoi la lista de workflow-uri"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="truncate">{draft.name || "Workflow nou"}</span>
            {draft.source === "ai_generated" && (
              <Badge variant="accent" className="gap-1">
                <Sparkles className="h-3 w-3" /> Generat AI
              </Badge>
            )}
            {draft.source === "template" && <Badge variant="info">Din șablon</Badge>}
          </span>
        }
        description="Builder vizual: configurează triggerul și pașii. Salvează când ești gata."
        actions={
          <>
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Șterge
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleTestRun}>
              <PlayCircle className="h-4 w-4" /> Rulează test
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!valid} loading={saveMutation.isPending}>
              <Save className="h-4 w-4" /> Salvează
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-frame p-4">
            <Input
              label="Nume"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Ex.: Reminder 3 zile înainte de expirare contract"
            />
            <div className="mt-3" />
            <Textarea
              label="Descriere"
              value={draft.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              placeholder="Pe scurt: ce face workflow-ul și pentru cine."
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <button
                type="button"
                onClick={() => update({ enabled: !draft.enabled })}
                className={
                  draft.enabled
                    ? "rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                    : "rounded-lg border border-border bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {draft.enabled ? "Activ" : "Inactiv (draft)"}
              </button>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {draft.steps.length} pași
              </span>
            </div>
          </div>

          <ValidationBanner issues={issues} />

          <WorkflowCanvas
            workflow={draft}
            selectedPath={selectedPath}
            onSelectStep={(path) => setSelectedPath(path)}
            onSelectTrigger={() => setSelectedPath("trigger")}
            onAddStep={(parentPath, index) => setPickerForPath({ parentPath, index })}
            onRemoveStep={handleRemoveStep}
          />
        </div>

        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="rounded-2xl border border-border bg-frame p-4">
            <StepInspector
              workflow={draft}
              selection={selection}
              onChangeTrigger={(next) => update({ trigger: next })}
              onChangeStep={handleChangeStep}
              onClose={() => setSelectedPath(null)}
            />
          </div>
        </aside>
      </div>

      {savedFlash && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {savedFlash === "saved" ? "Salvat" : "Test rulat — vezi în Istoric rulări"}
          </div>
        </div>
      )}

      <Drawer
        open={pickerForPath !== null}
        onClose={() => setPickerForPath(null)}
        title="Adaugă pas"
        description="Alege o acțiune, o acțiune AI, o condiție sau o așteptare."
        width="lg"
      >
        <ActionPicker onSelect={handleAddStep} />
      </Drawer>

      <ConfirmModal
        open={confirmDelete}
        title="Șterge workflow"
        description="Această acțiune nu poate fi anulată. Istoricul rulărilor rămâne."
        confirmLabel="Șterge"
        variant="danger"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          handleDelete();
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}

function ValidationBanner({
  issues,
}: {
  issues: ReturnType<typeof validateWorkflow>;
}) {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  if (errors.length === 0 && warnings.length === 0) return null;
  return (
    <div className="space-y-1.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
      <p className="inline-flex items-center gap-1.5 font-semibold">
        <AlertTriangle className="h-3.5 w-3.5" />
        {errors.length > 0
          ? `${errors.length} ${errors.length === 1 ? "eroare" : "erori"}`
          : `${warnings.length} ${warnings.length === 1 ? "avertisment" : "avertismente"}`}
      </p>
      <ul className="space-y-0.5 pl-5 [list-style:disc]">
        {[...errors, ...warnings].map((i, idx) => (
          <li key={idx}>{i.message}</li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────── Step path helpers ─────────────────────────

function stepPath(parent: string, index: number): string {
  return parent === "root" ? `${index}` : `${parent}.${index}`;
}

function stepAtPath(steps: WorkflowStep[], path: string): WorkflowStep | null {
  // Path forms:
  //   "<i>"                              top-level index i
  //   "<i>.then.<j>", "<i>.else.<j>"     branch indices
  //   nested: "0.then.1.then.2"
  //
  // Note: when the path comes from WorkflowCanvas it is prefixed with
  // "root.<i>" / "<parent>.then.<j>"; we strip "root." here so callers can
  // freely pass either form.
  const normalized = path.startsWith("root.") ? path.slice(5) : path;
  const segments = normalized.split(".");
  let current: WorkflowStep[] | null = steps;
  let result: WorkflowStep | null = null;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === undefined) return null;
    if (seg === "then" || seg === "else") {
      if (result?.kind !== "condition") return null;
      current = seg === "then" ? result.then : result.else;
      continue;
    }
    const idx = Number.parseInt(seg, 10);
    if (Number.isNaN(idx) || !current) return null;
    result = current[idx] ?? null;
    if (!result) return null;
    current = null;
  }
  return result;
}

function setStepAt(steps: WorkflowStep[], path: string, next: WorkflowStep): WorkflowStep[] {
  const normalized = path.startsWith("root.") ? path.slice(5) : path;
  const segments = normalized.split(".");
  return mutate(steps, segments);
  function mutate(list: WorkflowStep[], segs: string[]): WorkflowStep[] {
    if (segs.length === 1) {
      const head = segs[0];
      if (head === undefined) return list;
      const idx = Number.parseInt(head, 10);
      const out = [...list];
      out[idx] = next;
      return out;
    }
    if (segs[0] === "then" || segs[0] === "else") return list; // unreachable as first
    const head = segs[0];
    const branchToken = segs[1];
    if (head === undefined || branchToken === undefined) return list;
    const idx = Number.parseInt(head, 10);
    const target = list[idx];
    if (!target || target.kind !== "condition") return list;
    const branchKey = branchToken as "then" | "else";
    const restAfter = segs.slice(2);
    const branch = branchKey === "then" ? target.then : target.else;
    const newBranch = mutate(branch, restAfter);
    const newCond: WorkflowStep = { ...target, [branchKey]: newBranch };
    const out = [...list];
    out[idx] = newCond;
    return out;
  }
}

function removeStepAt(steps: WorkflowStep[], path: string): WorkflowStep[] {
  const normalized = path.startsWith("root.") ? path.slice(5) : path;
  const segments = normalized.split(".");
  return mutate(steps, segments);
  function mutate(list: WorkflowStep[], segs: string[]): WorkflowStep[] {
    if (segs.length === 1) {
      const head = segs[0];
      if (head === undefined) return list;
      const idx = Number.parseInt(head, 10);
      return list.filter((_, i) => i !== idx);
    }
    const head = segs[0];
    const branchToken = segs[1];
    if (head === undefined || branchToken === undefined) return list;
    const idx = Number.parseInt(head, 10);
    const target = list[idx];
    if (!target || target.kind !== "condition") return list;
    const branchKey = branchToken as "then" | "else";
    const restAfter = segs.slice(2);
    const branch = branchKey === "then" ? target.then : target.else;
    const newBranch = mutate(branch, restAfter);
    const newCond: WorkflowStep = { ...target, [branchKey]: newBranch };
    const out = [...list];
    out[idx] = newCond;
    return out;
  }
}

function insertStepAt(
  steps: WorkflowStep[],
  parentPath: string,
  index: number,
  newStep: WorkflowStep,
): WorkflowStep[] {
  if (parentPath === "root") {
    const out = [...steps];
    out.splice(index, 0, newStep);
    return out;
  }
  const normalized = parentPath.startsWith("root.") ? parentPath.slice(5) : parentPath;
  const segments = normalized.split(".");
  return mutate(steps, segments);
  function mutate(list: WorkflowStep[], segs: string[]): WorkflowStep[] {
    if (segs.length === 0) {
      const out = [...list];
      out.splice(index, 0, newStep);
      return out;
    }
    if (segs[0] === "then" || segs[0] === "else") return list;
    const head = segs[0];
    const branchToken = segs[1];
    if (head === undefined || branchToken === undefined) return list;
    const idx = Number.parseInt(head, 10);
    const target = list[idx];
    if (!target || target.kind !== "condition") return list;
    const branchKey = branchToken as "then" | "else";
    const restAfter = segs.slice(2);
    const branch = branchKey === "then" ? target.then : target.else;
    const newBranch =
      restAfter.length === 0
        ? insertAt(branch, index, newStep)
        : mutate(branch, restAfter);
    const newCond: WorkflowStep = { ...target, [branchKey]: newBranch };
    const out = [...list];
    out[idx] = newCond;
    return out;
  }
  function insertAt(list: WorkflowStep[], at: number, item: WorkflowStep) {
    const out = [...list];
    out.splice(at, 0, item);
    return out;
  }
}

function collectSteps(
  steps: WorkflowStep[],
  parentPath = "root",
): { step: WorkflowStep; path: string }[] {
  const out: { step: WorkflowStep; path: string }[] = [];
  steps.forEach((s, i) => {
    const path = parentPath === "root" ? `${i}` : `${parentPath}.${i}`;
    out.push({ step: s, path });
    if (s.kind === "condition") {
      out.push(...collectSteps(s.then, `${path}.then`));
      out.push(...collectSteps(s.else, `${path}.else`));
    }
  });
  return out;
}

function createStepFromChoice(choice: ActionPickerChoice): WorkflowStep {
  if (choice.kind === "condition") {
    return { id: generateId("step"), kind: "condition", expr: "", then: [], else: [] };
  }
  if (choice.kind === "delay") {
    return { id: generateId("step"), kind: "delay", minutes: 60 };
  }
  if (choice.kind === "ai") {
    return { id: generateId("step"), kind: "ai", action: choice.action, config: {} };
  }
  return { id: generateId("step"), kind: "action", type: choice.type, config: {} };
}
