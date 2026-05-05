import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { Drawer } from "../../../components/ui/Drawer";
import { Badge } from "../../../components/ui/Badge";
import {
  useCollectionCreate,
  useCollectionList,
} from "../../../hooks/useCollection";
import { useExtensions } from "../../../hooks/useExtensions";
import { api } from "../../../lib/api";
import { fmtDate, cn } from "../../../lib/utils";
import { queryClient } from "../../../lib/queryClient";

type EventCategory = "contract" | "hr_leave" | "task" | "personal";

type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  end_date?: string;
  count?: number;
};

type PlannerEvent = {
  id: number;
  title: string;
  date: string;
  date_end?: string;
  duration_minutes?: number;
  category: EventCategory;
  linked_id?: number;
  recurrence?: RecurrenceRule | string | null;
  _recurring_source?: number;
  _synthetic?: boolean;
  _source_label?: string;
};

type Ticket = {
  id: number;
  title: string;
  status: string;
  due_date?: string | null;
  due_at?: string | null;
};

type ContractInvite = {
  id: number;
  status: string;
  expiration_date?: string | null;
  client_id?: number | null;
};

type HrLeave = {
  id: number;
  user_id: number;
  leave_type: string;
  from: string;
  to: string;
  status: string;
};

type LayoutSlot = PlannerEvent & { col: number; totalCols: number };

const categoryStyles: Record<
  EventCategory,
  { dot: string; chip: string; block: string; label: string }
> = {
  contract: {
    dot: "bg-[color:var(--accent)]",
    chip: "bg-[color:var(--accent)]/20 text-foreground",
    block:
      "bg-[color:var(--accent)]/22 border-l-[3px] border-[color:var(--accent)] text-foreground",
    label: "Contract",
  },
  hr_leave: {
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    block:
      "bg-amber-500/12 border-l-[3px] border-amber-500 text-amber-800 dark:text-amber-200",
    label: "Concediu HR",
  },
  task: {
    dot: "bg-foreground/40",
    chip: "bg-foreground/8 text-foreground",
    block:
      "bg-foreground/8 border-l-[3px] border-foreground/40 text-foreground",
    label: "Ticket",
  },
  personal: {
    dot: "bg-foreground",
    chip: "bg-foreground/12 text-foreground",
    block:
      "bg-foreground/15 border-l-[3px] border-foreground text-foreground",
    label: "Personal",
  },
};

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 56;
const TIME_COL = 56;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function endTime(iso: string, durationMinutes = 60): string {
  const end = new Date(iso);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end.toISOString();
}

function toCalendarIso(value: string | null | undefined, fallbackTime: string): string | null {
  if (!value) return null;
  if (value.includes("T")) return new Date(value).toISOString();
  return new Date(`${value}T${fallbackTime}:00`).toISOString();
}

function eventOccursOnDay(event: PlannerEvent, key: string): boolean {
  const start = event.date.slice(0, 10);
  const end = event.date_end?.slice(0, 10);
  return key >= start && (!end || key <= end);
}

function eventsForDay(events: PlannerEvent[], day: Date): PlannerEvent[] {
  const key = day.toISOString().slice(0, 10);
  return events
    .filter((e) => eventOccursOnDay(e, key))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function topPxFromHour(date: Date): number {
  const h = date.getHours();
  const m = date.getMinutes();
  return (h - HOUR_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

/** Column-packing: overlapping events render side-by-side (Google Calendar style). */
function layoutOverlap(events: PlannerEvent[]): LayoutSlot[] {
  if (!events.length) return [];
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const groups: PlannerEvent[][] = [];
  let cur: PlannerEvent[] = [sorted[0]!];
  let gEnd = new Date(sorted[0]!.date).getTime() + (sorted[0]!.duration_minutes ?? 60) * 60000;
  for (let i = 1; i < sorted.length; i++) {
    const s = new Date(sorted[i]!.date).getTime();
    if (s < gEnd) {
      cur.push(sorted[i]!);
      gEnd = Math.max(gEnd, s + (sorted[i]!.duration_minutes ?? 60) * 60000);
    } else {
      groups.push(cur);
      cur = [sorted[i]!];
      gEnd = s + (sorted[i]!.duration_minutes ?? 60) * 60000;
    }
  }
  groups.push(cur);
  const result: LayoutSlot[] = [];
  for (const g of groups) {
    const cols: number[] = [];
    for (const ev of g) {
      const evS = new Date(ev.date).getTime();
      let c = 0;
      while (cols[c] !== undefined && cols[c]! > evS) c++;
      cols[c] = evS + (ev.duration_minutes ?? 60) * 60000;
      result.push({ ...ev, col: c, totalCols: 0 });
    }
    const mx = cols.length;
    for (const r of result) if (g.some((x) => x.id === r.id)) r.totalCols = mx;
  }
  return result;
}

export default function CalendarPage() {
  const ext = useExtensions();
  const canLoadTicketing = ext.isReady && ext.canUse("ticketing_pro");
  const canLoadContracts = ext.isReady && ext.canUse("contracts_pro");
  const canLoadHr = ext.isReady && ext.canUse("hr_pro");

  const events = useCollectionList<PlannerEvent>("planner-events", "/planner/events");
  const tickets = useCollectionList<Ticket>(
    "calendar-ticketing",
    "/ticketing/tickets",
    "",
    canLoadTicketing
  );
  const invites = useCollectionList<ContractInvite>(
    "calendar-contract-invites",
    "/contracts/invites",
    "",
    canLoadContracts
  );
  const leaves = useCollectionList<HrLeave>(
    "calendar-hr-leaves",
    "/hr/leaves",
    "",
    canLoadHr
  );
  const create = useCollectionCreate<object, PlannerEvent>(
    "planner-events",
    "/planner/events"
  );
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<{ message: string }>(`/planner/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner-events"] }),
  });

  const today = new Date();
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<PlannerEvent | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(today.toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState("09:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newMultiDay, setNewMultiDay] = useState(false);
  const [newCategory, setNewCategory] = useState<EventCategory>("personal");
  const [newRecurring, setNewRecurring] = useState(false);
  const [newFrequency, setNewFrequency] = useState<RecurrenceRule["frequency"]>("weekly");
  const [newInterval, setNewInterval] = useState(1);
  const [newRecEnd, setNewRecEnd] = useState("");

  const allEvents = useMemo<PlannerEvent[]>(() => {
    const ticketEvents: PlannerEvent[] = (tickets.data ?? [])
      .filter((ticket) => !["done", "archived"].includes(ticket.status))
      .flatMap((ticket) => {
        const date = toCalendarIso(ticket.due_date ?? ticket.due_at, "10:00");
        if (!date) return [];
        return [{
          id: -100_000_000 - ticket.id,
          title: `Ticket: ${ticket.title}`,
          date,
          duration_minutes: 45,
          category: "task" as const,
          linked_id: ticket.id,
          _synthetic: true,
          _source_label: `Ticket #${ticket.id}`,
        }];
      });

    const inviteEvents: PlannerEvent[] = (invites.data ?? [])
      .filter((invite) => !["signed", "expired", "revoked"].includes(invite.status))
      .flatMap((invite) => {
        const date = toCalendarIso(invite.expiration_date, "16:00");
        if (!date) return [];
        return [{
          id: -200_000_000 - invite.id,
          title: `Deadline contract: invitație #${invite.id}`,
          date,
          duration_minutes: 45,
          category: "contract" as const,
          linked_id: invite.id,
          _synthetic: true,
          _source_label: invite.client_id
            ? `Invitație #${invite.id} · Client #${invite.client_id}`
            : `Invitație #${invite.id}`,
        }];
      });

    const leaveEvents: PlannerEvent[] = (leaves.data ?? [])
      .filter((leave) => leave.status !== "rejected")
      .flatMap((leave) => {
        const date = toCalendarIso(leave.from, "09:00");
        const dateEnd = toCalendarIso(leave.to, "17:00") ?? undefined;
        if (!date) return [];
        return [{
          id: -300_000_000 - leave.id,
          title: `Concediu: ${leave.leave_type}`,
          date,
          ...(dateEnd ? { date_end: dateEnd } : {}),
          duration_minutes: 60,
          category: "hr_leave" as const,
          linked_id: leave.id,
          _synthetic: true,
          _source_label: `Cerere HR #${leave.id} · User #${leave.user_id} · ${leave.status}`,
        }];
      });

    return [
      ...(events.data ?? []),
      ...ticketEvents,
      ...inviteEvents,
      ...leaveEvents,
    ];
  }, [events.data, tickets.data, invites.data, leaves.data]);

  const navigateCursor = (delta: number) => {
    if (view === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    } else if (view === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() + delta * 7);
      setCursor(d);
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() + delta);
      setCursor(d);
    }
  };

  const todayKey = today.toISOString().slice(0, 10);

  const openAddOnDate = (dateIso: string, time = "09:00") => {
    setNewDate(dateIso.slice(0, 10));
    setNewTime(time);
    const h = parseInt(time.split(":")[0] ?? "9");
    setNewEndTime(`${String(h + 1).padStart(2, "0")}:00`);
    setNewEndDate("");
    setNewMultiDay(false);
    setNewTitle("");
    setNewCategory("personal");
    setNewRecurring(false);
    setNewFrequency("weekly");
    setNewInterval(1);
    setNewRecEnd("");
    setAddOpen(true);
  };

  const submitNew = () => {
    if (!newTitle.trim()) return;
    const startDt = new Date(`${newDate}T${newTime}:00`);
    const endDt = newMultiDay && newEndDate
      ? new Date(`${newEndDate}T${newEndTime}:00`)
      : new Date(`${newDate}T${newEndTime}:00`);
    const durationMin = Math.max(15, Math.round((endDt.getTime() - startDt.getTime()) / 60000));
    const payload: Record<string, unknown> = {
      title: newTitle.trim(),
      date: startDt.toISOString(),
      date_end: newMultiDay && newEndDate ? endDt.toISOString() : "",
      duration_minutes: durationMin,
      category: newCategory,
    };
    if (newRecurring) {
      payload.recurrence = {
        frequency: newFrequency,
        interval: newInterval,
        ...(newRecEnd ? { end_date: new Date(newRecEnd).toISOString() } : { count: 12 }),
      };
    }
    create.mutate(payload);
    setAddOpen(false);
    setNewTitle("");
  };

  const headerLabel = useMemo(() => {
    if (view === "month") {
      return cursor.toLocaleDateString("ro-RO", {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = new Date(cursor);
      start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return cursor.toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [view, cursor]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Agenda pe ore cu evenimente, tickete, deadline-uri de contract și concedii HR."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { id: "month", label: "Lună" },
                { id: "week", label: "Săpt." },
                { id: "day", label: "Zi" },
              ]}
            />
            <Button onClick={() => openAddOnDate(todayKey, "09:00")}>
              <Plus className="w-4 h-4" /> Eveniment nou
            </Button>
          </>
        }
      />

      <section className="rounded-2xl border border-border bg-frame overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold capitalize">{headerLabel}</h2>
          <div className="flex gap-1">
            <Button size="xs" variant="ghost" onClick={() => navigateCursor(-1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setCursor(new Date())}
            >
              azi
            </Button>
            <Button size="xs" variant="ghost" onClick={() => navigateCursor(1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>

        {view === "month" && (
          <MonthGrid
            cursor={cursor}
            allEvents={allEvents}
            todayKey={todayKey}
            onPickEvent={setSelected}
            onPickDay={(iso) => openAddOnDate(iso, "09:00")}
          />
        )}
        {view === "week" && (
          <WeekTimeGrid
            cursor={cursor}
            allEvents={allEvents}
            todayKey={todayKey}
            onPickEvent={setSelected}
            onPickSlot={openAddOnDate}
          />
        )}
        {view === "day" && (
          <DayTimeGrid
            cursor={cursor}
            allEvents={allEvents}
            onPickEvent={setSelected}
            onPickSlot={openAddOnDate}
          />
        )}
      </section>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(categoryStyles).map(([key, value]) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${value.dot}`} />
            {value.label}
          </span>
        ))}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        description={
          selected
            ? `${categoryStyles[selected.category].label} · ${fmtDate(selected.date)} · ${fmtTime(selected.date)} – ${fmtTime(endTime(selected.date, selected.duration_minutes))}`
            : ""
        }
        footer={
          selected && (
            <div className={cn(
              "flex items-center gap-2",
              selected._synthetic ? "justify-end" : "justify-between"
            )}>
              {!selected._synthetic && (
                <Button
                  variant="outline"
                  onClick={() => {
                    remove.mutate(selected.id);
                    setSelected(null);
                  }}
                  className="text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" /> Șterge
                </Button>
              )}
              <Button onClick={() => setSelected(null)}>Închide</Button>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
              <Badge variant="info">
                {categoryStyles[selected.category].label}
              </Badge>
              <p className="text-sm">
                {selected._source_label ??
                (selected.linked_id
                  ? `Asociat cu #${selected.linked_id}`
                  : "Eveniment standalone.")}
              </p>
              <p className="text-xs text-muted-foreground">
                Începe la <strong>{fmtTime(selected.date)}</strong> · durează{" "}
                {selected.duration_minutes ?? 60} min
              </p>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Eveniment nou"
        description={`Pe ${fmtDate(new Date(newDate).toISOString())} la ${newTime}`}
        footer={<div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAddOpen(false)}>Anulează</Button>
          <Button loading={create.isPending} onClick={submitNew} disabled={!newTitle.trim()}>
            <Plus className="w-4 h-4" /> Adaugă
          </Button>
        </div>}
      >
        <Input label="Titlu" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Meeting client, deadline contract..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dată start" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Input label="Ora start" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={newMultiDay} onChange={(e) => setNewMultiDay(e.target.checked)} className="toggle-switch" />
          <span className="text-sm font-medium">Eveniment pe mai multe zile</span>
        </label>
        {newMultiDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Dată sfârșit" type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
            <Input label="Ora sfârșit" type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
          </div>
        )}
        {!newMultiDay && (
          <Input label="Ora sfârșit" type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
        )}
        <div>
          <p className="text-sm font-medium mb-1.5">Categorie</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(categoryStyles) as EventCategory[]).map((cat) => {
              const style = categoryStyles[cat];
              return (
                <button key={cat} type="button" onClick={() => setNewCategory(cat)}
                  className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border transition-colors text-left",
                    newCategory === cat ? "border-foreground/40 bg-foreground/5" : "border-border hover:bg-foreground/3"
                  )}>
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-border pt-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={newRecurring} onChange={(e) => setNewRecurring(e.target.checked)} className="toggle-switch" />
            <span className="text-sm font-medium">Eveniment recurent</span>
          </label>
          {newRecurring && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Frecvență</p>
                <select value={newFrequency} onChange={(e) => setNewFrequency(e.target.value as RecurrenceRule["frequency"])}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40">
                  <option value="daily">Zilnic</option>
                  <option value="weekly">Săptămânal</option>
                  <option value="monthly">Lunar</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">La fiecare</p>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={30} value={newInterval} onChange={(e) => setNewInterval(Number(e.target.value) || 1)}
                    className="w-16 rounded-xl border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40" />
                  <span className="text-xs text-muted-foreground">
                    {newFrequency === "daily" ? "zile" : newFrequency === "weekly" ? "săpt." : newFrequency === "monthly" ? "luni" : "ani"}
                  </span>
                </div>
              </div>
            </div>
            <Input label="Până la (opțional)" type="date" value={newRecEnd} onChange={(e) => setNewRecEnd(e.target.value)} />
          </>)}
        </div>
      </Drawer>
    </div>
  );
}

/* ───────── Month view ───────── */

function MonthGrid({
  cursor,
  allEvents,
  todayKey,
  onPickEvent,
  onPickDay,
}: {
  cursor: Date;
  allEvents: PlannerEvent[];
  todayKey: string;
  onPickEvent: (e: PlannerEvent) => void;
  onPickDay: (iso: string) => void;
}) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, idx) => {
    const dayNum = idx - startDay + 1;
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), dayNum);
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const key = date.toISOString().slice(0, 10);
    return {
      date,
      inMonth,
      key,
      items: allEvents
        .filter((e) => eventOccursOnDay(e, key))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  });

  return (
    <>
      <div className="grid grid-cols-7 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/3">
        {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const isToday = cell.key === todayKey;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onPickDay(cell.key)}
              className={cn(
                "group min-h-[112px] border-b border-r border-border p-2 last:border-r-0 text-left relative transition-colors hover:bg-[color:var(--accent)]/8 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40",
                cell.inMonth ? "" : "bg-foreground/3"
              )}
              title="Click pentru a adăuga eveniment"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold",
                    isToday
                      ? "bg-foreground text-background"
                      : cell.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  )}
                >
                  {cell.date.getDate()}
                </span>
                <Plus className="w-3 h-3 text-muted-foreground/0 group-hover:text-foreground/70 transition-colors" />
              </div>
              <div className="space-y-1">
                {cell.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPickEvent(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onPickEvent(item);
                      }
                    }}
                    className={cn(
                      "block w-full text-left text-[11px] px-1.5 py-0.5 rounded-md truncate cursor-pointer",
                      categoryStyles[item.category].chip
                    )}
                  >
                    <span className="font-semibold mr-1">{fmtTime(item.date)}</span>
                    {item.title}
                  </span>
                ))}
                {cell.items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1.5">
                    +{cell.items.length - 3}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ───────── Week view (hourly) ───────── */

function WeekTimeGrid({
  cursor,
  allEvents,
  todayKey,
  onPickEvent,
  onPickSlot,
}: {
  cursor: Date;
  allEvents: PlannerEvent[];
  todayKey: string;
  onPickEvent: (e: PlannerEvent) => void;
  onPickSlot: (dateIso: string, time: string) => void;
}) {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
  const isToday = (d: Date) => d.toISOString().slice(0, 10) === todayKey;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 720 }}>
        {/* Header row */}
        <div
          className="grid border-b border-border bg-foreground/3 sticky top-0 z-10"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(7, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "px-2 py-2 text-center text-[11px] uppercase tracking-wider",
                isToday(day) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <p>{day.toLocaleDateString("ro-RO", { weekday: "short" })}</p>
              <p
                className={cn(
                  "mt-0.5 text-base font-semibold normal-case tracking-normal",
                  isToday(day) && "inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background"
                )}
              >
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Body grid */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `${TIME_COL}px repeat(7, minmax(0, 1fr))`,
            height: totalHeight,
          }}
        >
          {/* Hour labels column */}
          <div className="border-r border-border relative">
            {hours.slice(0, -1).map((h, i) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-[10px] text-muted-foreground pr-2 text-right"
                style={{ top: i * HOUR_HEIGHT - 6 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 day columns */}
          {days.map((day) => {
            const dayItems = eventsForDay(allEvents, day);
            return (
              <div
                key={day.toISOString()}
                className="relative border-r border-border last:border-r-0"
              >
                {/* Hour grid lines + click slots */}
                {hours.slice(0, -1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() =>
                      onPickSlot(
                        day.toISOString(),
                        `${String(h).padStart(2, "0")}:00`
                      )
                    }
                    className="absolute left-0 right-0 border-t border-border/60 hover:bg-[color:var(--accent)]/8 transition-colors"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    title="Click pentru a adăuga eveniment"
                  />
                ))}

                {/* Events — overlap-aware layout */}
                {layoutOverlap(dayItems).map((item) => {
                  const s = new Date(item.date);
                  const top = topPxFromHour(s);
                  const height = ((item.duration_minutes ?? 60) / 60) * HOUR_HEIGHT - 2;
                  if (top < 0 || top > totalHeight) return null;
                  const w = 100 / item.totalCols;
                  const l = item.col * w;
                  const narrow = item.totalCols >= 3;
                  const short_ = height < 36;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPickEvent(item); }}
                      className={cn(
                        "absolute rounded-md text-left overflow-hidden hover:shadow-sm transition-shadow",
                        narrow ? "p-0.5 px-1" : "p-1.5",
                        categoryStyles[item.category].block
                      )}
                      style={{ top, height: Math.max(height, 26), left: `calc(${l}% + 1px)`, width: `calc(${w}% - 2px)` }}
                      title={`${fmtTime(item.date)} ${item.title}`}
                    >
                      {!short_ && !narrow && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                          {fmtTime(item.date)}
                        </p>
                      )}
                      <p className={cn(
                        "font-medium leading-tight truncate",
                        narrow ? "text-[10px]" : "text-[12px]"
                      )}>
                        {short_ || narrow ? `${fmtTime(item.date)} ` : ""}{item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── Day view (hourly) ───────── */

function DayTimeGrid({
  cursor,
  allEvents,
  onPickEvent,
  onPickSlot,
}: {
  cursor: Date;
  allEvents: PlannerEvent[];
  onPickEvent: (e: PlannerEvent) => void;
  onPickSlot: (dateIso: string, time: string) => void;
}) {
  const day = new Date(cursor);
  day.setHours(0, 0, 0, 0);
  const items = eventsForDay(allEvents, day);
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
  const isToday = day.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

  return (
    <div className="grid" style={{ gridTemplateColumns: `${TIME_COL}px 1fr` }}>
      <div />
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-semibold inline-flex items-center gap-2">
          {day.toLocaleDateString("ro-RO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          {isToday && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground text-background">
              azi
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{items.length} evenimente</p>
      </div>

      {/* Hour gutter */}
      <div className="border-r border-border relative" style={{ height: totalHeight }}>
        {hours.slice(0, -1).map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 text-[10px] text-muted-foreground pr-2 text-right"
            style={{ top: i * HOUR_HEIGHT - 6 }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="relative" style={{ height: totalHeight }}>
        {hours.slice(0, -1).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() =>
              onPickSlot(day.toISOString(), `${String(h).padStart(2, "0")}:00`)
            }
            className="absolute left-0 right-0 border-t border-border/60 hover:bg-[color:var(--accent)]/8 transition-colors"
            style={{ top: (h - HOUR_START) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            title="Click pentru a adăuga eveniment"
          />
        ))}

        {layoutOverlap(items).map((item) => {
          const s = new Date(item.date);
          const top = topPxFromHour(s);
          const height = ((item.duration_minutes ?? 60) / 60) * HOUR_HEIGHT - 2;
          if (top < 0 || top > totalHeight) return null;
          const w = 100 / item.totalCols;
          const l = item.col * w;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); onPickEvent(item); }}
              className={cn(
                "absolute rounded-lg p-2.5 text-left overflow-hidden hover:shadow-sm transition-shadow",
                categoryStyles[item.category].block
              )}
              style={{ top, height: Math.max(height, 28), left: `calc(${l}% + 3px)`, width: `calc(${w}% - 6px)` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {fmtTime(item.date)} – {fmtTime(endTime(item.date, item.duration_minutes))}
              </p>
              <p className="text-sm font-semibold leading-tight">{item.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
