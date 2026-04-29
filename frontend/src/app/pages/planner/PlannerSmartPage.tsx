import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  ListChecks,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { useCollectionItem, useCollectionList } from "../../../hooks/useCollection";
import { usePrincipal } from "../../../hooks/useMe";
import { Button } from "../../../components/ui/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { AIBottomGlow, AIShimmerText, AIThinkingBlob } from "../../../components/ai";
import { suggestPlanForUser } from "../../../lib/mockAI";
import { fmtRelative, cn } from "../../../lib/utils";

type PlannerSmartResponse = {
  focus: Array<{ type: string; title: string; id: number }>;
  generated_at: string;
};

type Ticket = {
  id: number;
  title: string;
  status: string;
  priority: "low" | "medium" | "high";
  due_date: string;
  assignee_id: number | null;
};

type PlannerEvent = {
  id: number;
  title: string;
  date: string;
  category: string;
};

type Invite = {
  id: number;
  status: string;
  expiration_date: string;
  client_id: number;
};

const focusIcon: Record<string, typeof Target> = {
  task: ListChecks,
  invite: Send,
  message: Mail,
  default: Target,
};

const priorityVariant: Record<Ticket["priority"], "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export default function PlannerSmartPage() {
  const me = usePrincipal();
  const navigate = useNavigate();
  const smart = useCollectionItem<PlannerSmartResponse>(
    "planner-smart",
    "/planner/smart"
  );
  const tickets = useCollectionList<Ticket>("ticketing", "/ticketing/tickets");
  const events = useCollectionList<PlannerEvent>("planner-events", "/planner/events");
  const invites = useCollectionList<Invite>("invites-list", "/contracts/invites");

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    setLoading(true);
    const focus = (smart.data?.focus ?? []).map((i) => i.title);
    setText("");
    for await (const chunk of suggestPlanForUser(me?.first_name ?? "tu", focus)) {
      setText(chunk);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (smart.data && !text) {
      void regenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smart.data]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const todayTickets = (tickets.data ?? [])
    .filter((t) => t.status !== "done")
    .filter((t) => new Date(t.due_date) <= tomorrowStart)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);

  const todayEvents = (events.data ?? [])
    .filter((e) => {
      const d = new Date(e.date);
      return d >= todayStart && d < tomorrowStart;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const expiringInvites = (invites.data ?? [])
    .filter((i) => i.status !== "signed" && i.status !== "expired")
    .filter((i) => {
      const d = new Date(i.expiration_date);
      const diff = (d.getTime() - Date.now()) / 86400000;
      return diff <= 5;
    })
    .slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bună dimineața";
    if (h < 18) return "Bună ziua";
    return "Bună seara";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planner Smart"
        description={`${greeting()}${me?.first_name ? `, ${me.first_name}` : ""}. Iată ce contează astăzi.`}
        actions={
          <Button onClick={regenerate} loading={loading} variant="outline">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Regenerează plan
          </Button>
        }
      />

      {/* AI plan banner — clean, no gradient */}
      <AIBottomGlow active={loading}>
      <section className="rounded-2xl border border-border bg-frame p-5 flex items-start gap-4 overflow-hidden">
        <span className="w-10 h-10 rounded-xl bg-[color:var(--accent)]/20 inline-flex items-center justify-center shrink-0">
          {loading ? <AIThinkingBlob /> : <Sparkles className="w-5 h-5 text-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Plan personal generat de AI
          </p>
          <AIShimmerText
            active={loading}
            text={
              text ||
              "Apasă „Regenerează plan” pentru a obține un plan smart pentru azi."
            }
            className="text-sm text-foreground leading-relaxed"
          />
        </div>
      </section>
      </AIBottomGlow>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Today's tickets */}
          <section className="rounded-2xl border border-border bg-frame">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold inline-flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> De rezolvat azi
              </h2>
              <Button size="xs" variant="ghost" onClick={() => navigate("/app/ticketing")}>
                Toate <ArrowRight className="w-3 h-3" />
              </Button>
            </header>
            {tickets.isLoading ? (
              <div className="px-5 py-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : tickets.isError ? (
              <div className="px-5 py-6">
                <ErrorState onRetry={() => tickets.refetch()} />
              </div>
            ) : todayTickets.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                Niciun ticket urgent astăzi.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {todayTickets.map((t) => {
                  const overdue = new Date(t.due_date) < todayStart;
                  return (
                    <li
                      key={t.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-foreground/3 transition-colors cursor-pointer"
                      onClick={() => navigate("/app/ticketing")}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-9 rounded-full",
                          t.priority === "high"
                            ? "bg-red-500"
                            : t.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-foreground/30"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {fmtRelative(t.due_date)}
                          {overdue && (
                            <Badge variant="danger" className="ml-1">
                              întârziat
                            </Badge>
                          )}
                        </p>
                      </div>
                      {t.assignee_id && (
                        <Avatar
                          name={t.assignee_id === 1 ? "Andrei Popescu" : `User ${t.assignee_id}`}
                          size="xs"
                        />
                      )}
                      <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Expiring invites */}
          <section className="rounded-2xl border border-border bg-frame">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold inline-flex items-center gap-2">
                <Send className="w-4 h-4" /> Solicitări care expiră curând
              </h2>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => navigate("/app/contracts/invites")}
              >
                Pipeline <ArrowRight className="w-3 h-3" />
              </Button>
            </header>
            {invites.isLoading ? (
              <div className="px-5 py-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : invites.isError ? (
              <div className="px-5 py-6">
                <ErrorState onRetry={() => invites.refetch()} />
              </div>
            ) : expiringInvites.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                Nicio solicitare care expiră în următoarele 5 zile.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {expiringInvites.map((inv) => (
                  <li
                    key={inv.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-foreground/3 transition-colors cursor-pointer"
                    onClick={() => navigate("/app/contracts/invites")}
                  >
                    <span className="w-8 h-8 rounded-lg bg-foreground/8 inline-flex items-center justify-center shrink-0">
                      <Send className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Invitație #{inv.id} pentru client #{inv.client_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expiră {fmtRelative(inv.expiration_date)}
                      </p>
                    </div>
                    <Badge variant="warning">{inv.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-frame">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold inline-flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Agenda zilei
              </h2>
              <Button size="xs" variant="ghost" onClick={() => navigate("/app/calendar")}>
                Calendar
              </Button>
            </header>
            {todayEvents.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Nimic programat astăzi.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {todayEvents.map((e) => (
                  <li key={e.id} className="px-4 py-3">
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(e.date).toLocaleTimeString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{e.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-frame p-4">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" /> Focus puncte AI
            </h2>
            {(smart.data?.focus ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Niciun focus important detectat.
              </p>
            ) : (
              <ul className="space-y-2">
                {(smart.data?.focus ?? []).map((item) => {
                  const Icon = focusIcon[item.type] ?? focusIcon.default!;
                  return (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-foreground/5"
                    >
                      <Icon className="w-3.5 h-3.5 text-foreground/70 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {item.type}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
