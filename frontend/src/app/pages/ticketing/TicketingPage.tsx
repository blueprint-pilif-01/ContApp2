import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  KanbanSquare,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { ActivityTimeline } from "../../../components/ui/ActivityTimeline";
import {
  useCollectionAction,
  useCollectionCreate,
  useCollectionList,
} from "../../../hooks/useCollection";
import { useTeamUsers, teamUserDisplayName } from "../../../hooks/useTeamUsers";
import { usePrincipal } from "../../../hooks/useMe";
import { api } from "../../../lib/api";
import { fmtDate, fmtRelative } from "../../../lib/utils";

type TicketStatus = "todo" | "in_progress" | "blocked" | "done";
type TicketPriority = "low" | "medium" | "high";

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: number | null;
  owner_id: number;
  due_date: string;
  source: string;
  updated_at: string;
};

const columns: Array<{ key: TicketStatus; label: string; tone: string }> = [
  { key: "todo", label: "De făcut", tone: "from-foreground/8 to-transparent" },
  { key: "in_progress", label: "În progres", tone: "from-foreground/15 to-transparent" },
  { key: "blocked", label: "Blocate", tone: "from-red-500/12 to-transparent" },
  { key: "done", label: "Gata", tone: "from-[color:var(--accent)]/25 to-transparent" },
];

const priorityVariant: Record<TicketPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const priorityBar: Record<TicketPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-foreground/30",
};

export default function TicketingPage() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? principal.id : 0;
  const teamUsers = useTeamUsers();

  const memberOf = (id: number | null): string => {
    if (!id) return "Neasignat";
    const u = teamUsers.data?.find((m) => m.id === id);
    if (u) return teamUserDisplayName(u);
    return `User #${id}`;
  };

  const [view, setView] = useState<"board" | "list" | "calendar">("board");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<Ticket | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");

  const listQuery = statusFilter !== "all" ? `status=${statusFilter}` : "";
  const list = useCollectionList<Ticket>("ticketing", "/ticketing/tasks", listQuery);
  const create = useCollectionCreate<object, Ticket>("ticketing", "/ticketing/tasks");
  const claim = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tasks/${id}/claim`);
  const complete = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tasks/${id}/complete`);
  const refuse = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tasks/${id}/refuse`);
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      api.put<Ticket>(`/ticketing/tasks/${id}`, { status }),
    onSuccess: () => list.refetch(),
  });

  useEffect(() => {
    if (active) {
      const fresh = list.data?.find((t) => t.id === active.id);
      if (fresh) setActive(fresh);
    }
  }, [list.data, active]);

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.title} ${r.description}`.toLowerCase().includes(q)
    );
  }, [list.data, query]);

  const grouped = useMemo(() => {
    const map: Record<TicketStatus, Ticket[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const t of filtered) map[t.status].push(t);
    return map;
  }, [filtered]);

  const onDrop = (status: TicketStatus, e: React.DragEvent) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (!id) return;
    const ticket = filtered.find((t) => t.id === id);
    if (!ticket || ticket.status === status) return;
    setStatus.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticketing"
        description="Asignare, preluare și completare. Vizualizare Kanban, listă sau calendar."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { id: "board", label: "Board" },
                { id: "list", label: "Listă" },
                { id: "calendar", label: "Calendar" },
              ]}
            />
            <Button onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" /> Ticket nou
            </Button>
          </>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-2xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută task..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          {view !== "board" && (
            <SegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { id: "all", label: "Toate" },
                { id: "todo", label: "Todo" },
                { id: "in_progress", label: "În progres" },
                { id: "blocked", label: "Blocate" },
                { id: "done", label: "Gata" },
              ]}
            />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> high
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-foreground/30" /> low
          </span>
        </div>
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {columns.map((col) => (
            <section
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => { onDrop(col.key, e); setDragOverCol(null); }}
              className={`rounded-2xl border overflow-hidden flex flex-col min-h-[460px] transition-all duration-200 ${
                dragOverCol === col.key
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5 scale-[1.01]"
                  : "border-border bg-frame"
              }`}
            >
              <header className={`px-3 py-2.5 border-b border-border bg-gradient-to-b ${col.tone} flex items-center justify-between`}>
                <p className="text-xs font-semibold tracking-tight">{col.label}</p>
                <Badge variant="neutral">{grouped[col.key].length}</Badge>
              </header>
              <div className="flex-1 p-2 space-y-2">
                {grouped[col.key].map((ticket) => (
                  <article
                    key={ticket.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", String(ticket.id))
                    }
                    onDragEnd={() => setDragOverCol(null)}
                    onClick={() => setActive(ticket)}
                    className="rounded-xl border border-border bg-frame p-3 hover:border-foreground/30 transition-all cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">
                        {ticket.title}
                      </p>
                      <Badge variant={priorityVariant[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={memberOf(ticket.assignee_id)} size="xs" />
                        <span className="text-[11px] text-muted-foreground">
                          {memberOf(ticket.assignee_id)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtDate(ticket.due_date)}
                      </span>
                    </div>
                  </article>
                ))}
                {grouped[col.key].length === 0 && (
                  <div className="text-[11px] text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
                    Tragi un ticket aici
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="rounded-2xl border border-border bg-frame overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyArt icon={KanbanSquare} title="Niciun ticket" description="Apasă „Ticket nou” pentru a crea unul." />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  onClick={() => setActive(t)}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-foreground/3 transition-colors cursor-pointer"
                >
                  <span className={`w-1.5 h-12 rounded-full ${priorityBar[t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <Avatar name={memberOf(t.assignee_id)} size="sm" />
                  <Badge variant="neutral">{t.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {fmtRelative(t.due_date)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "calendar" && <CalendarView tickets={filtered} onPick={setActive} />}

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Ticket nou"
        description="Asignează ulterior din panoul Kanban."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                if (!newTitle.trim()) return;
                create.mutate({
                  title: newTitle.trim(),
                  description: newDescription.trim(),
                  status: "todo",
                  priority: newPriority,
                  owner_id: myId,
                  assignee_id: null,
                  due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
                });
                setNewTitle("");
                setNewDescription("");
                setNewPriority("medium");
                setCreating(false);
              }}
            >
              <Sparkles className="w-4 h-4" /> Creează
            </Button>
          </div>
        }
      >
        <Input label="Titlu" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Textarea
          label="Descriere"
          rows={3}
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <SegmentedControl
          value={newPriority}
          onChange={setNewPriority}
          options={[
            { id: "low", label: "Low" },
            { id: "medium", label: "Medium" },
            { id: "high", label: "High" },
          ]}
        />
      </Drawer>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width="lg"
        title={active?.title ?? ""}
        description={active ? `Ticket #${active.id} · ${active.status}` : ""}
        footer={
          active && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => refuse.mutate({ id: active.id })}
              >
                <X className="w-4 h-4" /> Refuz
              </Button>
              <Button
                variant="outline"
                onClick={() => claim.mutate({ id: active.id, payload: { assignee_id: myId } })}
              >
                <Avatar name="Tu" size="xs" />
                <span className="ml-1.5">Preiau</span>
              </Button>
              <Button onClick={() => complete.mutate({ id: active.id })}>
                <Check className="w-4 h-4" /> Marchează gata
              </Button>
            </div>
          )
        }
      >
        {active && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <Badge variant="info">{active.status.replace("_", " ")}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Prioritate
                </p>
                <Badge variant={priorityVariant[active.priority]}>{active.priority}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Asignat
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar name={memberOf(active.assignee_id)} size="xs" />
                  <span>{memberOf(active.assignee_id)}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Termen
                </p>
                <p className="font-medium inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {fmtDate(active.due_date)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm whitespace-pre-wrap">
                {active.description || "Fără descriere."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timeline
              </h3>
              <ActivityTimeline
                items={[
                  {
                    id: "created",
                    title: "Ticket creat",
                    description: `Sursă: ${active.source}`,
                    at: fmtRelative(active.updated_at),
                    icon: <KanbanSquare className="w-4 h-4" />,
                    tone: "info",
                  },
                  {
                    id: "status",
                    title: `Status: ${active.status.replace("_", " ")}`,
                    description: `Prioritate ${active.priority} · asignat ${memberOf(active.assignee_id)}`,
                    at: fmtDate(active.due_date),
                    icon: <Clock className="w-4 h-4" />,
                    tone: active.status === "done" ? "success" : active.status === "blocked" ? "danger" : "neutral",
                  },
                ]}
              />
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-300 inline-flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p>
                Comentariile vor fi disponibile când backend dev expune endpoint-ul. Frontend-ul are deja drawer-ul pregătit.
              </p>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

function CalendarView({
  tickets,
  onPick,
}: {
  tickets: Ticket[];
  onPick: (t: Ticket) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = (start.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, idx) => {
    const dayNum = idx - startDay + 1;
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), dayNum);
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dayItems = tickets.filter(
      (t) => new Date(t.due_date).toDateString() === date.toDateString()
    );
    return { date, inMonth, items: dayItems };
  });

  return (
    <div className="rounded-2xl border border-border bg-frame overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">
          {cursor.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            ◀
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            azi
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            ▶
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-7 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/3">
        {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const isToday = cell.date.toDateString() === today.toDateString();
          return (
            <div
              key={idx}
              className={`min-h-[110px] border-b border-r border-border p-1.5 ${cell.inMonth ? "" : "bg-foreground/2"}`}
            >
              <p
                className={`text-[11px] font-medium mb-1 ${
                  isToday
                    ? "text-foreground"
                    : cell.inMonth
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                }`}
              >
                {cell.date.getDate()}
                {isToday && (
                  <span className="ml-1 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-foreground text-background">azi</span>
                )}
              </p>
              <div className="space-y-1">
                {cell.items.slice(0, 2).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onPick(t)}
                    className="block w-full text-left text-[11px] px-1.5 py-1 rounded-md bg-foreground/5 hover:bg-foreground/10 truncate"
                  >
                    {t.title}
                  </button>
                ))}
                {cell.items.length > 2 && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    +{cell.items.length - 2} mai mult
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
