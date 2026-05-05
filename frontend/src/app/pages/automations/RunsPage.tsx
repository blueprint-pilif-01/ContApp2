import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Select } from "../../../components/ui/Select";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useRuns, useWorkflows } from "../../../lib/automation/storage";
import { fmtRelative } from "../../../lib/utils";
import type { WorkflowRun } from "../../../lib/automation/types";
import { RunDetailDrawer } from "./RunDetailDrawer";

export default function RunsPage() {
  const { data: runs = [], isLoading } = useRuns();
  const { data: workflows = [] } = useWorkflows();
  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  const filtered = useMemo(() => {
    return runs.filter((r) => {
      if (workflowFilter && r.workflow_id !== workflowFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (fromDate) {
        const start = new Date(fromDate).getTime();
        if (Number.isFinite(start) && new Date(r.started_at).getTime() < start) return false;
      }
      if (search.trim()) {
        const n = search.trim().toLowerCase();
        const hay = `${r.workflow_name} ${r.id}`.toLowerCase();
        if (!hay.includes(n)) return false;
      }
      return true;
    });
  }, [runs, workflowFilter, statusFilter, fromDate, search]);

  const wfOptions = workflows.map((w) => ({ value: w.id, label: w.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Istoric rulări"
        description="Jurnal de execuție cu pași, erori și ieșiri AI (când există)."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Caută după workflow sau ID rulare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          label="Workflow"
          placeholder="Toate"
          value={workflowFilter}
          onChange={(e) => setWorkflowFilter(e.target.value)}
          options={[{ value: "", label: "Toate workflow-urile" }, ...wfOptions]}
        />
        <Select
          label="Status"
          placeholder="Orice"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "Orice status" },
            { value: "running", label: "În rulare" },
            { value: "success", label: "Succes" },
            { value: "error", label: "Eroare" },
            { value: "skipped", label: "Sărit" },
          ]}
        />
      </div>

      <div className="max-w-xs">
        <Input
          label="De la dată"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nicio rulare nu corespunde filtrelor"
          description="Schimbă filtrele sau pornește un workflow de test din builder."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-frame">
          {filtered.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03] sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setSelectedRun(run)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {run.workflow_name}
                    </span>
                    <RunStatusBadge status={run.status} />
                    {run.id.startsWith("run_seed_") && (
                      <Badge variant="neutral" className="text-[10px]">
                        Exemplu
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtRelative(run.started_at)} · {run.steps.length} pași
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[color:var(--accent)] sm:self-center">
                  Inspectează →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <RunDetailDrawer
        open={selectedRun !== null}
        run={selectedRun}
        onClose={() => setSelectedRun(null)}
      />
    </div>
  );
}

function RunStatusBadge({ status }: { status: WorkflowRun["status"] }) {
  if (status === "running") return <Badge variant="info">În rulare</Badge>;
  if (status === "success") return <Badge variant="success">Succes</Badge>;
  if (status === "error") return <Badge variant="danger">Eroare</Badge>;
  return <Badge variant="neutral">Sărit</Badge>;
}
