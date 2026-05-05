import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  History,
  KanbanSquare,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
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
import { useExtensions } from "../../../hooks/useExtensions";
import { api } from "../../../lib/api";
import {
  ticketPriorityBar,
  ticketPriorityLabel,
  ticketPriorityVariant,
  ticketStatusLabel,
  type TicketPriorityInput,
} from "../../../lib/ticketing";
import type { ClientDTO } from "../../../lib/types";
import { fmtDate, fmtRelative } from "../../../lib/utils";

type TicketStatus = "todo" | "in_progress" | "blocked" | "done" | "archived";
type BoardStatus = Exclude<TicketStatus, "archived">;

type Ticket = {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: string;
  assignee_id: number | null;
  client_id?: number | null;
  owner_id: number;
  due_date: string;
  due_at?: string | null;
  source: string;
  source_type?: string | null;
  source_id?: number | null;
  claimed_at?: string | null;
  completed_at?: string | null;
  refused_at?: string | null;
  created_at?: string;
  updated_at: string;
  date_added?: string;
  date_modified?: string;
};

type TicketPatch = Partial<{
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriorityInput | string;
  assignee_id: number | null;
  client_id: number | null;
  source_type: string | null;
  source_id: number | null;
  due_date: string | null;
}>;

type TicketHistoryEvent = {
  id: string;
  ticketId: number;
  title: string;
  description: string;
  at: string;
  actor: string;
};

const TICKET_HISTORY_KEY = "contapp_ticket_history_v1";

const columns: Array<{ key: BoardStatus; label: string; tone: string }> = [
  { key: "todo", label: "De făcut", tone: "from-foreground/8 to-transparent" },
  { key: "in_progress", label: "În progres", tone: "from-foreground/15 to-transparent" },
  { key: "blocked", label: "Blocate", tone: "from-red-500/12 to-transparent" },
  { key: "done", label: "Gata", tone: "from-[color:var(--accent)]/25 to-transparent" },
];

function ticketSourceType(ticket: Ticket): string {
  const source = ticket.source_type || ticket.source || "manual";
  return ["manual", "chat", "ai", "client", "contract"].includes(source)
    ? source
    : "manual";
}

function readTicketHistory(): TicketHistoryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TICKET_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTicketHistory(events: TicketHistoryEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TICKET_HISTORY_KEY, JSON.stringify(events.slice(0, 500)));
  } catch {
    // Local audit history is a convenience layer over backend state.
  }
}

function appendTicketHistory(
  ticket: Ticket,
  title: string,
  description: string,
  actor: string
) {
  writeTicketHistory([
    {
      id: `${ticket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ticketId: ticket.id,
      title,
      description,
      actor,
      at: new Date().toISOString(),
    },
    ...readTicketHistory(),
  ]);
}

function historyForTicket(ticketId: number): TicketHistoryEvent[] {
  return readTicketHistory()
    .filter((event) => event.ticketId === ticketId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function dateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function dateInputToISO(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
}

function defaultDueDate(): string {
  return new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
}

function clientName(client: ClientDTO): string {
  if (client.client_type === "company") return client.company_name || client.email || `Client #${client.id}`;
  return [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || client.email || `Client #${client.id}`;
}

function ticketUpdatePayload(ticket: Ticket, patch: TicketPatch) {
  return {
    title: patch.title ?? ticket.title,
    description: patch.description ?? ticket.description ?? "",
    status: patch.status ?? ticket.status,
    priority: patch.priority ?? ticket.priority,
    assignee_id:
      patch.assignee_id !== undefined ? patch.assignee_id : ticket.assignee_id,
    client_id: patch.client_id !== undefined ? patch.client_id : ticket.client_id ?? null,
    source_type: patch.source_type ?? ticketSourceType(ticket),
    source_id: patch.source_id !== undefined ? patch.source_id : ticket.source_id ?? null,
    due_date:
      patch.due_date !== undefined ? patch.due_date : ticket.due_date ?? ticket.due_at ?? null,
  };
}

export default function TicketingPage() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const actorName =
    principal?.kind === "user"
      ? `${principal.first_name} ${principal.last_name}`.trim() || principal.email
      : "Sistem";
  const ext = useExtensions();
  const teamUsers = useTeamUsers();
  const clients = useCollectionList<ClientDTO>(
    "ticketing-clients",
    "/clients",
    "",
    ext.isReady && ext.canUse("contracts_pro")
  );

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
  const [dragOverCol, setDragOverCol] = useState<BoardStatus | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TicketPriorityInput>("normal");
  const [newAssignee, setNewAssignee] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newDueDate, setNewDueDate] = useState(defaultDueDate());

  const listQuery = statusFilter !== "all" ? `status=${statusFilter}` : "";
  const list = useCollectionList<Ticket>("ticketing", "/ticketing/tickets", listQuery);
  const create = useCollectionCreate<object, Ticket>("ticketing", "/ticketing/tickets");
  const claim = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tickets/${id}/claim`);
  const complete = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tickets/${id}/complete`);
  const refuse = useCollectionAction<Ticket>("ticketing", (id) => `/ticketing/tickets/${id}/refuse`);
  const updateTicket = useMutation({
    mutationFn: ({
      ticket,
      patch,
    }: {
      ticket: Ticket;
      patch: TicketPatch;
      historyTitle: string;
      historyDescription: string;
    }) => api.put<Ticket>(`/ticketing/tickets/${ticket.id}`, ticketUpdatePayload(ticket, patch)),
    onSuccess: (updated, variables) => {
      appendTicketHistory(
        updated,
        variables.historyTitle,
        variables.historyDescription,
        actorName
      );
      setHistoryVersion((v) => v + 1);
      setActive(updated);
      list.refetch();
    },
  });

  const assigneeOptions = [
    { value: "", label: "Neasignat" },
    ...(teamUsers.data ?? []).map((user) => ({
      value: String(user.id),
      label: teamUserDisplayName(user),
    })),
  ];
  const clientOptions = [
    { value: "", label: "Fără client" },
    ...(clients.data ?? []).map((client) => ({
      value: String(client.id),
      label: clientName(client),
    })),
  ];

  useEffect(() => {
    setActive((current) => {
      if (!current) return current;
      return list.data?.find((t) => t.id === current.id) ?? current;
    });
  }, [list.data]);

  const filtered = useMemo(() => {
    let rows = list.data ?? [];
    if (statusFilter === "all") {
      rows = rows.filter((r) => r.status !== "archived");
    } else {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.title} ${r.description}`.toLowerCase().includes(q)
    );
  }, [list.data, query, statusFilter]);

  const grouped = useMemo(() => {
    const map: Record<BoardStatus, Ticket[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const t of filtered) {
      if (t.status !== "archived") map[t.status].push(t);
    }
    return map;
  }, [filtered]);

  const onDrop = (status: BoardStatus, e: React.DragEvent) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (!id) return;
    const ticket = filtered.find((t) => t.id === id);
    if (!ticket || ticket.status === status) return;
    updateTicket.mutate({
      ticket,
      patch: { status },
      historyTitle: "Status schimbat",
      historyDescription: `${ticketStatusLabel(ticket.status)} → ${ticketStatusLabel(status)}`,
    });
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
              placeholder="Caută ticket..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <SegmentedControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "Active" },
              { id: "todo", label: "Todo" },
              { id: "in_progress", label: "În progres" },
              { id: "blocked", label: "Blocate" },
              { id: "done", label: "Gata" },
              { id: "archived", label: "Arhivate" },
            ]}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" /> urgent
          </span>
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

      {statusFilter === "archived" && (
        <ArchivedTicketsPanel
          tickets={filtered}
          historyVersion={historyVersion}
          onPick={setActive}
        />
      )}

      {view === "board" && statusFilter !== "archived" && (
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
                      <Badge variant={ticketPriorityVariant(ticket.priority)}>
                        {ticketPriorityLabel(ticket.priority)}
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

      {view === "list" && statusFilter !== "archived" && (
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
                  <span className={`w-1.5 h-12 rounded-full ${ticketPriorityBar(t.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <Avatar name={memberOf(t.assignee_id)} size="sm" />
                  <Badge variant="neutral">{ticketStatusLabel(t.status)}</Badge>
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

      {view === "calendar" && statusFilter !== "archived" && <CalendarView tickets={filtered} onPick={setActive} />}

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Ticket nou"
        description="Creează un work item cu responsabil, prioritate și termen."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                if (!newTitle.trim()) return;
                create.mutate(
                  {
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    status: "todo",
                    priority: newPriority,
                    owner_id: myId,
                    assignee_id: newAssignee ? Number(newAssignee) : null,
                    client_id: newClient ? Number(newClient) : null,
                    source_type: "manual",
                    source_id: null,
                    due_date: dateInputToISO(newDueDate),
                  },
                  {
                    onSuccess: (ticket) => {
                      appendTicketHistory(
                        ticket,
                        "Ticket creat",
                        `Prioritate ${ticketPriorityLabel(ticket.priority)} · termen ${fmtDate(ticket.due_date)}`,
                        actorName
                      );
                      setHistoryVersion((v) => v + 1);
                    },
                  }
                );
                setNewTitle("");
                setNewDescription("");
                setNewPriority("normal");
                setNewAssignee("");
                setNewClient("");
                setNewDueDate(defaultDueDate());
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Asignat"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            options={assigneeOptions}
          />
          <Input
            label="Termen"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
        {ext.canUse("contracts_pro") && (
          <Select
            label="Client"
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
            options={clientOptions}
          />
        )}
        <SegmentedControl
          value={newPriority}
          onChange={setNewPriority}
          options={[
            { id: "low", label: "Low" },
            { id: "normal", label: "Medium" },
            { id: "high", label: "High" },
            { id: "urgent", label: "Urgent" },
          ]}
        />
      </Drawer>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width="lg"
        title={active?.title ?? ""}
        description={active ? `Ticket #${active.id} · ${ticketStatusLabel(active.status)}` : ""}
        footer={
          active && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  updateTicket.mutate({
                    ticket: active,
                    patch: { status: "archived" },
                    historyTitle: "Ticket arhivat",
                    historyDescription: "Ticketul a fost mutat în arhivă.",
                  })
                }
                disabled={active.status === "archived"}
              >
                <Archive className="w-4 h-4" /> Arhivează
              </Button>
              {active.status === "archived" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    updateTicket.mutate({
                      ticket: active,
                      patch: { status: "todo" },
                      historyTitle: "Ticket restaurat",
                      historyDescription: "Ticketul a revenit în backlog.",
                    })
                  }
                >
                  <RotateCcw className="w-4 h-4" /> Restaurează
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  refuse.mutate(
                    { id: active.id },
                    {
                      onSuccess: (updated) => {
                        appendTicketHistory(updated, "Ticket refuzat", "Status schimbat în blocat.", actorName);
                        setHistoryVersion((v) => v + 1);
                        setActive(updated);
                      },
                    }
                  )
                }
                disabled={active.status === "archived"}
              >
                <X className="w-4 h-4" /> Refuz
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  claim.mutate(
                    { id: active.id, payload: { assignee_id: myId } },
                    {
                      onSuccess: (updated) => {
                        appendTicketHistory(updated, "Ticket preluat", "Ai devenit responsabil pe acest ticket.", actorName);
                        setHistoryVersion((v) => v + 1);
                        setActive(updated);
                      },
                    }
                  )
                }
                disabled={active.status === "archived"}
              >
                <Avatar name="Tu" size="xs" />
                <span className="ml-1.5">Preiau</span>
              </Button>
              <Button
                onClick={() =>
                  complete.mutate(
                    { id: active.id },
                    {
                      onSuccess: (updated) => {
                        appendTicketHistory(updated, "Ticket finalizat", "Status schimbat în gata.", actorName);
                        setHistoryVersion((v) => v + 1);
                        setActive(updated);
                      },
                    }
                  )
                }
                disabled={active.status === "archived"}
              >
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
                <Badge variant="info">{ticketStatusLabel(active.status)}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Prioritate
                </p>
                <Badge variant={ticketPriorityVariant(active.priority)}>
                  {ticketPriorityLabel(active.priority)}
                </Badge>
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
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Status"
                  value={active.status}
                  onChange={(e) => {
                    const status = e.target.value as TicketStatus;
                    updateTicket.mutate({
                      ticket: active,
                      patch: { status },
                      historyTitle: "Status schimbat",
                      historyDescription: `${ticketStatusLabel(active.status)} → ${ticketStatusLabel(status)}`,
                    });
                  }}
                  options={[
                    { value: "todo", label: "De făcut" },
                    { value: "in_progress", label: "În progres" },
                    { value: "blocked", label: "Blocat" },
                    { value: "done", label: "Gata" },
                    { value: "archived", label: "Arhivat" },
                  ]}
                />
                <Select
                  label="Prioritate"
                  value={active.priority === "medium" ? "normal" : active.priority}
                  onChange={(e) => {
                    const priority = e.target.value as TicketPriorityInput;
                    updateTicket.mutate({
                      ticket: active,
                      patch: { priority },
                      historyTitle: "Prioritate schimbată",
                      historyDescription: `${ticketPriorityLabel(active.priority)} → ${ticketPriorityLabel(priority)}`,
                    });
                  }}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                />
                <Select
                  label="Responsabil"
                  value={active.assignee_id ? String(active.assignee_id) : ""}
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) : null;
                    updateTicket.mutate({
                      ticket: active,
                      patch: { assignee_id: next },
                      historyTitle: "Responsabil schimbat",
                      historyDescription: `Asignat către ${memberOf(next)}.`,
                    });
                  }}
                  options={assigneeOptions}
                />
                <Input
                  label="Termen"
                  type="date"
                  value={dateInputValue(active.due_date ?? active.due_at)}
                  onChange={(e) => {
                    updateTicket.mutate({
                      ticket: active,
                      patch: { due_date: dateInputToISO(e.target.value) },
                      historyTitle: "Termen schimbat",
                      historyDescription: e.target.value ? `Termen nou: ${fmtDate(e.target.value)}` : "Termen eliminat.",
                    });
                  }}
                />
                {ext.canUse("contracts_pro") && (
                  <Select
                    label="Client"
                    value={active.client_id ? String(active.client_id) : ""}
                    onChange={(e) => {
                      const next = e.target.value ? Number(e.target.value) : null;
                      const selected = clients.data?.find((client) => client.id === next);
                      updateTicket.mutate({
                        ticket: active,
                        patch: { client_id: next },
                        historyTitle: "Client schimbat",
                        historyDescription: selected ? `Legat de ${clientName(selected)}.` : "Legătura cu clientul a fost eliminată.",
                      });
                    }}
                    options={clientOptions}
                  />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm whitespace-pre-wrap">
                {active.description || "Fără descriere."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Istoric ticket
              </h3>
              <ActivityTimeline
                items={[
                  {
                    id: "created",
                    title: "Ticket creat",
                    description: `Sursă: ${active.source}`,
                    at: fmtRelative(active.created_at ?? active.date_added ?? active.updated_at),
                    icon: <KanbanSquare className="w-4 h-4" />,
                    tone: "info",
                  },
                  ...(active.claimed_at
                    ? [{
                        id: "claimed",
                        title: "Ticket preluat",
                        description: `Responsabil: ${memberOf(active.assignee_id)}`,
                        at: fmtRelative(active.claimed_at),
                        icon: <Check className="w-4 h-4" />,
                        tone: "success" as const,
                      }]
                    : []),
                  ...(active.refused_at
                    ? [{
                        id: "refused",
                        title: "Ticket refuzat",
                        description: "Status schimbat în blocat.",
                        at: fmtRelative(active.refused_at),
                        icon: <X className="w-4 h-4" />,
                        tone: "danger" as const,
                      }]
                    : []),
                  ...(active.completed_at
                    ? [{
                        id: "completed",
                        title: "Ticket finalizat",
                        description: "Status schimbat în gata.",
                        at: fmtRelative(active.completed_at),
                        icon: <Check className="w-4 h-4" />,
                        tone: "success" as const,
                      }]
                    : []),
                  ...historyForTicket(active.id).map((event) => ({
                    id: event.id,
                    title: event.title,
                    description: `${event.description} · ${event.actor}`,
                    at: fmtRelative(event.at),
                    icon: <History className="w-4 h-4" />,
                    tone: event.title.toLowerCase().includes("arhiv")
                      ? "warning" as const
                      : "neutral" as const,
                  })),
                  {
                    id: "status",
                    title: `Status curent: ${ticketStatusLabel(active.status)}`,
                    description: `Prioritate ${ticketPriorityLabel(active.priority)} · asignat ${memberOf(active.assignee_id)}`,
                    at: fmtDate(active.due_date),
                    icon: <Clock className="w-4 h-4" />,
                    tone:
                      active.status === "done"
                        ? "success"
                        : active.status === "blocked"
                          ? "danger"
                          : "neutral",
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

function ArchivedTicketsPanel({
  tickets,
  onPick,
  historyVersion,
}: {
  tickets: Ticket[];
  onPick: (t: Ticket) => void;
  historyVersion: number;
}) {
  void historyVersion;

  return (
    <div className="rounded-2xl border border-border bg-frame overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <Archive className="w-4 h-4" /> Tickete arhivate
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Istoric și audit rapid pentru work item-urile scoase din fluxul activ.
          </p>
        </div>
        <Badge variant="neutral">{tickets.length}</Badge>
      </header>
      {tickets.length === 0 ? (
        <EmptyArt
          icon={Archive}
          title="Nicio arhivare"
          description="Ticketele arhivate vor apărea aici cu istoricul lor."
        />
      ) : (
        <ul className="divide-y divide-border">
          {tickets.map((ticket) => {
            const history = historyForTicket(ticket.id);
            const latest = history[0];
            return (
              <li key={ticket.id} className="p-4 hover:bg-foreground/3 transition-colors">
                <button
                  type="button"
                  onClick={() => onPick(ticket)}
                  className="w-full text-left flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {ticket.description || "Fără descriere."}
                      </p>
                    </div>
                    <Badge variant={ticketPriorityVariant(ticket.priority)}>
                      {ticketPriorityLabel(ticket.priority)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar name={ticket.assignee_id ? `User ${ticket.assignee_id}` : "Neasignat"} size="xs" />
                      {ticket.assignee_id ? `User #${ticket.assignee_id}` : "Neasignat"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Actualizat {fmtRelative(ticket.updated_at)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      {history.length} evenimente locale
                    </span>
                  </div>
                  {latest && (
                    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{latest.title}</span>
                      {" · "}
                      {latest.description}
                      {" · "}
                      {fmtRelative(latest.at)}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
