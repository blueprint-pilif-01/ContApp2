import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  ListChecks,
  MailWarning,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton, SkeletonList } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/EmptyState";
import { useCollectionItem } from "../../hooks/useCollection";
import { useMe } from "../../hooks/useMe";
import { fmtRelative, fmtDate, cn } from "../../lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type DashboardOverview = {
  kpis: {
    clients: number;
    clients_new_this_month: number;
    invites_active: number;
    invites_expiring_soon: number;
    submissions_total: number;
    submissions_this_month: number;
    tasks_open: number;
    tasks_overdue: number;
    tasks_due_today: number;
  };
  contract_pipeline: {
    draft: number;
    sent: number;
    viewed: number;
    signed: number;
    expired: number;
  };
  urgent_items: Array<{
    id: string;
    type: "expiring_invite" | "overdue_task" | "blocked_task" | "unsigned_invite";
    title: string;
    detail: string;
    due: string;
    link: string;
  }>;
  recent_activity: Array<{
    id: string;
    label: string;
    at: string;
    type: string;
    actor: string;
  }>;
  upcoming: Array<{
    id: number;
    title: string;
    date: string;
    date_end?: string;
    category: string;
  }>;
  team_workload: Array<{
    id: number;
    name: string;
    open: number;
    in_progress: number;
    done_this_week: number;
  }>;
  plan_usage: {
    plan: string;
    templates: { used: number; limit: number | null };
    signings: { used: number; limit: number | null };
    clients: { used: number; limit: number | null };
    storage_mb: { used: number; limit: number | null };
  };
};

/* ─── Greeting ──────────────────────────────────────────────────────────── */

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
};

/* ─── Pipeline bar colors ───────────────────────────────────────────────── */

const pipelineColors: Record<string, { bg: string; label: string }> = {
  draft:   { bg: "bg-foreground/20",            label: "Draft" },
  sent:    { bg: "bg-blue-500",                 label: "Trimise" },
  viewed:  { bg: "bg-amber-500",                label: "Vizualizate" },
  signed:  { bg: "bg-[color:var(--accent)]",    label: "Semnate" },
  expired: { bg: "bg-red-500",                  label: "Expirate" },
};

/* ─── Urgency icon helper ───────────────────────────────────────────────── */

function UrgencyIcon({ type }: { type: string }) {
  switch (type) {
    case "expiring_invite":
      return <CalendarClock className="w-4 h-4 text-amber-500" />;
    case "overdue_task":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "blocked_task":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "unsigned_invite":
      return <MailWarning className="w-4 h-4 text-amber-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

/* ─── Usage bar ─────────────────────────────────────────────────────────── */

function UsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used}{unit ? ` ${unit}` : ""} / {isUnlimited ? "∞" : `${limit}${unit ? ` ${unit}` : ""}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
        {!isUnlimited && (
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-[color:var(--accent)]"
            )}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const overview = useCollectionItem<DashboardOverview>(
    "dashboard-overview",
    "/dashboard/overview"
  );
  const firstName = me?.first_name ?? "";
  const d = overview.data;
  const isLoading = overview.isLoading && !d;
  const isError = overview.isError && !d;
  const pipeline = d?.contract_pipeline;
  const pipelineTotal = pipeline
    ? pipeline.draft + pipeline.sent + pipeline.viewed + pipeline.signed + pipeline.expired
    : 0;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`}
          description="Privire de ansamblu asupra cabinetului tău."
        />
        <ErrorState
          message="Nu am putut încărca dashboard-ul."
          onRetry={() => overview.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`}
        description="Privire de ansamblu asupra cabinetului tău."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/app/planner-smart")}>
              <Bot className="w-4 h-4" /> Plan AI
            </Button>
            <Button onClick={() => navigate("/app/contracts/invites")}>
              <Send className="w-4 h-4" /> Trimite contract
            </Button>
          </>
        }
      />

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Clienți activi"
          value={d?.kpis.clients ?? 0}
          accent="brand"
          trend="up"
          trendValue={`+${d?.kpis.clients_new_this_month ?? 0} lună`}
        />
        <StatCard
          icon={Send}
          label="Solicitări active"
          value={d?.kpis.invites_active ?? 0}
          accent={d?.kpis.invites_expiring_soon ? "warning" : "neutral"}
          trend={d?.kpis.invites_expiring_soon ? "down" : "flat"}
          trendValue={
            d?.kpis.invites_expiring_soon
              ? `${d.kpis.invites_expiring_soon} expiră curând`
              : "stabil"
          }
        />
        <StatCard
          icon={FileCheck}
          label="Contracte semnate"
          value={d?.kpis.submissions_total ?? 0}
          accent="success"
          trend="up"
          trendValue={`+${d?.kpis.submissions_this_month ?? 0} lună`}
        />
        <StatCard
          icon={ListChecks}
          label="Tickete deschise"
          value={d?.kpis.tasks_open ?? 0}
          accent={d?.kpis.tasks_overdue ? "danger" : "neutral"}
          trend={d?.kpis.tasks_overdue ? "down" : "flat"}
          trendValue={
            d?.kpis.tasks_overdue
              ? `${d.kpis.tasks_overdue} depășite`
              : d?.kpis.tasks_due_today
                ? `${d.kpis.tasks_due_today} azi`
                : "stabil"
          }
        />
      </div>
      )}

      {/* ── Loading state for the main grid ─────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Pipeline contracte"><SkeletonList rows={3} /></SectionCard>
          <SectionCard title="Activitate recentă"><SkeletonList rows={3} /></SectionCard>
          <SectionCard title="Următoarele 7 zile"><SkeletonList rows={3} /></SectionCard>
        </div>
      )}

      {/* ── Urgent items banner ─────────────────────────────────────────── */}
      {!isLoading && (d?.urgent_items ?? []).length > 0 && (
        <SectionCard
          icon={AlertTriangle}
          title="Necesită atenție acum"
          description={`${d!.urgent_items.length} elemente urgente sau depășite`}
        >
          <ul className="divide-y divide-border -mx-2">
            {d!.urgent_items.map((item) => (
              <li key={item.id} className="px-2 py-2.5 flex items-center gap-3">
                <UrgencyIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {fmtRelative(item.due)}
                </span>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => navigate(item.link)}
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ── Main grid: pipeline + activity + calendar ───────────────────── */}
      {!isLoading && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Contract pipeline ─────────────────────────────────────────── */}
        <SectionCard
          icon={FileText}
          title="Pipeline contracte"
          description="Statusul tuturor solicitărilor active."
          actions={
            <Button
              size="xs"
              variant="ghost"
              onClick={() => navigate("/app/contracts/invites")}
            >
              Toate <ArrowRight className="w-3 h-3" />
            </Button>
          }
        >
          {pipeline && pipelineTotal > 0 ? (
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {(Object.entries(pipelineColors) as [string, { bg: string }][]).map(
                  ([key, { bg }]) => {
                    const val = pipeline[key as keyof typeof pipeline] ?? 0;
                    const pct = (val / pipelineTotal) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={key}
                        className={cn("h-full rounded-full transition-all", bg)}
                        style={{ width: `${pct}%` }}
                        title={`${pipelineColors[key]!.label}: ${val}`}
                      />
                    );
                  }
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {Object.entries(pipelineColors).map(([key, { bg, label }]) => {
                  const val = pipeline[key as keyof typeof pipeline] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                      <span className={cn("w-2.5 h-2.5 rounded-full", bg)} />
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{val}</span>
                    </div>
                  );
                })}
              </div>
              {/* Stats under bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground">
                    {pipeline.sent + pipeline.viewed}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    În așteptare
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-[color:var(--accent)]">
                    {pipeline.signed}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Finalizate
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-red-500">
                    {pipeline.expired}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Expirate
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Niciun contract activ.
            </p>
          )}
        </SectionCard>

        {/* ── Recent activity ───────────────────────────────────────────── */}
        <SectionCard
          icon={CheckCircle2}
          title="Activitate recentă"
          description="Ce s-a întâmplat în cabinet."
          actions={
            <Button size="xs" variant="ghost" onClick={() => navigate("/app/ticketing")}>
              Tot <ArrowRight className="w-3 h-3" />
            </Button>
          }
        >
          <ul className="divide-y divide-border -mx-2">
            {(d?.recent_activity ?? []).map((item) => (
              <li key={item.id} className="px-2 py-2.5 flex items-center gap-3">
                <Avatar name={item.actor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.actor} · {fmtRelative(item.at)}
                  </p>
                </div>
                <StatusBadge status={item.type} />
              </li>
            ))}
            {(d?.recent_activity ?? []).length === 0 && (
              <li className="px-2 py-8 text-sm text-muted-foreground text-center">
                Nimic nou momentan.
              </li>
            )}
          </ul>
        </SectionCard>

        {/* ── Upcoming 7 days ───────────────────────────────────────────── */}
        <SectionCard
          icon={CalendarClock}
          title="Următoarele 7 zile"
          description="Termene și deadline-uri."
          actions={
            <Button size="xs" variant="ghost" onClick={() => navigate("/app/calendar")}>
              Calendar <ArrowRight className="w-3 h-3" />
            </Button>
          }
        >
          <ul className="space-y-2">
            {(d?.upcoming ?? []).slice(0, 6).map((item) => {
              const startDate = new Date(item.date);
              const endDate = item.date_end ? new Date(item.date_end) : null;
              const isRange = endDate && endDate.getTime() !== startDate.getTime();
              const daysUntil = Math.ceil(
                (startDate.getTime() - Date.now()) / 86400000
              );
              const isToday = daysUntil <= 0;
              const isSoon = daysUntil <= 2 && daysUntil > 0;
              const monthLabel = startDate
                .toLocaleDateString("ro-RO", { month: "short" })
                .replace(".", "")
                .toUpperCase();
              const dayLabel =
                isRange && endDate
                  ? `${startDate.getDate()}–${endDate.getDate()}`
                  : `${startDate.getDate()}`;

              // Format a nice date range label like "2 - 7 mai"
              const fmtRange = () => {
                if (!endDate || !isRange) return null;
                const sameMonth = startDate.getMonth() === endDate.getMonth();
                if (sameMonth) {
                  return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString("ro-RO", { month: "long" })}`;
                }
                return `${startDate.getDate()} ${startDate.toLocaleDateString("ro-RO", { month: "short" })} - ${endDate.getDate()} ${endDate.toLocaleDateString("ro-RO", { month: "short" })}`;
              };

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-foreground/3 transition-colors"
                >
                  <div
                    className="shrink-0 min-w-[3rem] w-auto rounded-xl border border-border bg-background/60 px-2 py-1 text-center"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {monthLabel}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 font-semibold leading-none tabular-nums whitespace-nowrap",
                        isRange ? "text-[13px] tracking-tight" : "text-lg",
                        "text-foreground"
                      )}
                    >
                      {dayLabel}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRange ? (
                        <span className="font-medium">{fmtRange()}</span>
                      ) : isToday ? (
                        <span className="text-red-500 font-medium">Azi</span>
                      ) : isSoon ? (
                        <span className="text-amber-500 font-medium">
                          Peste {daysUntil} {daysUntil === 1 ? "zi" : "zile"}
                        </span>
                      ) : (
                        fmtDate(item.date)
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.category === "contract" ? "accent"
                        : item.category === "hr_leave" ? "warning"
                        : item.category === "task" ? "info"
                        : "neutral"
                    }
                  >
                    {item.category}
                  </Badge>
                </li>
              );
            })}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => navigate("/app/planner-smart")}
          >
            <Sparkles className="w-4 h-4" /> Vezi Planner Smart
          </Button>
        </SectionCard>
      </div>
      )}

      {/* ── Bottom row: team workload + plan usage ──────────────────────── */}
      {!isLoading && (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Team workload ─────────────────────────────────────────────── */}
        <SectionCard
          icon={Users}
          title="Volum echipă"
          description="Tickete per membru săptămâna asta."
          actions={
            <Button
              size="xs"
              variant="ghost"
              onClick={() => navigate("/app/settings/users-roles")}
            >
              Echipă <ArrowRight className="w-3 h-3" />
            </Button>
          }
          className="lg:col-span-3"
        >
          {(d?.team_workload ?? []).length > 0 ? (
            <div className="space-y-2.5">
              {d!.team_workload.map((member) => {
                const total = member.open + member.in_progress;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/3 transition-colors"
                  >
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {member.open} deschise
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {member.in_progress} în lucru
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                          {member.done_this_week} finalizate
                        </span>
                      </div>
                    </div>
                    {/* Mini workload bar */}
                    <div className="w-20 shrink-0">
                      <div className="flex h-2 rounded-full overflow-hidden gap-px bg-foreground/5">
                        {member.open > 0 && (
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${(member.open / Math.max(total, 1)) * 100}%`,
                            }}
                          />
                        )}
                        {member.in_progress > 0 && (
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${(member.in_progress / Math.max(total, 1)) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-1">
                        {total} total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nu există date de echipă.
            </p>
          )}
        </SectionCard>

        {/* ── Plan usage ────────────────────────────────────────────────── */}
        <SectionCard
          icon={TrendingUp}
          title="Utilizare plan"
          description={d?.plan_usage?.plan ? `Plan: ${d.plan_usage.plan}` : "—"}
          actions={
            <Button
              size="xs"
              variant="ghost"
              onClick={() => navigate("/app/settings")}
            >
              Setări <ArrowRight className="w-3 h-3" />
            </Button>
          }
          className="lg:col-span-2"
        >
          {d?.plan_usage ? (
            <div className="space-y-3.5">
              <UsageBar
                label="Șabloane"
                used={d.plan_usage.templates.used}
                limit={d.plan_usage.templates.limit}
              />
              <UsageBar
                label="Semnări (luna)"
                used={d.plan_usage.signings.used}
                limit={d.plan_usage.signings.limit}
              />
              <UsageBar
                label="Clienți"
                used={d.plan_usage.clients.used}
                limit={d.plan_usage.clients.limit}
              />
              <UsageBar
                label="Stocare"
                used={d.plan_usage.storage_mb.used}
                limit={d.plan_usage.storage_mb.limit}
                unit="MB"
              />
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Badge variant="accent">{d.plan_usage.plan}</Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => navigate("/app/settings")}
                >
                  <Eye className="w-3 h-3" /> Upgrade
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Datele planului nu sunt disponibile.
            </p>
          )}
        </SectionCard>
      </div>
      )}
    </div>
  );
}
