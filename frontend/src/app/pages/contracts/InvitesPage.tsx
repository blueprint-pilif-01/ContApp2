import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Copy,
  ExternalLink,
  FileEdit,
  RefreshCw,
  Send,
  ShieldX,
  TimerOff,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Drawer } from "../../../components/ui/Drawer";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { ActivityTimeline, type ActivityItem } from "../../../components/ui/ActivityTimeline";
import { ErrorState } from "../../../components/ui/EmptyState";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import {
  useCollectionAction,
  useCollectionCreate,
  useCollectionList,
  useCollectionUpdate,
} from "../../../hooks/useCollection";
import { fmtDate, fmtRelative } from "../../../lib/utils";

type InviteStatus = "draft" | "sent" | "viewed" | "signed" | "expired" | "revoked";

type Invite = {
  id: number;
  template_id: number;
  client_id: number;
  user_id?: number;
  remarks: string;
  expiration_date: string;
  status: InviteStatus;
  public_token?: string;
  date_added: string;
  date_modified?: string;
};

type Template = { id: number; name: string; contract_type: string };
type ClientRow = {
  id: number;
  client_type?: "person" | "company";
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email: string;
};
type InviteSendResponse = {
  message?: string;
  invite?: Invite;
  public_url?: string | null;
};

const pipeline: { state: InviteStatus; label: string; dot: string; chip: string }[] = [
  { state: "draft", label: "Draft", dot: "bg-foreground/30", chip: "bg-foreground/8 text-muted-foreground" },
  { state: "sent", label: "Trimis", dot: "bg-foreground/60", chip: "bg-foreground/10 text-foreground" },
  { state: "viewed", label: "Vizualizat", dot: "bg-foreground", chip: "bg-foreground/15 text-foreground" },
  { state: "signed", label: "Semnat", dot: "bg-[color:var(--accent)]", chip: "bg-[color:var(--accent)]/20 text-foreground" },
  { state: "expired", label: "Expirat", dot: "bg-red-500", chip: "bg-red-500/12 text-red-600 dark:text-red-400" },
  { state: "revoked", label: "Revocat", dot: "bg-amber-500", chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
];

function clientDisplay(client: ClientRow): string {
  if (client.client_type === "company" && client.company_name) {
    return client.company_name;
  }
  return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || `Client #${client.id}`;
}

export default function InvitesPage() {
  const toast = useToast();
  const list = useCollectionList<Invite>("invites-list", "/contracts/invites");
  const templates = useCollectionList<Template>("templates-list", "/contracts/templates");
  const clients = useCollectionList<ClientRow>("clients-list", "/clients");
  const create = useCollectionCreate<object, Invite>(
    "invites-list",
    "/contracts/invites"
  );
  const send = useCollectionAction<InviteSendResponse>(
    "invites-list",
    (id) => `/contracts/invites/${id}/send`
  );
  const update = useCollectionUpdate<object, Invite>(
    "invites-list",
    (id) => `/contracts/invites/${id}`
  );
  const [creating, setCreating] = useState(false);
  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [expiration, setExpiration] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (!templateId && templates.data?.length) {
      setTemplateId(String(templates.data[0]!.id));
    }
  }, [templates.data, templateId]);
  useEffect(() => {
    if (!clientId && clients.data?.length) {
      setClientId(String(clients.data[0]!.id));
    }
  }, [clients.data, clientId]);

  const invites = list.data ?? [];
  const groups = useMemo(
    () =>
      pipeline.map((p) => ({
        ...p,
        rows: invites.filter((i) => i.status === p.state),
      })),
    [invites]
  );

  const templateOptions = (templates.data ?? []).map((t) => ({
    value: String(t.id),
    label: `${t.name} · ${t.contract_type}`,
  }));
  const clientOptions = (clients.data ?? []).map((c) => ({
    value: String(c.id),
    label: `${clientDisplay(c)} · ${c.email}`,
  }));

  const canCreate = !!templateId && !!clientId && !!expiration;

  const clientName = (clientIdValue: number) => {
    const client = clients.data?.find((c) => c.id === clientIdValue);
    return client ? clientDisplay(client) : `Client #${clientIdValue}`;
  };

  const templateName = (templateIdValue: number) => {
    const template = templates.data?.find((t) => t.id === templateIdValue);
    return template ? template.name : `Template #${templateIdValue}`;
  };

  const publicUrl = (invite: Invite) =>
    `${window.location.origin}/public/sign/${invite.public_token || `tok-${invite.id}`}`;

  const handleCreate = () => {
    if (!canCreate) return;
    create.mutate(
      {
        template_id: Number(templateId),
        client_id: Number(clientId),
        remarks: remarks.trim(),
        expiration_date: new Date(expiration).toISOString(),
        status: "draft",
      },
      {
        onSuccess: () => {
          toast.success("Solicitare creată.");
          setRemarks("");
          setCreating(false);
        },
        onError: () => toast.error("Solicitarea nu a putut fi creată."),
      }
    );
  };

  const updateInviteStatus = (invite: Invite, status: InviteStatus, message: string) => {
    update.mutate(
      { id: invite.id, payload: { ...invite, status } },
      {
        onSuccess: () => {
          toast.success(message);
          setActiveInvite((current) => current && current.id === invite.id ? { ...invite, status } : current);
        },
        onError: () => toast.error("Acțiunea nu a putut fi salvată."),
      }
    );
  };

  const sendInvite = (invite: Invite, message: string) => {
    send.mutate(
      { id: invite.id },
      {
        onSuccess: (response) => {
          toast.success(message);
          if (response?.invite) {
            setActiveInvite((current) =>
              current && current.id === invite.id ? response.invite ?? current : current
            );
            return;
          }
          setActiveInvite((current) =>
            current && current.id === invite.id
              ? { ...invite, status: "sent", date_modified: new Date().toISOString() }
              : current
          );
        },
        onError: () => toast.error("Acțiunea nu a putut fi salvată."),
      }
    );
  };

  const duplicateInvite = (invite: Invite) => {
    create.mutate(
      {
        template_id: invite.template_id,
        client_id: invite.client_id,
        remarks: invite.remarks,
        expiration_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        status: "draft",
      },
      {
        onSuccess: () => toast.success("Solicitare duplicată ca draft."),
        onError: () => toast.error("Solicitarea nu a putut fi duplicată."),
      }
    );
  };

  const inviteTimeline = (invite: Invite): ActivityItem[] => [
    {
      id: "created",
      title: "Solicitare creată",
      description: `${templateName(invite.template_id)} pentru ${clientName(invite.client_id)}`,
      at: fmtRelative(invite.date_added),
      icon: <FileEdit className="w-4 h-4" />,
      tone: "info",
    },
    {
      id: "status",
      title: `Status curent: ${invite.status}`,
      description: invite.remarks || "Fără observații interne.",
      at: invite.date_modified ? fmtRelative(invite.date_modified) : "necunoscut",
      icon: <Send className="w-4 h-4" />,
      tone: invite.status === "signed" ? "success" : invite.status === "expired" || invite.status === "revoked" ? "danger" : "neutral",
    },
    {
      id: "deadline",
      title: "Termen semnare",
      description: fmtDate(invite.expiration_date),
      at: "deadline",
      icon: <Calendar className="w-4 h-4" />,
      tone: "warning",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitări contract"
        description="Pipeline Draft → Trimis → Vizualizat → Semnat. Click pe card pentru detalii."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Send className="w-4 h-4" /> Solicitare nouă
          </Button>
        }
      />

      {list.isLoading ? (
        <div className="rounded-2xl border border-border bg-frame">
          <SkeletonList rows={6} />
        </div>
      ) : list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        {groups.map((group) => (
          <section
            key={group.state}
            className="rounded-2xl border border-border bg-frame overflow-hidden flex flex-col"
          >
            <header className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                <p className="text-xs font-semibold tracking-tight">{group.label}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full">
                {group.rows.length}
              </span>
            </header>
            <div className="flex-1 p-2 space-y-2 min-h-[260px] bg-background/40">
              {group.rows.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Niciun item.
                </p>
              )}
              {group.rows.map((invite, idx) => (
                <motion.article
                  key={invite.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl border border-border bg-frame p-3 hover:border-foreground/20 transition-colors cursor-pointer"
                  onClick={() => setActiveInvite(invite)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="neutral">#{invite.id}</Badge>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${group.chip}`}>
                      {group.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1">
                    Template #{invite.template_id}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <Avatar name={`Client ${invite.client_id}`} size="xs" />
                    Client #{invite.client_id}
                  </div>
                  {invite.remarks && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {invite.remarks}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(invite.expiration_date)}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-foreground/70 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(publicUrl(invite));
                      }}
                    >
                      <Copy className="w-3 h-3" /> Link
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        ))}
      </div>
      )}

      <section className="rounded-2xl border border-border bg-frame">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Activitate recentă</h2>
            <p className="text-xs text-muted-foreground">Ultimele acțiuni pe solicitări.</p>
          </div>
        </header>
        <ul className="divide-y divide-border">
          {invites.slice(0, 5).map((invite) => (
            <li key={invite.id} className="px-5 py-3 flex items-center gap-3">
              <FileEdit className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  Solicitare #{invite.id} pentru client #{invite.client_id} —{" "}
                  <span className="text-muted-foreground">{invite.status}</span>
                </p>
                <p className="text-xs text-muted-foreground">{fmtRelative(invite.date_added)}</p>
              </div>
              <a
                href={publicUrl(invite)}
                target="_blank"
                rel="noreferrer"
                className="text-xs inline-flex items-center gap-1 text-foreground/70 hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" /> Public
              </a>
            </li>
          ))}
          {invites.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              Niciun istoric încă.
            </li>
          )}
        </ul>
      </section>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Solicitare contract"
        description="Alege șablonul și clientul, setează termenul. Observațiile sunt opționale."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button loading={create.isPending} disabled={!canCreate} onClick={handleCreate}>
              <Send className="w-4 h-4" /> Trimite solicitare
            </Button>
          </div>
        }
      >
        <Select
          label="Șablon contract"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={templateOptions}
          placeholder={templateOptions.length === 0 ? "Niciun șablon disponibil" : "Selectează șablon"}
        />
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={clientOptions}
          placeholder={clientOptions.length === 0 ? "Niciun client disponibil" : "Selectează client"}
        />
        <Input
          label="Termen semnare"
          type="date"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
        />
        <Textarea
          label="Observații (opțional)"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Ex: prioritate urgentă, notă specifică pentru client..."
          hint="Vor apărea în pipeline-ul intern și în notificarea către client."
        />
      </Drawer>

      <Drawer
        open={!!activeInvite}
        onClose={() => setActiveInvite(null)}
        width="lg"
        title={activeInvite ? `Solicitare #${activeInvite.id}` : "Solicitare"}
        description={
          activeInvite
            ? `${templateName(activeInvite.template_id)} · ${clientName(activeInvite.client_id)}`
            : ""
        }
        footer={
          activeInvite && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl(activeInvite))}>
                <Copy className="w-4 h-4" /> Copiază link
              </Button>
              <Button variant="outline" onClick={() => window.open(publicUrl(activeInvite), "_blank", "noopener,noreferrer")}>
                <ExternalLink className="w-4 h-4" /> Preview
              </Button>
              <Button loading={send.isPending} onClick={() => sendInvite(activeInvite, "Solicitare trimisă.")}>
                <Send className="w-4 h-4" /> Trimite
              </Button>
            </div>
          )
        }
      >
        {activeInvite && (
          <>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{templateName(activeInvite.template_id)}</p>
                  <p className="text-xs text-muted-foreground">{clientName(activeInvite.client_id)}</p>
                </div>
                <Badge variant={activeInvite.status === "signed" ? "success" : activeInvite.status === "expired" || activeInvite.status === "revoked" ? "danger" : "neutral"}>
                  {activeInvite.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeInvite.remarks || "Fără observații pentru această solicitare."}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" loading={send.isPending} onClick={() => sendInvite(activeInvite, "Reminder trimis.")}>
                  <RefreshCw className="w-4 h-4" /> Reminder manual
                </Button>
                <Button variant="outline" onClick={() => duplicateInvite(activeInvite)}>
                  <Copy className="w-4 h-4" /> Duplică
                </Button>
                <Button variant="outline" className="text-amber-600" onClick={() => updateInviteStatus(activeInvite, "expired", "Solicitare marcată ca expirată.")}>
                  <TimerOff className="w-4 h-4" /> Expiră
                </Button>
                <Button variant="outline" className="text-red-500" onClick={() => updateInviteStatus(activeInvite, "revoked", "Solicitare revocată.")}>
                  <ShieldX className="w-4 h-4" /> Revoke
                </Button>
              </div>
            </div>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timeline
              </h3>
              <ActivityTimeline items={inviteTimeline(activeInvite)} />
            </section>
          </>
        )}
      </Drawer>
    </div>
  );
}
