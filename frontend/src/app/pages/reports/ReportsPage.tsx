import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, Users, FileCheck, Download } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { SectionCard } from "../../../components/ui/SectionCard";
import { StatCard } from "../../../components/ui/StatCard";
import { useCollectionItem } from "../../../hooks/useCollection";

type ReportData = {
  clients_trend: Array<{ month: string; total: number; new: number }>;
  tasks_trend: Array<{ month: string; completed: number; created: number }>;
  contracts_trend: Array<{ month: string; sent: number; signed: number; expired: number }>;
  team_productivity: Array<{ user_id: number; name: string; tasks_completed: number; avg_time_hours: number }>;
};

/* ── Inline SVG mini-chart components ──────────────────────── */
function BarChartSVG({ data, barKey, color = "var(--accent)" }: { data: Array<Record<string, number | string>>; barKey: string; color?: string }) {
  const values = data.map((d) => Number(d[barKey]) || 0);
  const max = Math.max(...values, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox="0 0 100 40" className="w-full h-32" preserveAspectRatio="none">
      {values.map((v, i) => (
        <rect
          key={i}
          x={i * w + w * 0.15}
          y={40 - (v / max) * 36}
          width={w * 0.7}
          height={(v / max) * 36}
          rx={1}
          fill={color}
          opacity={0.8}
        />
      ))}
    </svg>
  );
}

function LineChartSVG({ data, lines }: { data: Array<Record<string, number | string>>; lines: Array<{ key: string; color: string }> }) {
  const maxVal = Math.max(
    ...lines.flatMap((l) => data.map((d) => Number(d[l.key]) || 0)),
    1
  );
  const px = (i: number) => (i / Math.max(data.length - 1, 1)) * 100;
  const py = (v: number) => 40 - (v / maxVal) * 36;

  return (
    <svg viewBox="0 0 100 40" className="w-full h-32" preserveAspectRatio="none">
      {lines.map((line) => {
        const points = data.map((d, i) => `${px(i)},${py(Number(d[line.key]) || 0)}`).join(" ");
        return (
          <g key={line.key}>
            <polyline fill="none" stroke={line.color} strokeWidth={0.8} points={points} />
            {data.map((d, i) => (
              <circle key={i} cx={px(i)} cy={py(Number(d[line.key]) || 0)} r={0.8} fill={line.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const report = useCollectionItem<ReportData>("reports", "/reports/overview");
  const [period, setPeriod] = useState<"30d" | "90d" | "12m">("12m");

  const data: ReportData = report.data ?? {
    clients_trend: [],
    tasks_trend: [],
    contracts_trend: [],
    team_productivity: [],
  };

  // Summary stats
  const summary = useMemo(() => {
    const ct = data.clients_trend;
    const tt = data.tasks_trend;
    const cont = data.contracts_trend;
    return {
      totalClients: ct.length ? ct[ct.length - 1]!.total : 0,
      newClients: ct.reduce((a, c) => a + c.new, 0),
      tasksCompleted: tt.reduce((a, c) => a + c.completed, 0),
      contractsSigned: cont.reduce((a, c) => a + c.signed, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapoarte"
        description="Analytics și trenduri pentru cabinetul tău."
        actions={
          <>
            <SegmentedControl
              value={period}
              onChange={setPeriod}
              options={[
                { id: "30d", label: "30 zile" },
                { id: "90d", label: "90 zile" },
                { id: "12m", label: "12 luni" },
              ]}
            />
            <Button variant="outline">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="CLIENȚI ACTIVI" value={summary.totalClients} trend="up" trendValue={`+${summary.newClients} noi`} />
        <StatCard icon={BarChart3} label="TASKURI FINALIZATE" value={summary.tasksCompleted} trendValue="în perioadă" />
        <StatCard icon={FileCheck} label="CONTRACTE SEMNATE" value={summary.contractsSigned} trend="up" trendValue="în perioadă" />
        <StatCard icon={TrendingUp} label="RATĂ COMPLETARE" value={`${summary.tasksCompleted ? Math.round((summary.tasksCompleted / Math.max(1, data.tasks_trend.reduce((a, c) => a + c.created, 0))) * 100) : 0}%`} trendValue="tasks" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Clienți" description="Evoluție clienți pe luni">
          {data.clients_trend.length > 0 ? (
            <div>
              <LineChartSVG
                data={data.clients_trend}
                lines={[
                  { key: "total", color: "var(--accent)" },
                  { key: "new", color: "#22c55e" },
                ]}
              />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />Total</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Noi</span>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                {data.clients_trend.map((d) => <span key={d.month}>{d.month}</span>)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Fără date</p>
          )}
        </SectionCard>

        <SectionCard title="Taskuri" description="Taskuri create vs finalizate">
          {data.tasks_trend.length > 0 ? (
            <div>
              <LineChartSVG
                data={data.tasks_trend}
                lines={[
                  { key: "created", color: "#f59e0b" },
                  { key: "completed", color: "#22c55e" },
                ]}
              />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Create</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Finalizate</span>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                {data.tasks_trend.map((d) => <span key={d.month}>{d.month}</span>)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Fără date</p>
          )}
        </SectionCard>

        <SectionCard title="Contracte" description="Pipeline contracte pe luni">
          {data.contracts_trend.length > 0 ? (
            <div>
              <BarChartSVG data={data.contracts_trend} barKey="signed" color="#22c55e" />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                {data.contracts_trend.map((d) => <span key={d.month}>{d.month}</span>)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Fără date</p>
          )}
        </SectionCard>

        <SectionCard title="Productivitate echipă" description="Taskuri per membru">
          {data.team_productivity.length > 0 ? (
            <div className="space-y-3">
              {data.team_productivity.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-28 truncate">{m.name}</span>
                  <div className="flex-1 h-5 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--accent)] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.tasks_completed / Math.max(...data.team_productivity.map((x) => x.tasks_completed), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{m.tasks_completed}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Fără date</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
