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
  Hash,
  Activity,
  Send,
  Users,
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
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
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
  const identifier = client ? clientIdentifier(client) : "—";
  const fullName = client
    ? isCompany && companyName
      ? companyName
      : `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim()
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
    client_type: "person",
    first_name: "",
    last_name: "",
    cnp: "",
    company_name: "",
    cui: "",
    tva: false,
    responsible_name: "",
    responsible_email: "",
    email: "",
    phone: "",
    status: "active",
    address: "",
  });

  const startEdit = () => {
    if (!client) return;
    const editingCompany = client.client_type === "company";
    setForm({
      client_type: editingCompany ? "company" : "person",
      first_name: editingCompany ? "" : client.first_name ?? "",
      last_name: editingCompany ? "" : client.last_name ?? "",
      cnp: editingCompany ? null : client.cnp != null ? String(client.cnp) : "",
      company_name: editingCompany ? client.company_name ?? "" : "",
      cui: editingCompany
        ? client.cui != null
          ? String(client.cui)
          : client.cnp != null
            ? String(client.cnp)
            : ""
        : null,
      tva: editingCompany ? Boolean(client.tva) : null,
      responsible_name: editingCompany ? client.responsible_name ?? "" : null,
      responsible_email: editingCompany ? client.responsible_email ?? "" : null,
      email: client.email ?? "",
      phone: client.phone ?? "",
      status: client.status ?? "active",
      address: client.address ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const formCompany = form.client_type === "company";
      await updateClient.mutateAsync({
        ...form,
        first_name: formCompany ? null : form.first_name?.trim() || null,
        last_name: formCompany ? null : form.last_name?.trim() || null,
        cnp: formCompany ? null : form.cnp ? String(form.cnp).trim() : null,
        company_name: formCompany ? form.company_name?.trim() || null : null,
        cui: formCompany ? form.cui ? String(form.cui).trim() : null : null,
        tva: formCompany ? Boolean(form.tva) : null,
        responsible_name: formCompany
          ? form.responsible_name?.trim() || null
          : null,
        responsible_email: formCompany
          ? form.responsible_email?.trim() || null
          : null,
      });
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
        [k]: v,
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
        description={`ID #${numericId} · ${isCompany ? "CUI" : "CNP"} ${identifier}`}
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
                <div className="sm:col-span-2">
                  <SegmentedControl
                    value={form.client_type}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        client_type: value,
                      }))
                    }
                    options={[
                      { id: "person", label: "Persoană fizică" },
                      { id: "company", label: "Companie" },
                    ]}
                  />
                </div>
                {form.client_type === "company" ? (
                  <>
                    <Input
                      label="Nume firmă"
                      value={form.company_name ?? ""}
                      onChange={set("company_name")}
                    />
                    <Input
                      label="CUI"
                      value={form.cui ?? ""}
                      onChange={set("cui")}
                    />
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(form.tva)}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            tva: e.target.checked,
                          }))
                        }
                      />
                      Plătitor TVA
                    </label>
                    <div />
                    <Input
                      label="Persoană responsabilă"
                      value={form.responsible_name ?? ""}
                      onChange={set("responsible_name")}
                    />
                    <Input
                      label="Email responsabil"
                      type="email"
                      value={form.responsible_email ?? ""}
                      onChange={set("responsible_email")}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Prenume"
                      value={form.first_name ?? ""}
                      onChange={set("first_name")}
                    />
                    <Input
                      label="Nume"
                      value={form.last_name ?? ""}
                      onChange={set("last_name")}
                    />
                    <Input
                      label="CNP"
                      value={form.cnp ?? ""}
                      onChange={set("cnp")}
                    />
                  </>
                )}
                <Input
                  label="Status"
                  value={form.status ?? ""}
                  onChange={set("status")}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={set("email")}
                  />
                </div>
                <Input
                  label="Telefon"
                  value={form.phone ?? ""}
                  onChange={set("phone")}
                />
                <Input
                  label="Adresă"
                  value={form.address ?? ""}
                  onChange={set("address")}
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
                    value={`${isCompany ? "CUI" : "CNP"} ${identifier}`}
                  />
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    value={client.email ?? "—"}
                    href={client.email ? `mailto:${client.email}` : undefined}
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
                  {isCompany && client.responsible_name && (
                    <InfoRow
                      icon={<Users className="w-4 h-4" />}
                      value={client.responsible_name}
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

function clientIdentifier(client: {
  client_type?: string | null;
  cnp?: string | number | null;
  cui?: string | number | null;
}): string {
  const value =
    client.client_type === "company" ? client.cui ?? client.cnp : client.cnp;
  return value == null || value === "" ? "—" : String(value);
}

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
  href?: string | undefined;
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
