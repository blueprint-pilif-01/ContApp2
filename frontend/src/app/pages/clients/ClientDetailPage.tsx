import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Trash2,
  FileText,
  Folder,
  StickyNote,
  KanbanSquare,
  Hash,
  Activity,
  Send,
} from "lucide-react";
import {
  useClient,
  useUpdateClient,
  useDeleteClient,
  type ClientUpsertRequest,
} from "../../../hooks/useClients";
import { useSetBreadcrumbLabel } from "../../../components/ui/BreadcrumbContext";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Tabs, TabPanel } from "../../../components/ui/Tabs";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { ActivityTimeline, type ActivityItem } from "../../../components/ui/ActivityTimeline";
import { useCollectionList } from "../../../hooks/useCollection";
import { fmtRelative, initials } from "../../../lib/utils";
import { isApiError } from "../../../lib/api";
import { ContractsTab } from "./tabs/ContractsTab";
import { DossierTab } from "./tabs/DossierTab";
import { NotesTab } from "./tabs/NotesTab";
import { TicketsTab } from "./tabs/TicketsTab";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number.parseInt(id ?? "", 10);
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("contracts");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setBreadcrumbLabel = useSetBreadcrumbLabel();
  const { data: client, isLoading, isError, refetch } = useClient(
    Number.isFinite(numericId) ? numericId : undefined
  );
  const invites = useCollectionList<ClientInvite>("client-invites", "/contracts/invites");
  const submissions = useCollectionList<ClientSubmission>("client-submissions", "/contracts/submissions");

  const isCompany = (client as { client_type?: string } | undefined)?.client_type === "company";
  const companyName = (client as { company_name?: string } | undefined)?.company_name ?? "";
  const fullName = client
    ? isCompany && companyName
      ? companyName
      : `${client.first_name} ${client.last_name}`.trim()
    : "";

  useEffect(() => {
    if (fullName) setBreadcrumbLabel(fullName);
    return () => setBreadcrumbLabel(undefined);
  }, [fullName, setBreadcrumbLabel]);

  const updateClient = useUpdateClient(numericId);
  const deleteClient = useDeleteClient();

  const clientInvites = useMemo(
    () => (invites.data ?? []).filter((invite) => invite.client_id === numericId),
    [invites.data, numericId]
  );
  const clientSubmissions = useMemo(
    () => (submissions.data ?? []).filter((submission) => submission.client_id === numericId),
    [submissions.data, numericId]
  );
  const activeInvites = clientInvites.filter((invite) => invite.status !== "signed" && invite.status !== "expired");
  const activityItems: ActivityItem[] = useMemo(() => {
    const rows: ActivityItem[] = [
      ...clientInvites.map((invite) => ({
        id: `invite-${invite.id}`,
        title: `Solicitare contract #${invite.id}`,
        description: `Status ${invite.status} · template #${invite.template_id}`,
        at: fmtRelative(invite.date_added),
        icon: <Send className="w-4 h-4" />,
        tone: invite.status === "expired" ? "danger" as const : "info" as const,
      })),
      ...clientSubmissions.map((submission) => ({
        id: `submission-${submission.id}`,
        title: `Contract semnat #${submission.id}`,
        description: submission.remarks || `Invitație #${submission.invite_id}`,
        at: fmtRelative(submission.date_added),
        icon: <FileText className="w-4 h-4" />,
        tone: "success" as const,
      })),
    ];
    return rows.slice().sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);
  }, [clientInvites, clientSubmissions]);

  const [form, setForm] = useState<ClientUpsertRequest>({
    cnp: 0,
    user_id: 0,
    organisation_id: 0,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "",
    address: "",
    signature_id: 0,
  });

  const startEdit = () => {
    if (!client) return;
    setForm({
      cnp: client.cnp,
      user_id: client.user_id,
      organisation_id: client.organisation_id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      address: client.address,
      signature_id: client.signature_id,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync(form);
      toast.success("Client actualizat.");
      setEditing(false);
      refetch();
    } catch (e) {
      toast.error(
        isApiError(e) ? e.message : "Nu s-a putut actualiza clientul."
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(numericId);
      toast.success("Client șters.");
      navigate("/app/clients");
    } catch (e) {
      toast.error(
        isApiError(e) ? e.message : "Nu s-a putut șterge clientul."
      );
    }
  };

  const set = <K extends keyof ClientUpsertRequest>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((p) => ({
        ...p,
        [k]:
          k === "cnp" ||
          k === "user_id" ||
          k === "organisation_id" ||
          k === "signature_id"
            ? Number.parseInt(v, 10) || 0
            : v,
      }));
    };

  const tabs = [
    {
      id: "contracts",
      label: "Contracte",
      icon: <FileText className="w-4 h-4" />,
    },
    { id: "dossier", label: "Dosar", icon: <Folder className="w-4 h-4" /> },
    { id: "notes", label: "Note", icon: <StickyNote className="w-4 h-4" /> },
    { id: "tickets", label: "Tickete", icon: <KanbanSquare className="w-4 h-4" /> },
    { id: "activity", label: "Activitate", icon: <Activity className="w-4 h-4" /> },
  ];

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Client invalid" />
        <Link to="/app/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" /> Înapoi la clienți
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!client) return null;

  return (
    <div>
      <PageHeader
        title={fullName || `Client #${numericId}`}
        description={`ID #${numericId} · ${isCompany ? "CUI" : "CNP"} ${client.cnp}`}
        actions={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="w-4 h-4" />
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={updateClient.isPending}
                >
                  <Save className="w-4 h-4" />
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit2 className="w-4 h-4" />
                  Editează
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Șterge
                </Button>
              </>
            )}
          </div>
        }
      />

      <button
        onClick={() => navigate("/app/clients")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Înapoi la clienți
      </button>

      <div className="bg-frame border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center text-xl font-bold text-accent shrink-0">
            {initials(fullName || "?")}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prenume"
                  value={form.first_name}
                  onChange={set("first_name")}
                />
                <Input
                  label="Nume"
                  value={form.last_name}
                  onChange={set("last_name")}
                />
                <Input
                  label="CNP"
                  type="number"
                  value={form.cnp}
                  onChange={set("cnp")}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={set("status")}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
                <Input
                  label="Telefon"
                  value={form.phone}
                  onChange={set("phone")}
                />
                <Input
                  label="Adresă"
                  value={form.address}
                  onChange={set("address")}
                />
                <Input
                  label="Organisation ID"
                  type="number"
                  value={form.organisation_id}
                  onChange={set("organisation_id")}
                />
                <Input
                  label="User ID"
                  type="number"
                  value={form.user_id}
                  onChange={set("user_id")}
                />
                <Input
                  label="Signature ID"
                  type="number"
                  value={form.signature_id}
                  onChange={set("signature_id")}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {fullName}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3 min-w-0">
                  <InfoRow
                    icon={<Hash className="w-4 h-4" />}
                    value={`CNP ${client.cnp}`}
                  />
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    value={client.email}
                    href={`mailto:${client.email}`}
                  />
                  {client.phone && (
                    <InfoRow
                      icon={<Phone className="w-4 h-4" />}
                      value={client.phone}
                      href={`tel:${client.phone}`}
                    />
                  )}
                  {client.address && (
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      value={client.address}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniMetric label="Solicitări" value={clientInvites.length} />
        <MiniMetric label="Active" value={activeInvites.length} />
        <MiniMetric label="Semnate" value={clientSubmissions.filter((s) => s.status === "signed").length} />
        <MiniMetric label="Ultima activitate" value={activityItems[0]?.at ?? "—"} compact />
      </div>

      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-0"
      />
      <TabPanel id="contracts" active={activeTab}>
        <ContractsTab clientId={numericId} />
      </TabPanel>
      <TabPanel id="dossier" active={activeTab}>
        <DossierTab clientId={numericId} />
      </TabPanel>
      <TabPanel id="notes" active={activeTab}>
        <NotesTab clientId={numericId} />
      </TabPanel>
      <TabPanel id="tickets" active={activeTab}>
        <TicketsTab clientId={numericId} />
      </TabPanel>
      <TabPanel id="activity" active={activeTab}>
        <div className="bg-frame border border-border rounded-2xl p-5 mt-4">
          <ActivityTimeline items={activityItems} empty="Nu există activitate pentru acest client." />
        </div>
      </TabPanel>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Șterge client"
        description={`Ești sigur că vrei să ștergi clientul "${fullName}"? Datele nu pot fi recuperate.`}
        confirmLabel="Șterge client"
      />
    </div>
  );
}

type ClientInvite = {
  id: number;
  template_id: number;
  client_id: number;
  status: string;
  date_added: string;
};

type ClientSubmission = {
  id: number;
  invite_id: number;
  client_id: number;
  status: string;
  remarks: string;
  date_added: string;
};

function MiniMetric({
  label,
  value,
  compact,
}: {
  label: string;
  value: number | string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-frame p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={compact ? "text-sm font-semibold mt-1 truncate" : "text-2xl font-semibold mt-1"}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const cls = "flex items-center gap-2 text-sm text-foreground/80 min-w-0";
  const iconEl = <span className="text-muted-foreground shrink-0">{icon}</span>;
  const content = (
    <>
      {iconEl}
      <span className="truncate">{value}</span>
    </>
  );
  if (href)
    return (
      <a href={href} className={cls + " hover:text-accent"}>
        {content}
      </a>
    );
  return <div className={cls}>{content}</div>;
}
