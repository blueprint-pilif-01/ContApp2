import { useMemo } from "react";
import { BarChart3, Bot, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { useRuns, useWorkflows } from "../../../lib/automation/storage";
import { cn } from "../../../lib/utils";

export default function InsightsPage() {
  const { data: runs = [] } = useRuns();
  const { data: wfList = [] } = useWorkflows();

  const stats = useMemo(() => {
    const total = runs.length;
    const ok = runs.filter((r) => r.status === "success").length;
    const err = runs.filter((r) => r.status === "error").length;
    const rate = total ? Math.round((ok / total) * 100) : 0;
    const aiSteps = runs.reduce(
      (acc, r) => acc + r.steps.filter((s) => s.kind === "ai").length,
      0,
    );
    const minutesSaved = Math.round(total * 4.5 + aiSteps * 1.8);

    const byWorkflow = new Map<string, { name: string; count: number }>();
    for (const r of runs) {
      const cur = byWorkflow.get(r.workflow_id) ?? { name: r.workflow_name, count: 0 };
      cur.count += 1;
      byWorkflow.set(r.workflow_id, cur);
    }
    const top = [...byWorkflow.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxTop = top[0]?.count ?? 1;

    return { total, ok, err, rate, aiSteps, minutesSaved, top, maxTop };
  }, [runs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="Agregări din rulările locale și workflow-uri — pregătite pentru raportare backend."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Rulări totale"
          value={stats.total}
          hint={`${stats.err} eșuate`}
          accent="brand"
        />
        <StatCard
          icon={CheckCircle2}
          label="Rată succes"
          value={`${stats.rate}%`}
          hint={`${stats.ok} reușite`}
          accent={stats.rate >= 85 ? "success" : "warning"}
        />
        <StatCard
          icon={Bot}
          label="Pași AI în istoric"
          value={stats.aiSteps}
          hint="După tip pas"
          accent="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Timp economisit (estimat)"
          value={`${stats.minutesSaved} min`}
          hint="Heuristică simplă"
          accent="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={BarChart3}
          title="Top workflow-uri după volum"
          description="Bazat pe istoricul rulărilor din acest browser."
          padding="sm"
        >
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-4">
              Nu există suficiente rulări pentru un top.
            </p>
          ) : (
            <ul className="space-y-3 px-1 py-1">
              {stats.top.map((row) => (
                <li key={row.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate font-medium text-foreground">{row.name}</span>
                    <span className="shrink-0 text-muted-foreground">{row.count} rulări</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-[color:var(--accent)]"
                      style={{ width: `${Math.max(8, (row.count / stats.maxTop) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={Zap}
          title="Acoperire catalog"
          description="Workflow-uri definite local și diversitate de trigger-e."
          padding="sm"
        >
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Workflow-uri definite</span>
              <span className="font-semibold">{wfList.length}</span>
            </li>
            <li className="flex justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Tipuri de trigger folosite</span>
              <span className="font-semibold">
                {wfList.length === 0
                  ? "—"
                  : new Set(wfList.map((w) => w.trigger.kind)).size}
              </span>
            </li>
            <li className="flex justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Workflow-uri active</span>
              <span className="font-semibold">{wfList.filter((w) => w.enabled).length}</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Pentru rapoarte organizaționale complete, se va conecta motorul de execuție backend.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        icon={BarChart3}
        title="Distribuție status rulări"
        description="Bare proporționale (fără librărie externă)."
        padding="sm"
      >
        <HorizontalBar label="Succes" value={stats.ok} total={stats.total || 1} tone="success" />
        <HorizontalBar label="Eroare" value={stats.err} total={stats.total || 1} tone="danger" />
        <HorizontalBar
          label="În rulare / altele"
          value={Math.max(0, stats.total - stats.ok - stats.err)}
          total={stats.total || 1}
          tone="neutral"
        />
      </SectionCard>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "success" | "danger" | "neutral";
}) {
  const pct = Math.round((value / total) * 100);
  const bar =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "danger"
        ? "bg-red-500"
        : "bg-foreground/35";
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} ({pct}%)
        </span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full bg-foreground/10")}>
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
