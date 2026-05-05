import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSignature,
  Hourglass,
  Plus,
  Sun,
  TimerReset,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs, TabPanel } from "../../../components/ui/Tabs";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Drawer } from "../../../components/ui/Drawer";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { SectionCard } from "../../../components/ui/SectionCard";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import {
  useCollectionCreate,
  useCollectionList,
} from "../../../hooks/useCollection";
import { usePrincipal } from "../../../hooks/useMe";
import {
  teamUserDisplayName,
  useTeamUsers,
  type TeamUserDTO,
} from "../../../hooks/useTeamUsers";
import { canManageHR } from "../../../lib/access";
import { useLocalTeams, type LocalTeam } from "../../../lib/teams";
import { cn, fmtDate, fmtRelative } from "../../../lib/utils";

type HrHour = { id: number; user_id: number; date: string; hours: number; note: string };
type HrLeave = {
  id: number;
  user_id: number;
  leave_type: string;
  from: string;
  to: string;
  status: "pending" | "approved" | "rejected";
  note: string;
};
type HrScope = "self" | "team" | "all";
type CertificateStatus = "pending" | "approved" | "rejected";
type LocalCertificateRequest = {
  id: number;
  request_id?: number;
  type: string;
  user_id: number;
  status: CertificateStatus;
  created_at: string;
  note?: string;
};
type LocalLeaveApproval = {
  status: HrLeave["status"];
  actor: string;
  at: string;
};

const HR_CERTIFICATE_REQUESTS_KEY = "contapp_hr_certificate_requests_v1";
const HR_LEAVE_APPROVALS_KEY = "contapp_hr_leave_approvals_v1";

function visibleForHRAccess<T extends { user_id: number }>(
  rows: T[],
  myId: number,
  canManage: boolean
): T[] {
  return canManage ? rows : rows.filter((row) => row.user_id === myId);
}

function employeeName(users: TeamUserDTO[] | undefined, id: number, myId?: number): string {
  if (myId && id === myId) return "Tu";
  const user = users?.find((u) => u.id === id);
  return user ? teamUserDisplayName(user) : `User #${id}`;
}

function employeeOptions(users: TeamUserDTO[] | undefined, myId: number) {
  const rows = users ?? [];
  const options = rows.map((user) => ({
    value: String(user.id),
    label: teamUserDisplayName(user),
  }));
  if (myId > 0 && !options.some((option) => option.value === String(myId))) {
    options.unshift({ value: String(myId), label: "Eu" });
  }
  return options;
}

function dateKey(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthCells(cursor: Date) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, idx) => {
    const dayNum = idx - startDay + 1;
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), dayNum);
    return {
      date,
      key: dateKey(date),
      inMonth: dayNum >= 1 && dayNum <= daysInMonth,
    };
  });
}

function readLeaveApprovals(): Record<string, LocalLeaveApproval> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HR_LEAVE_APPROVALS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, LocalLeaveApproval>
      : {};
  } catch {
    return {};
  }
}

function saveLeaveApproval(id: number, status: HrLeave["status"], actor: string) {
  if (typeof window === "undefined") return;
  const approvals = readLeaveApprovals();
  approvals[id] = { status, actor, at: new Date().toISOString() };
  window.localStorage.setItem(HR_LEAVE_APPROVALS_KEY, JSON.stringify(approvals));
}

function leaveStatus(leave: HrLeave): HrLeave["status"] {
  return readLeaveApprovals()[String(leave.id)]?.status ?? leave.status;
}

function readCertificateRequests(): LocalCertificateRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HR_CERTIFICATE_REQUESTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCertificateRequest) : [];
  } catch {
    return [];
  }
}

function writeCertificateRequests(requests: LocalCertificateRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    HR_CERTIFICATE_REQUESTS_KEY,
    JSON.stringify(requests.slice(0, 100))
  );
}

function upsertCertificateRequest(request: LocalCertificateRequest): LocalCertificateRequest[] {
  const next = [
    request,
    ...readCertificateRequests().filter((item) => item.id !== request.id),
  ].slice(0, 100);
  writeCertificateRequests(next);
  return next;
}

function updateCertificateStatus(id: number, status: CertificateStatus): LocalCertificateRequest[] {
  const next = readCertificateRequests().map((request) =>
    request.id === id ? { ...request, status } : request
  );
  writeCertificateRequests(next);
  return next;
}

function isCertificateRequest(value: unknown): value is LocalCertificateRequest {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    typeof item.type === "string" &&
    typeof item.user_id === "number" &&
    typeof item.status === "string" &&
    typeof item.created_at === "string"
  );
}

function applyScope<T extends { user_id: number }>(
  rows: T[],
  myId: number,
  canManage: boolean,
  scope: HrScope,
  selectedTeam: LocalTeam | undefined
): T[] {
  if (!canManage || scope === "self") return rows.filter((row) => row.user_id === myId);
  if (scope === "team") {
    if (!selectedTeam) return [];
    return rows.filter((row) => selectedTeam.memberIds.includes(row.user_id));
  }
  return rows;
}

function statusVariant(status: CertificateStatus | HrLeave["status"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

function statusLabel(status: CertificateStatus | HrLeave["status"]) {
  if (status === "approved") return "Aprobat";
  if (status === "rejected") return "Respins";
  return "În așteptare";
}

export default function HrPage() {
  const [active, setActive] = useState("hours");

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR"
        description="Pontaj personal și per echipă, calendar, concedii, adeverințe și aprobări."
      />
      <Tabs
        tabs={[
          { id: "hours", label: "Pontaj", icon: <Clock className="w-3.5 h-3.5" /> },
          { id: "calendar", label: "Calendar", icon: <CalendarDays className="w-3.5 h-3.5" /> },
          { id: "leave", label: "Concedii", icon: <Sun className="w-3.5 h-3.5" /> },
          { id: "certificates", label: "Adeverințe", icon: <FileSignature className="w-3.5 h-3.5" /> },
          { id: "approvals", label: "Aprobări", icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
        ]}
        active={active}
        onChange={setActive}
      />
      <TabPanel id="hours" active={active}>
        <HoursTab />
      </TabPanel>
      <TabPanel id="calendar" active={active}>
        <CalendarTab />
      </TabPanel>
      <TabPanel id="leave" active={active}>
        <LeavesTab />
      </TabPanel>
      <TabPanel id="certificates" active={active}>
        <CertificatesTab />
      </TabPanel>
      <TabPanel id="approvals" active={active}>
        <ApprovalsTab />
      </TabPanel>
    </div>
  );
}

function ScopeControls({
  canManage,
  scope,
  onScopeChange,
  teamId,
  onTeamChange,
  teams,
}: {
  canManage: boolean;
  scope: HrScope;
  onScopeChange: (scope: HrScope) => void;
  teamId: string;
  onTeamChange: (teamId: string) => void;
  teams: LocalTeam[];
}) {
  if (!canManage) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <SegmentedControl
        value={scope}
        onChange={onScopeChange}
        options={[
          { id: "all", label: "Toți" },
          { id: "team", label: "Echipă" },
          { id: "self", label: "Personal" },
        ]}
      />
      {scope === "team" && (
        <select
          value={teamId}
          onChange={(event) => onTeamChange(event.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">Alege echipa</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function HoursTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const canManage = canManageHR(principal);
  const teamUsers = useTeamUsers(canManage);
  const teamsStore = useLocalTeams(principal?.kind === "user" ? principal.organisation_id : null);
  const list = useCollectionList<HrHour>("hr-hours", "/hr/hours");
  const leaves = useCollectionList<HrLeave>("hr-leaves", "/hr/leaves");
  const create = useCollectionCreate<object, HrHour>("hr-hours", "/hr/hours");
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("8");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [calendarCursor, setCalendarCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [drawerCursor, setDrawerCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [note, setNote] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [scope, setScope] = useState<HrScope>("all");
  const [teamId, setTeamId] = useState("");
  const selectedTeam = teamsStore.teams.find((team) => team.id === teamId);
  const baseRows = visibleForHRAccess(list.data ?? [], myId, canManage);
  const rows = applyScope(baseRows, myId, canManage, scope, selectedTeam);
  const leaveRows = applyScope(
    visibleForHRAccess(leaves.data ?? [], myId, canManage),
    myId,
    canManage,
    scope,
    selectedTeam
  );
  const userOptions = employeeOptions(teamUsers.data, myId);
  const monthPrefix = `${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, "0")}`;
  const monthRows = rows.filter((row) => dateKey(row.date).startsWith(monthPrefix));
  const productiveHours = monthRows.reduce((acc, row) => acc + Math.min(row.hours, 8), 0);
  const overtimeHours = monthRows.reduce((acc, row) => acc + Math.max(0, row.hours - 8), 0);
  const nonproductiveRows = monthRows.filter((row) => row.note.toLowerCase().includes("neproductiv")).length;
  const openPunchForDate = (nextDate: string) => {
    setDate(nextDate);
    const parsed = new Date(`${nextDate}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setDrawerCursor(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <ScopeControls
          canManage={canManage}
          scope={scope}
          onScopeChange={setScope}
          teamId={teamId}
          onTeamChange={setTeamId}
          teams={teamsStore.teams}
        />
        <Button onClick={() => openPunchForDate(dateKey(new Date()))}>
          <Plus className="w-4 h-4" /> Înregistrează
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard label="Ore productive" value={`${productiveHours}h`} icon={<Clock className="w-5 h-5" />} />
        <MetricCard label="Overtime" value={`${overtimeHours}h`} icon={<TimerReset className="w-5 h-5" />} tone="text-violet-500" />
        <MetricCard label="Zile pontate" value={String(monthRows.length)} icon={<ClipboardCheck className="w-5 h-5" />} />
        <MetricCard label="Neproductive" value={String(nonproductiveRows)} icon={<Hourglass className="w-5 h-5" />} tone="text-amber-500" />
      </div>

      <HrWorkCalendar
        title={canManage ? "Calendar pontaj echipă" : "Calendar pontaj personal"}
        description="Calendarul rămâne vizibil în Pontaj. Apasă pe o zi pentru a ponta direct pe data respectivă."
        cursor={calendarCursor}
        onCursorChange={setCalendarCursor}
        hourRows={rows}
        leaveRows={leaveRows}
        canManage={canManage}
        teamUsers={teamUsers.data}
        myId={myId}
        selectedDate={date}
        onSelectDate={openPunchForDate}
      />

      <SectionCard
        title={canManage ? "Pontaj echipă" : "Pontaj personal"}
        description="Înregistrări recente cu productivitate, overtime și note."
      >
        {list.isLoading ? (
          <SkeletonList rows={3} />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyArt icon={Clock} title="Niciun pontaj" description="Înregistrează prima zi de muncă." />
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {[...rows]
              .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
              .slice(0, 20)
              .map((row) => {
                const overtime = Math.max(0, row.hours - 8);
                return (
                  <li key={row.id} className="px-2 py-3 flex items-center gap-3">
                    <span
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold",
                        overtime > 0 ? "bg-violet-500/12 text-violet-600" : "bg-foreground/5"
                      )}
                    >
                      {row.hours}h
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{fmtDate(row.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {canManage ? `${employeeName(teamUsers.data, row.user_id, myId)} · ` : ""}
                        {row.note || "Fără notă"}
                      </p>
                    </div>
                    <Badge variant={overtime > 0 ? "accent" : "success"}>
                      {overtime > 0 ? `+${overtime}h overtime` : "Productiv"}
                    </Badge>
                  </li>
                );
              })}
          </ul>
        )}
      </SectionCard>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Înregistrează pontaj"
        description="Alege ziua din calendar, apoi salvează orele productive sau overtime."
        width="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                const targetUserId =
                  canManage && Number(selectedUser || myId) > 0
                    ? Number(selectedUser || myId)
                    : myId;
                create.mutate({
                  user_id: targetUserId,
                  date,
                  hours: Number(hours) || 0,
                  note,
                });
                setNote("");
                setOpen(false);
              }}
            >
              Salvează
            </Button>
          </div>
        }
      >
        {canManage && (
          <Select
            label="Angajat"
            value={selectedUser || String(myId)}
            onChange={(event) => setSelectedUser(event.target.value)}
            options={userOptions}
          />
        )}
        <div className="rounded-2xl border border-border bg-background p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data selectată
              </p>
              <p className="text-sm font-medium mt-0.5">{fmtDate(date)}</p>
            </div>
            <Badge variant="accent">calendar</Badge>
          </div>
          <HrWorkCalendar
            title="Alege ziua de pontaj"
            cursor={drawerCursor}
            onCursorChange={setDrawerCursor}
            hourRows={rows}
            leaveRows={leaveRows}
            canManage={canManage}
            teamUsers={teamUsers.data}
            myId={myId}
            selectedDate={date}
            onSelectDate={setDate}
            compact
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Ore" type="number" value={hours} onChange={(event) => setHours(event.target.value)} />
        </div>
        <Textarea label="Notă" value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
      </Drawer>
    </div>
  );
}

function HrWorkCalendar({
  title,
  description,
  cursor,
  onCursorChange,
  hourRows,
  leaveRows,
  canManage,
  teamUsers,
  myId,
  selectedDate,
  onSelectDate,
  compact = false,
}: {
  title: string;
  description?: string;
  cursor: Date;
  onCursorChange: (next: Date) => void;
  hourRows: HrHour[];
  leaveRows: HrLeave[];
  canManage: boolean;
  teamUsers: TeamUserDTO[] | undefined;
  myId: number;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  compact?: boolean;
}) {
  const cells = buildMonthCells(cursor);
  const todayKey = dateKey(new Date());

  return (
    <section className="rounded-2xl border border-border bg-frame overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {cursor.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground mr-1">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" /> productiv</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> overtime</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> neproductiv</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            Luna trecută
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onCursorChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Azi
          </Button>
          <Button size="xs" variant="outline" onClick={() => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            Luna următoare
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-7 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/3">
        {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((day) => (
          <div key={day} className="px-2 py-1.5 text-center">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayHours = hourRows.filter((row) => dateKey(row.date) === cell.key);
          const totalHours = dayHours.reduce((acc, row) => acc + row.hours, 0);
          const overtime = Math.max(0, totalHours - 8);
          const dayLeaves = leaveRows.filter((leave) => dateKey(leave.from) <= cell.key && dateKey(leave.to) >= cell.key);
          const hasLeave = dayLeaves.some((leave) => leaveStatus(leave) === "approved" || leaveStatus(leave) === "pending");
          const selected = selectedDate === cell.key;
          const CellTag = onSelectDate ? "button" : "div";
          return (
            <CellTag
              key={cell.key}
              type={onSelectDate ? "button" : undefined}
              onClick={onSelectDate ? () => onSelectDate(cell.key) : undefined}
              className={cn(
                "w-full text-left border-b border-r border-border p-2 transition-colors",
                compact ? "min-h-[88px]" : "min-h-[124px]",
                onSelectDate && "hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/40",
                !cell.inMonth && "bg-foreground/2 text-muted-foreground/50",
                totalHours > 0 && "bg-[color:var(--accent)]/5",
                overtime > 0 && "bg-violet-500/10",
                hasLeave && totalHours === 0 && "bg-amber-500/8",
                selected && "ring-2 ring-inset ring-[color:var(--accent)] bg-[color:var(--accent)]/10"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    cell.key === todayKey && "rounded bg-foreground text-background px-1"
                  )}
                >
                  {cell.date.getDate()}
                </span>
                {dayHours.length > 0 && (
                  <Badge variant={overtime > 0 ? "accent" : "success"} className="text-[10px] px-1.5">
                    {totalHours}h
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {dayHours.slice(0, compact ? 1 : 2).map((row) => (
                  <p key={row.id} className="truncate rounded-md bg-background/75 px-1.5 py-1 text-[11px]">
                    {canManage ? `${employeeName(teamUsers, row.user_id, myId)} · ` : ""}
                    {Math.min(row.hours, 8)}h productive
                  </p>
                ))}
                {overtime > 0 && (
                  <p className="rounded-md bg-violet-500/15 px-1.5 py-1 text-[11px] text-violet-700 dark:text-violet-300">
                    +{overtime}h overtime
                  </p>
                )}
                {dayLeaves.slice(0, compact ? 1 : 2).map((leave) => (
                  <p key={leave.id} className="truncate rounded-md bg-amber-500/15 px-1.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                    {leave.leave_type} · {statusLabel(leaveStatus(leave))}
                  </p>
                ))}
              </div>
            </CellTag>
          );
        })}
      </div>
    </section>
  );
}

function CalendarTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const canManage = canManageHR(principal);
  const teamUsers = useTeamUsers(canManage);
  const teamsStore = useLocalTeams(principal?.kind === "user" ? principal.organisation_id : null);
  const hours = useCollectionList<HrHour>("hr-hours", "/hr/hours");
  const leaves = useCollectionList<HrLeave>("hr-leaves", "/hr/leaves");
  const [cursor, setCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [scope, setScope] = useState<HrScope>("all");
  const [teamId, setTeamId] = useState("");
  const selectedTeam = teamsStore.teams.find((team) => team.id === teamId);
  const hourRows = applyScope(
    visibleForHRAccess(hours.data ?? [], myId, canManage),
    myId,
    canManage,
    scope,
    selectedTeam
  );
  const leaveRows = applyScope(
    visibleForHRAccess(leaves.data ?? [], myId, canManage),
    myId,
    canManage,
    scope,
    selectedTeam
  );
  const cells = buildMonthCells(cursor);
  const todayKey = dateKey(new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <ScopeControls
          canManage={canManage}
          scope={scope}
          onScopeChange={setScope}
          teamId={teamId}
          onTeamChange={setTeamId}
          teams={teamsStore.teams}
        />
        <div className="flex items-center gap-2">
          <Button size="xs" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            Luna trecută
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Azi
          </Button>
          <Button size="xs" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            Luna următoare
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-frame overflow-hidden">
        <header className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {cursor.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" /> productiv</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> overtime</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> neproductiv</span>
          </div>
        </header>
        <div className="grid grid-cols-7 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/3">
          {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((day) => (
            <div key={day} className="px-2 py-1.5 text-center">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayHours = hourRows.filter((row) => dateKey(row.date) === cell.key);
            const totalHours = dayHours.reduce((acc, row) => acc + row.hours, 0);
            const overtime = Math.max(0, totalHours - 8);
            const dayLeaves = leaveRows.filter((leave) => dateKey(leave.from) <= cell.key && dateKey(leave.to) >= cell.key);
            const hasLeave = dayLeaves.some((leave) => leaveStatus(leave) === "approved" || leaveStatus(leave) === "pending");
            return (
              <div
                key={cell.key}
                className={cn(
                  "min-h-[118px] border-b border-r border-border p-2",
                  !cell.inMonth && "bg-foreground/2 text-muted-foreground/50",
                  totalHours > 0 && "bg-[color:var(--accent)]/5",
                  overtime > 0 && "bg-violet-500/10",
                  hasLeave && totalHours === 0 && "bg-amber-500/8"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-[11px] font-medium", cell.key === todayKey && "rounded bg-foreground text-background px-1")}>
                    {cell.date.getDate()}
                  </span>
                  {dayHours.length > 0 && <Badge variant={overtime > 0 ? "accent" : "success"}>{totalHours}h</Badge>}
                </div>
                <div className="mt-2 space-y-1">
                  {dayHours.slice(0, 2).map((row) => (
                    <p key={row.id} className="truncate rounded-md bg-background/75 px-1.5 py-1 text-[11px]">
                      {canManage ? `${employeeName(teamUsers.data, row.user_id, myId)} · ` : ""}
                      {Math.min(row.hours, 8)}h productive
                    </p>
                  ))}
                  {overtime > 0 && (
                    <p className="rounded-md bg-violet-500/15 px-1.5 py-1 text-[11px] text-violet-700 dark:text-violet-300">
                      +{overtime}h overtime
                    </p>
                  )}
                  {dayLeaves.slice(0, 2).map((leave) => (
                    <p key={leave.id} className="truncate rounded-md bg-amber-500/15 px-1.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                      {leave.leave_type} · {statusLabel(leaveStatus(leave))}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LeavesTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const canManage = canManageHR(principal);
  const teamUsers = useTeamUsers(canManage);
  const list = useCollectionList<HrLeave>("hr-leaves", "/hr/leaves");
  const create = useCollectionCreate<object, HrLeave>("hr-leaves", "/hr/leaves");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"odihna" | "medical" | "sabatic" | "maternal">("odihna");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const rows = visibleForHRAccess(list.data ?? [], myId, canManage);
  const userOptions = employeeOptions(teamUsers.data, myId);
  const groups: HrLeave["status"][] = ["pending", "approved", "rejected"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Cerere concediu
        </Button>
      </div>

      {list.isError && <ErrorState onRetry={() => list.refetch()} />}
      {list.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SkeletonList rows={2} />
          <SkeletonList rows={2} />
          <SkeletonList rows={2} />
        </div>
      )}
      {!list.isLoading && !list.isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {groups.map((group) => {
            const items = rows.filter((leave) => leaveStatus(leave) === group);
            return (
              <SectionCard
                key={group}
                title={<span>{statusLabel(group)}</span>}
                description={`${items.length} cereri`}
                padding="sm"
              >
                <div className="space-y-2">
                  {items.map((leave) => (
                    <article key={leave.id} className="rounded-xl border border-border p-3 bg-frame">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold capitalize">{leave.leave_type}</p>
                        <Badge variant={statusVariant(leaveStatus(leave))}>{statusLabel(leaveStatus(leave))}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(leave.from)} - {fmtDate(leave.to)}
                      </p>
                      {canManage && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {employeeName(teamUsers.data, leave.user_id, myId)}
                        </p>
                      )}
                      {leave.note && <p className="text-xs text-muted-foreground mt-1">{leave.note}</p>}
                    </article>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                      Nimic.
                    </p>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Cerere de concediu"
        description="Selectează tipul, intervalul și opțional o notă."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                const targetUserId =
                  canManage && Number(selectedUser || myId) > 0
                    ? Number(selectedUser || myId)
                    : myId;
                create.mutate({
                  user_id: targetUserId,
                  leave_type: type,
                  from,
                  to,
                  status: "pending",
                  note,
                });
                setNote("");
                setOpen(false);
              }}
            >
              <CalendarRange className="w-4 h-4" /> Trimite cererea
            </Button>
          </div>
        }
      >
        {canManage && (
          <Select
            label="Angajat"
            value={selectedUser || String(myId)}
            onChange={(event) => setSelectedUser(event.target.value)}
            options={userOptions}
          />
        )}
        <SegmentedControl
          value={type}
          onChange={setType}
          options={[
            { id: "odihna", label: "Odihnă" },
            { id: "medical", label: "Medical" },
            { id: "sabatic", label: "Sabatic" },
            { id: "maternal", label: "Maternal" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="De la" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input label="Până la" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <Textarea label="Notă" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </Drawer>
    </div>
  );
}

function CertificatesTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const canManage = canManageHR(principal);
  const teamUsers = useTeamUsers(canManage);
  const [selectedUser, setSelectedUser] = useState("");
  const [requests, setRequests] = useState<LocalCertificateRequest[]>(readCertificateRequests);
  const userOptions = employeeOptions(teamUsers.data, myId);
  const create = useCollectionCreate<object, { request_id: number }>(
    "hr-certificates",
    "/hr/certificates"
  );
  const cards = [
    {
      title: "Adeverință angajat",
      description: "Pentru bancă, autorități sau cazare. Intră în flux de aprobare.",
      type: "employee_certificate",
    },
    {
      title: "Adeverință venit",
      description: "Cu venitul calculat pe ultimele 6 luni. Intră în flux de aprobare.",
      type: "income_certificate",
    },
  ];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="max-w-sm">
          <Select
            label="Angajat"
            value={selectedUser || String(myId)}
            onChange={(event) => setSelectedUser(event.target.value)}
            options={userOptions}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <article key={card.type} className="relative overflow-hidden rounded-2xl border border-border bg-frame p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/15 to-transparent pointer-events-none" />
            <div className="relative">
              <FileSignature className="w-6 h-6 text-foreground/70 mb-2" />
              <h3 className="text-base font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
              <Button
                className="mt-4"
                size="sm"
                loading={create.isPending}
                onClick={() => {
                  const targetUserId =
                    canManage && Number(selectedUser || myId) > 0
                      ? Number(selectedUser || myId)
                      : myId;
                  const localId = Date.now();
                  const baseRequest: LocalCertificateRequest = {
                    id: localId,
                    type: card.type,
                    user_id: targetUserId,
                    status: "pending",
                    created_at: new Date().toISOString(),
                    note: "backend pending",
                  };
                  create.mutate(
                    { type: card.type, user_id: targetUserId },
                    {
                      onSuccess: (response) => {
                        const saved = upsertCertificateRequest({
                          ...baseRequest,
                          id: response.request_id || localId,
                          request_id: response.request_id || localId,
                          note: "înregistrată",
                        });
                        setRequests(saved);
                      },
                      onError: () => {
                        setRequests(upsertCertificateRequest(baseRequest));
                      },
                    }
                  );
                }}
              >
                Solicită acum
              </Button>
            </div>
          </article>
        ))}
      </div>
      <SectionCard title="Cereri de adeverințe" description="Stare locală până există endpoint de listare/aprobare.">
        {requests.length === 0 ? (
          <EmptyArt icon={FileSignature} title="Nicio cerere" description="Solicitările tale vor apărea aici." />
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {requests.map((request) => (
              <li key={request.id} className="px-2 py-3 flex items-center gap-3">
                <Avatar name={employeeName(teamUsers.data, request.user_id, myId)} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{request.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {employeeName(teamUsers.data, request.user_id, myId)} · {fmtRelative(request.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function ApprovalsTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? (principal.membership_id ?? 0) : 0;
  const actorName =
    principal?.kind === "user"
      ? `${principal.first_name} ${principal.last_name}`.trim() || principal.email
      : "Sistem";
  const canManage = canManageHR(principal);
  const teamUsers = useTeamUsers(canManage);
  const leaves = useCollectionList<HrLeave>("hr-leaves", "/hr/leaves");
  const [version, setVersion] = useState(0);
  const certificateRows = useMemo(
    () =>
      readCertificateRequests().filter((request) =>
        canManage ? true : request.user_id === myId
      ),
    [canManage, myId, version]
  );
  const leaveRows = (visibleForHRAccess(leaves.data ?? [], myId, canManage)).map((leave) => ({
    ...leave,
    status: leaveStatus(leave),
  }));
  const pendingLeaves = leaveRows.filter((leave) => leave.status === "pending");
  const pendingCertificates = certificateRows.filter((request) => request.status === "pending");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <SectionCard
        title={canManage ? "Aprobări concedii" : "Status concedii"}
        description={canManage ? "Aprobările sunt locale până backend expune endpoint-urile." : "Vezi statusul cererilor tale."}
      >
        {leaves.isLoading ? (
          <SkeletonList rows={3} />
        ) : leaves.isError ? (
          <ErrorState onRetry={() => leaves.refetch()} />
        ) : pendingLeaves.length === 0 ? (
          <EmptyArt icon={Sun} title="Nicio cerere pending" description="Cererile noi vor intra aici." />
        ) : (
          <div className="space-y-2">
            {pendingLeaves.map((leave) => (
              <ApprovalRow
                key={leave.id}
                title={`${leave.leave_type} · ${fmtDate(leave.from)} - ${fmtDate(leave.to)}`}
                subtitle={employeeName(teamUsers.data, leave.user_id, myId)}
                canManage={canManage}
                onApprove={() => {
                  saveLeaveApproval(leave.id, "approved", actorName);
                  setVersion((value) => value + 1);
                }}
                onReject={() => {
                  saveLeaveApproval(leave.id, "rejected", actorName);
                  setVersion((value) => value + 1);
                }}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={canManage ? "Aprobări adeverințe" : "Status adeverințe"}
        description="Cereri locale, marcate backend pending pentru listare și aprobare reală."
      >
        {pendingCertificates.length === 0 ? (
          <EmptyArt icon={FileSignature} title="Nicio adeverință pending" description="Solicitările noi vor intra aici." />
        ) : (
          <div className="space-y-2">
            {pendingCertificates.map((request) => (
              <ApprovalRow
                key={request.id}
                title={request.type.replaceAll("_", " ")}
                subtitle={`${employeeName(teamUsers.data, request.user_id, myId)} · ${fmtRelative(request.created_at)}`}
                canManage={canManage}
                onApprove={() => {
                  updateCertificateStatus(request.id, "approved");
                  setVersion((value) => value + 1);
                }}
                onReject={() => {
                  updateCertificateStatus(request.id, "rejected");
                  setVersion((value) => value + 1);
                }}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = "text-foreground/50",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <SectionCard padding="sm">
      <div className="p-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-0.5">{value}</p>
        </div>
        <div className={tone}>{icon}</div>
      </div>
    </SectionCard>
  );
}

function ApprovalRow({
  title,
  subtitle,
  canManage,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  canManage: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-frame p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold capitalize truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 inline-flex items-center gap-1">
          <Hourglass className="w-3 h-3" /> backend pending
        </p>
      </div>
      {canManage ? (
        <div className="flex items-center gap-2">
          <Button size="xs" variant="outline" onClick={onReject}>
            <XCircle className="w-3.5 h-3.5" /> Respinge
          </Button>
          <Button size="xs" onClick={onApprove}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobă
          </Button>
        </div>
      ) : (
        <Badge variant="warning">În așteptare</Badge>
      )}
    </article>
  );
}
