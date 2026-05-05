import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  History,
  Lightbulb,
  Plus,
  Repeat,
  Sparkles,
  Wand2,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useRuns, useWorkflows, useSaveWorkflow, generateId } from "../../../lib/automation/storage";
import { suggestWorkflowsForOrg, type SuggestedWorkflow } from "../../../lib/ai";
import { CATALOG_COUNTS } from "../../../lib/automation/catalog";
import { fmtRelative } from "../../../lib/utils";
import type { WorkflowRun } from "../../../lib/automation/types";

export default function OverviewPage() {
  const navigate = useNavigate();
  const { data: workflows = [] } = useWorkflows();
  const { data: runs = [] } = useRuns();
  const saveWorkflow = useSaveWorkflow();

  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.status === "success").length;
  const errorRuns = runs.filter((r) => r.status === "error").length;
  const successRate = totalRuns ? Math.round((successRuns / totalRuns) * 100) : 0;
  const aiStepsRun = runs.reduce(
    (acc, r) => acc + r.steps.filter((s) => s.kind === "ai").length,
    0,
  );
  const minutesSaved = Math.round(totalRuns * 4.5 + aiStepsRun * 1.8);

  const recentRuns: WorkflowRun[] = runs.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privire generală"
        description="Cockpit-ul automatizărilor: cât rulează, ce sugerează AI-ul și ce e pe rolă."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/automations/templates")}>
              <Sparkles className="h-4 w-4" /> Pornește din șablon
            </Button>
            <Button size="sm" onClick={() => navigate("/app/automations/workflows/new")}>
              <Plus className="h-4 w-4" /> Workflow nou
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={WorkflowIcon}
          label="Workflow-uri active"
          value={workflows.filter((w) => w.enabled).length}
          hint={`${workflows.length} totale`}
          accent="brand"
        />
        <StatCard
          icon={Repeat}
          label="Rulări (toate)"
          value={totalRuns}
          hint={`${errorRuns} eșuate · ${successRate}% succes`}
          accent={errorRuns > 0 ? "warning" : "success"}
          trend={successRate >= 90 ? "up" : successRate >= 70 ? "flat" : "down"}
          trendValue={`${successRate}%`}
        />
        <StatCard
          icon={Bot}
          label="Pași AI executați"
          value={aiStepsRun}
          hint="Generări, clasificări, scoruri"
          accent="brand"
        />
        <StatCard
          icon={CheckCircle2}
          label="Timp economisit (estimat)"
          value={`${minutesSaved} min`}
          hint="Bazat pe pași și complexitate"
          accent="success"
          trend="up"
          trendValue="↑"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <AISuggestions
            onUse={(s) => {
              saveWorkflow.mutate(
                {
                  ...s.workflow,
                  id: generateId("wf"),
                  source: "ai_generated",
                  enabled: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                {
                  onSuccess: (created) => {
                    navigate(`/app/automations/workflows/${created.id}`);
                  },
                },
              );
            }}
          />

          <SectionCard
            icon={History}
            title="Rulări recente"
            description="Ultimele evenimente din motorul de automatizări."
            actions={
              <Button variant="ghost" size="xs" onClick={() => navigate("/app/automations/runs")}>
                Vezi toate <ArrowRight className="h-3 w-3" />
              </Button>
            }
            padding="sm"
          >
            {recentRuns.length === 0 ? (
              <EmptyState
                icon={History}
                title="Nicio rulare încă"
                description="Activează un workflow ca să vezi aici un istoric live."
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentRuns.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center justify-between gap-3 px-2 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {run.workflow_name}
                        </span>
                        <RunStatusBadge status={run.status} />
                        {run.id.startsWith("run_seed_") && (
                          <Badge variant="neutral" className="text-[10px]">Exemplu</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {fmtRelative(run.started_at)} · {run.steps.length} pași
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate("/app/automations/runs")}
                    >
                      Detalii <ArrowRight className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            icon={Lightbulb}
            title="Pornește repede"
            description="Acțiuni rapide pentru a duce Automatizările pe nivelul următor."
            padding="sm"
          >
            <div className="space-y-2">
              <QuickAction
                icon={Wand2}
                title="Construiește din text"
                description="Descrie o regulă în limbaj natural; AI-ul o transpune."
                onClick={() => navigate("/app/automations/ai-studio")}
              />
              <QuickAction
                icon={Sparkles}
                title="Folosește un șablon"
                description="20+ șabloane preconfigurate pentru contracte, HR, ticketing."
                onClick={() => navigate("/app/automations/templates")}
              />
              <QuickAction
                icon={WorkflowIcon}
                title="Workflow nou de la zero"
                description="Builder vizual cu pași, condiții, întârzieri și AI."
                onClick={() => navigate("/app/automations/workflows/new")}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Zap}
            title="Catalog disponibil"
            description="Bucățile de bază pe care le poți combina."
            padding="sm"
          >
            <ul className="space-y-2 text-sm">
              <CatalogStat label="Trigger-e" value={CATALOG_COUNTS.triggers} />
              <CatalogStat label="Acțiuni" value={CATALOG_COUNTS.actions} />
              <CatalogStat label="din care AI" value={CATALOG_COUNTS.ai_actions} accent />
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof WorkflowIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-foreground/[0.03]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/80">
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function CatalogStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          accent
            ? "text-sm font-semibold text-[color:var(--accent)]"
            : "text-sm font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </li>
  );
}

function RunStatusBadge({ status }: { status: WorkflowRun["status"] }) {
  if (status === "running") return <Badge variant="info">În rulare</Badge>;
  if (status === "success") return <Badge variant="success">Succes</Badge>;
  if (status === "error") return <Badge variant="danger">Eroare</Badge>;
  return <Badge variant="neutral">Sărit</Badge>;
}

function AISuggestions({ onUse }: { onUse: (s: SuggestedWorkflow) => void }) {
  const [suggestions, setSuggestions] = useState<SuggestedWorkflow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await suggestWorkflowsForOrg();
      if (!res.ok) {
        setErrored(true);
        setSuggestions([]);
        return;
      }
      setSuggestions(res.suggestions);
    } catch {
      setErrored(true);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <SectionCard
      icon={Sparkles}
      title="Sugestii AI pentru organizația ta"
      description="Generate live de AI pe baza activității recente. Necesită endpoint /ai/suggest-workflows."
      actions={
        <Button variant="ghost" size="xs" onClick={fetchSuggestions} disabled={loading}>
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? "Se generează..." : "Reîncearcă"}
        </Button>
      }
      padding="sm"
    >
      {loading && (
        <div className="space-y-2 p-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}
      {!loading && errored && (
        <EmptyState
          icon={Bot}
          title="AI temporar indisponibil"
          description="Reîncearcă în câteva momente."
        />
      )}
      {!loading && !errored && suggestions && suggestions.length === 0 && (
        <EmptyState
          icon={Bot}
          title="Nicio sugestie încă"
          description="AI-ul nu a returnat sugestii — fie nu sunt pattern-uri clare în activitatea recentă, fie endpoint-ul nu este încă activat."
        />
      )}
      {!loading && !errored && suggestions && suggestions.length > 0 && (
        <ul className="space-y-2 p-1">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.rationale}</p>
              </div>
              <Button size="xs" onClick={() => onUse(s)}>
                <Plus className="h-3.5 w-3.5" /> Adaugă
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
