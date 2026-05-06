import { Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bot,
  History,
  LayoutDashboard,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useWorkflows } from "../../../lib/automation/storage";
import { Badge } from "../../../components/ui/Badge";

interface AutomationTab {
  to: string;
  label: string;
  icon: typeof Workflow;
  end?: boolean;
  badgeKey?: "workflows" | "active";
}

const TABS: AutomationTab[] = [
  { to: "/app/automations", label: "Privire generală", icon: LayoutDashboard, end: true },
  { to: "/app/automations/workflows", label: "Workflow-uri", icon: Workflow, badgeKey: "workflows" },
  { to: "/app/automations/templates", label: "Șabloane", icon: Sparkles },
  { to: "/app/automations/ai-studio", label: "AI Studio", icon: Bot },
  { to: "/app/automations/runs", label: "Istoric rulări", icon: History },
  { to: "/app/automations/insights", label: "Insights", icon: BarChart3 },
];

export default function AutomationLayout() {
  const { data: workflows = [] } = useWorkflows();
  const location = useLocation();
  const counts = {
    workflows: workflows.length,
    active: workflows.filter((w) => w.enabled).length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-frame px-2.5 py-1">
            <Zap className="h-3 w-3 text-amber-500" />
            Automation Studio
          </span>
          <span>·</span>
          <span>
            {counts.workflows} workflow{counts.workflows === 1 ? "" : "-uri"} · {counts.active} active
          </span>
        </div>
        <div
          className="-mb-px flex w-full items-center gap-0.5 overflow-x-auto border-b border-border"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end ?? false}
                className={({ isActive }) =>
                  cn(
                    "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4" strokeWidth={1.85} />
                    <span>{tab.label}</span>
                    {tab.badgeKey && counts[tab.badgeKey] > 0 && (
                      <Badge variant={isActive ? "accent" : "neutral"} className="ml-0.5">
                        {counts[tab.badgeKey]}
                      </Badge>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-foreground" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div key={location.pathname} className="min-h-[60vh]">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
