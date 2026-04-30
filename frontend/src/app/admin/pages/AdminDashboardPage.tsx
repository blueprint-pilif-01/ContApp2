import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  FolderOpen,
  Layers,
  ListChecks,
  PauseCircle,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCollectionItem } from "../../../hooks/useCollection";
import { usePrincipal } from "../../../hooks/useMe";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { fmtRelative, cn } from "../../../lib/utils";

interface AdminOverview {
  kpis: {
    organisations: number;
    active_organisations: number;
    suspended_organisations: number;
    users: number;
    jobs_running: number;
    events_today: number;
  };
  recent_organisations: Array<{
    id: number;
    name: string;
    plan: string;
    status: string;
    created_at: string;
    employees: number;
  }>;
  recent_events: Array<{
    id: number;
    actor_name: string;
    action: string;
    organisation_id: number;
    entity_type: string;
    created_at: string;
    details?: string;
  }>;
  jobs_status: { running: number; succeeded: number; failed: number };
}

interface QuickLink {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface QuickLinkGroup {
  title: string;
  description: string;
  links: QuickLink[];
}

const QUICK_LINKS: QuickLinkGroup[] = [
  {
    title: "Conturi și acces",
    description: "Cine folosește platforma și cum.",
    links: [
      {
        to: "/admin/organisations",
        label: "Organizații",
        description: "Adaugă, suspendă, reactivează firme.",
        icon: Building2,
      },
      {
        to: "/admin/users",
        label: "Useri",
        description: "Conturi cross-organisation.",
        icon: Users,
      },
      {
        to: "/admin/extensions",
        label: "Extensii",
        description: "Toggle pe pachetele plătite per organizație.",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Monetizare",
    description: "Planuri, abonamente și billing.",
    links: [
      {
        to: "/admin/plans",
        label: "Planuri",
        description: "Definește prețuri, limite și extensii incluse.",
        icon: Layers,
      },
      {
        to: "/admin/billing",
        label: "Billing",
        description: "MRR, abonamente active și evenimente Stripe.",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Operațiuni",
    description: "Ce se întâmplă în spate.",
    links: [
      {
        to: "/admin/jobs",
        label: "Joburi",
        description: "Status și trigger manual pentru job runs.",
        icon: ListChecks,
      },
      {
        to: "/admin/files",
        label: "Fișiere",
        description: "Storage usage și fișiere orfane.",
        icon: FolderOpen,
      },
      {
        to: "/admin/notifications",
        label: "Notificări",
        description: "Broadcast cross-organisation.",
        icon: Bell,
      },
      {
        to: "/admin/audit",
        label: "Audit log",
        description: "Toate evenimentele cu actor.",
        icon: ScrollText,
      },
    ],
  },
];

export default function AdminDashboardPage() {
  const principal = usePrincipal();
  const adminFirstName =
    principal?.kind === "admin" ? principal.first_name : "";
  const overview = useCollectionItem<AdminOverview>(
    "admin-dashboard",
    "/admin/dashboard"
  );

  if (overview.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" />
        <ErrorState onRetry={() => overview.refetch()} />
      </div>
    );
  }

  const d = overview.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          adminFirstName ? `Bună, ${adminFirstName}.` : "Admin Dashboard"
        }
        description="Privire de ansamblu peste toate organizațiile platformei și acces rapid către modulele administrative."
      />

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Building2}
          label="Organizații"
          value={d?.kpis.organisations ?? "—"}
          accent="brand"
          hint={`${d?.kpis.active_organisations ?? 0} active · ${d?.kpis.suspended_organisations ?? 0} suspendate`}
        />
        <StatCard
          icon={Users}
          label="Useri totali"
          value={d?.kpis.users ?? "—"}
          accent="neutral"
        />
        <StatCard
          icon={ListChecks}
          label="Joburi running"
          value={d?.kpis.jobs_running ?? "—"}
          accent={d?.kpis.jobs_running ? "warning" : "neutral"}
        />
        <StatCard
          icon={Activity}
          label="Evenimente azi"
          value={d?.kpis.events_today ?? "—"}
          accent="neutral"
        />
      </div>

      {/* ── Quick links by group ────────────────────────────────────────── */}
      <div className="space-y-6">
        {QUICK_LINKS.map((group) => (
          <section key={group.title} className="space-y-2.5">
            <header>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {group.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {group.description}
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {group.links.map((link) => (
                <QuickLinkCard key={link.to} link={link} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Recent rows + jobs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          icon={Building2}
          title="Organizații recente"
          actions={
            <Link to="/admin/organisations">
              <Button size="xs" variant="ghost">
                Toate <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          }
        >
          {!d ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : d.recent_organisations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nicio organizație înregistrată.
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-2">
              {d.recent_organisations.map((org) => (
                <li key={org.id} className="px-2 py-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-foreground/8 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.employees} angajați · creat{" "}
                      {fmtRelative(org.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      org.status === "active"
                        ? "success"
                        : org.status === "trialing"
                          ? "info"
                          : "warning"
                    }
                  >
                    {org.status}
                  </Badge>
                  <Badge variant="neutral">{org.plan}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={Activity}
          title="Evenimente recente"
          actions={
            <Link to="/admin/audit">
              <Button size="xs" variant="ghost">
                Audit <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          }
        >
          {!d ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : d.recent_events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nu s-a înregistrat niciun eveniment.
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-2">
              {d.recent_events.map((evt) => (
                <li key={evt.id} className="px-2 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {evt.action}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {evt.actor_name} · org #{evt.organisation_id}
                      {evt.details ? ` · ${evt.details}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {fmtRelative(evt.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard icon={ListChecks} title="Status joburi">
        {!d ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border p-3">
              <PauseCircle className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-semibold">{d.jobs_status.running}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Running
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <CheckCircle2 className="w-5 h-5 mx-auto text-[color:var(--accent)] mb-1" />
              <p className="text-2xl font-semibold">{d.jobs_status.succeeded}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Succeeded
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <AlertTriangle className="w-5 h-5 mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-semibold">{d.jobs_status.failed}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Failed
              </p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function QuickLinkCard({ link }: { link: QuickLink }) {
  const Icon = link.icon;
  return (
    <Link
      to={link.to}
      className={cn(
        "group rounded-2xl border border-border bg-frame p-4 flex items-start gap-3",
        "hover:border-foreground/30 hover:bg-foreground/[0.02] transition-colors"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-[color:var(--accent)]/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" strokeWidth={1.85} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold inline-flex items-center gap-2">
          {link.label}
          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {link.description}
        </p>
      </div>
    </Link>
  );
}
