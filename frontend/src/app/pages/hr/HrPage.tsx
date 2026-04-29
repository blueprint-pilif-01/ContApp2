import { useState } from "react";
import {
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSignature,
  Plus,
  Star,
  Sun,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs, TabPanel } from "../../../components/ui/Tabs";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
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
import { fmtDate, fmtRelative } from "../../../lib/utils";

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
type HrReview = {
  id: number;
  user_id: number;
  reviewer_id: number;
  score: number;
  summary: string;
  date_added: string;
};

export default function HrPage() {
  const [active, setActive] = useState("hours");

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR"
        description="Pontaj, concedii, review-uri și cereri de adeverințe."
      />
      <Tabs
        tabs={[
          { id: "hours", label: "Pontaj", icon: <Clock className="w-3.5 h-3.5" /> },
          { id: "leave", label: "Concedii", icon: <Sun className="w-3.5 h-3.5" /> },
          { id: "reviews", label: "Reviews", icon: <Star className="w-3.5 h-3.5" /> },
          { id: "certificates", label: "Adeverințe", icon: <FileSignature className="w-3.5 h-3.5" /> },
        ]}
        active={active}
        onChange={setActive}
      />
      <TabPanel id="hours" active={active}>
        <HoursTab />
      </TabPanel>
      <TabPanel id="leave" active={active}>
        <LeavesTab />
      </TabPanel>
      <TabPanel id="reviews" active={active}>
        <ReviewsTab />
      </TabPanel>
      <TabPanel id="certificates" active={active}>
        <CertificatesTab />
      </TabPanel>
    </div>
  );
}

function HoursTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? principal.id : 0;
  const list = useCollectionList<HrHour>("hr-hours", "/hr/hours");
  const create = useCollectionCreate<object, HrHour>("hr-hours", "/hr/hours");
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("8");
  const [note, setNote] = useState("");

  const totalThisMonth = (list.data ?? [])
    .filter((h) => new Date(h.date).getMonth() === new Date().getMonth())
    .reduce((acc, h) => acc + h.hours, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SectionCard padding="sm">
          <div className="p-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total luna</p>
              <p className="text-2xl font-semibold mt-0.5">{totalThisMonth}h</p>
            </div>
            <Clock className="w-5 h-5 text-foreground/40" />
          </div>
        </SectionCard>
        <SectionCard padding="sm">
          <div className="p-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Înregistrări</p>
              <p className="text-2xl font-semibold mt-0.5">{(list.data ?? []).length}</p>
            </div>
            <ClipboardList className="w-5 h-5 text-foreground/40" />
          </div>
        </SectionCard>
        <SectionCard padding="sm">
          <div className="p-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Productivitate</p>
              <p className="text-2xl font-semibold mt-0.5 text-foreground">+8%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-foreground/60" />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Istoric pontaj"
        description="Înregistrările tale recente."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Înregistrează
          </Button>
        }
      >
        {list.isLoading ? (
          <SkeletonList rows={3} />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyArt icon={Clock} title="Niciun pontaj" description="Înregistrează prima zi de muncă." />
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {(list.data ?? []).map((row) => (
              <li key={row.id} className="px-2 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-sm font-semibold">
                  {row.hours}h
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{fmtDate(row.date)}</p>
                  <p className="text-xs text-muted-foreground">{row.note || "Fără notă"}</p>
                </div>
                <Badge variant="success">Înregistrat</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Înregistrează ore"
        description="Adaugă manual ore lucrate pentru ziua curentă."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                create.mutate({
                  user_id: myId,
                  date: new Date().toISOString().slice(0, 10),
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
        <Input label="Ore" type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
        <Textarea label="Notă" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </Drawer>
    </div>
  );
}

function LeavesTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? principal.id : 0;
  const list = useCollectionList<HrLeave>("hr-leaves", "/hr/leaves");
  const create = useCollectionCreate<object, HrLeave>("hr-leaves", "/hr/leaves");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"odihna" | "medical" | "sabatic" | "maternal">("odihna");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const groups: HrLeave["status"][] = ["pending", "approved", "rejected"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Cerere concediu
        </Button>
      </div>

      {list.isError && (
        <ErrorState onRetry={() => list.refetch()} />
      )}
      {list.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SkeletonList rows={2} />
          <SkeletonList rows={2} />
          <SkeletonList rows={2} />
        </div>
      )}
      {!list.isLoading && !list.isError && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groups.map((g) => {
          const items = (list.data ?? []).filter((l) => l.status === g);
          return (
            <SectionCard
              key={g}
              title={
                <span className="capitalize">
                  {g === "pending" ? "În așteptare" : g === "approved" ? "Aprobate" : "Respinse"}
                </span>
              }
              description={`${items.length} cereri`}
              padding="sm"
            >
              <div className="space-y-2">
                {items.map((leave) => (
                  <article
                    key={leave.id}
                    className="rounded-xl border border-border p-3 bg-frame"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold capitalize">{leave.leave_type}</p>
                      <Badge
                        variant={
                          leave.status === "approved"
                            ? "success"
                            : leave.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(leave.from)} → {fmtDate(leave.to)}
                    </p>
                    {leave.note && (
                      <p className="text-xs text-muted-foreground mt-1">{leave.note}</p>
                    )}
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
                create.mutate({
                  user_id: myId,
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
          <Input label="De la" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Până la" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Textarea label="Notă" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Drawer>
    </div>
  );
}

function ReviewsTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? principal.id : 0;
  const list = useCollectionList<HrReview>("hr-reviews", "/hr/reviews");
  const create = useCollectionCreate<object, HrReview>("hr-reviews", "/hr/reviews");
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(4);
  const [summary, setSummary] = useState("");
  const [reviewedUser, setReviewedUser] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Review nou
        </Button>
      </div>
      <SectionCard title="Review-uri ale echipei" description="Evaluări recente cu scor și sumar.">
        {list.isLoading ? (
          <SkeletonList rows={3} />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyArt icon={Star} title="Niciun review" description="Salvează primul review pentru un coleg." />
        ) : (
          <ol className="relative border-l border-border pl-5 space-y-4">
            {(list.data ?? []).map((review) => (
              <li key={review.id} className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-foreground" />
                <div className="rounded-2xl border border-border bg-frame p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={`User ${review.user_id}`} size="xs" />
                      <p className="text-sm font-semibold">User #{review.user_id}</p>
                    </div>
                    <Badge variant="accent">{review.score} / 5</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.summary}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                    {fmtRelative(review.date_added)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Review angajat"
        description="Salvează un review pentru istoric."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                const targetId = Number.parseInt(reviewedUser, 10);
                if (!Number.isFinite(targetId) || targetId <= 0) return;
                create.mutate({
                  user_id: targetId,
                  reviewer_id: myId,
                  score,
                  summary,
                });
                setSummary("");
                setReviewedUser("");
                setOpen(false);
              }}
            >
              <ClipboardCheck className="w-4 h-4" /> Salvează
            </Button>
          </div>
        }
      >
        <Input
          label="ID coleg evaluat"
          type="number"
          value={reviewedUser}
          onChange={(e) => setReviewedUser(e.target.value)}
          placeholder="ex: 2"
          hint="ID-ul utilizatorului din echipă (vezi Settings → Users)."
        />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className={`w-8 h-8 rounded-full font-semibold text-sm ${score >= s ? "bg-[color:var(--accent)] text-foreground" : "bg-foreground/5 text-muted-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <Textarea label="Feedback" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
      </Drawer>
    </div>
  );
}

function CertificatesTab() {
  const principal = usePrincipal();
  const myId = principal?.kind === "user" ? principal.id : 0;
  const create = useCollectionCreate<object, { request_id: number }>(
    "hr-certificates",
    "/hr/certificates"
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        {
          title: "Adeverință angajat",
          description: "Pentru bancă, autorități sau cazare. Generare instant.",
          type: "employee_certificate",
          accent: "from-[color:var(--accent)]/25 to-transparent",
        },
        {
          title: "Adeverință venit",
          description: "Cu venitul calculat pe ultimele 6 luni.",
          type: "income_certificate",
          accent: "from-foreground/8 to-transparent",
        },
      ].map((card) => (
        <article
          key={card.type}
          className={`relative overflow-hidden rounded-2xl border border-border bg-frame p-5`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} pointer-events-none`} />
          <div className="relative">
            <FileSignature className="w-6 h-6 text-foreground/70 mb-2" />
            <h3 className="text-base font-semibold">{card.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => create.mutate({ type: card.type, user_id: myId })}
            >
              Solicită acum
            </Button>
            {create.data && (
              <p className="text-xs text-muted-foreground mt-3">
                Cerere înregistrată #{create.data.request_id}.
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
