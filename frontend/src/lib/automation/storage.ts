import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Workflow, WorkflowRun } from "./types";
import { seedRunsForWorkflows } from "./seed";

/** Matches brief `automation:workflows:<orgId>` — scoped per browser/org hint. */
const STORAGE_KEY_PREFIX = "automation:workflows";
const RUNS_KEY_PREFIX = "automation:runs";
const ORG_KEY_FALLBACK = "default";

function orgKey(): string {
  // Best-effort org scoping. The /me payload isn't used here directly to
  // avoid a hook dependency from non-component files; the workflows live in
  // localStorage anyway and are scoped per-browser.
  if (typeof window === "undefined") return ORG_KEY_FALLBACK;
  const cached = window.localStorage.getItem("contapp:active-org-id");
  return cached?.trim() || ORG_KEY_FALLBACK;
}

function workflowsStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}:${orgKey()}`;
}

function runsStorageKey(): string {
  return `${RUNS_KEY_PREFIX}:${orgKey()}`;
}

function readWorkflows(): Workflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(workflowsStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Workflow[];
  } catch {
    return [];
  }
}

function writeWorkflows(items: Workflow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(workflowsStorageKey(), JSON.stringify(items));
}

function readRuns(): WorkflowRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(runsStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WorkflowRun[];
  } catch {
    return [];
  }
}

function writeRuns(items: WorkflowRun[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(runsStorageKey(), JSON.stringify(items));
}

export function generateId(prefix = "wf"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const WORKFLOWS_QUERY_KEY = ["automation", "workflows"] as const;
export const RUNS_QUERY_KEY = ["automation", "runs"] as const;

export function useWorkflows() {
  return useQuery<Workflow[]>({
    queryKey: WORKFLOWS_QUERY_KEY,
    queryFn: async () => readWorkflows(),
    staleTime: 1000,
  });
}

export function useWorkflow(id: string | undefined) {
  return useQuery<Workflow | undefined>({
    queryKey: ["automation", "workflows", id ?? "_none"],
    queryFn: async () => readWorkflows().find((w) => w.id === id),
    enabled: !!id,
  });
}

export function useSaveWorkflow() {
  const qc = useQueryClient();
  return useMutation<Workflow, unknown, Workflow>({
    mutationFn: async (wf) => {
      const items = readWorkflows();
      const existingIndex = items.findIndex((w) => w.id === wf.id);
      const prevCreated =
        existingIndex >= 0 ? items[existingIndex]?.created_at : undefined;
      const next: Workflow = {
        ...wf,
        updated_at: new Date().toISOString(),
        created_at: prevCreated ?? wf.created_at,
      };
      if (existingIndex >= 0) items[existingIndex] = next;
      else items.unshift(next);
      writeWorkflows(items);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      const items = readWorkflows().filter((w) => w.id !== id);
      writeWorkflows(items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    },
  });
}

export function useToggleWorkflow() {
  const qc = useQueryClient();
  return useMutation<Workflow | null, unknown, string>({
    mutationFn: async (id) => {
      const items = readWorkflows();
      const idx = items.findIndex((w) => w.id === id);
      if (idx < 0) return null;
      const cur = items[idx];
      if (!cur) return null;
      const toggled: Workflow = {
        ...cur,
        enabled: !cur.enabled,
        updated_at: new Date().toISOString(),
      };
      items[idx] = toggled;
      writeWorkflows(items);
      return toggled;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    },
  });
}

export function useRuns() {
  return useQuery<WorkflowRun[]>({
    queryKey: RUNS_QUERY_KEY,
    queryFn: async () => {
      const stored = readRuns();
      if (stored.length > 0) return stored;
      // No persisted runs yet: derive demo runs from current workflows so the
      // Runs / Insights pages have something to render. These are clearly
      // labelled "Exemplu" inside the run row UI.
      const seeded = seedRunsForWorkflows(readWorkflows());
      writeRuns(seeded);
      return seeded;
    },
  });
}

export function useClearRuns() {
  const qc = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: async () => writeRuns([]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RUNS_QUERY_KEY });
    },
  });
}

/** Used by manual_trigger / "Test run" buttons in the builder. */
export function useRecordRun() {
  const qc = useQueryClient();
  return useMutation<WorkflowRun, unknown, WorkflowRun>({
    mutationFn: async (run) => {
      const items = readRuns();
      items.unshift(run);
      writeRuns(items.slice(0, 200));
      return run;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RUNS_QUERY_KEY });
    },
  });
}
