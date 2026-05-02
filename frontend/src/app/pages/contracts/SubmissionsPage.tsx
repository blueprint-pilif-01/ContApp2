import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileCheck,
  FileSignature,
  Filter,
  PenTool,
  Search,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Drawer } from "../../../components/ui/Drawer";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { useCollectionCreate, useCollectionList } from "../../../hooks/useCollection";
import { fmtDate } from "../../../lib/utils";

type Submission = {
  id: number;
  invite_id: number;
  client_id: number;
  user_id?: number;
  pdf_file_id?: number;
  status: string;
  remarks: string;
  date_added: string;
  expiration_date: string;
  filled_fields?: Record<string, string> | null;
  signature_image?: string | null;
  signed_at?: string | null;
};

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

async function downloadBlob(path: string, filename: string) {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SubmissionsPage() {
  const list = useCollectionList<Submission>("submissions-list", "/contracts/submissions");
  const create = useCollectionCreate<object, Submission>(
    "submissions-list",
    "/contracts/submissions"
  );

  const [creating, setCreating] = useState(false);
  const [inviteId, setInviteId] = useState("501");
  const [clientId, setClientId] = useState("101");
  const [remarks, setRemarks] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Submission | null>(null);

  const submissions = list.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) =>
      `${s.id} ${s.invite_id} ${s.client_id} ${s.status} ${s.remarks}`
        .toLowerCase()
        .includes(q)
    );
  }, [submissions, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submisii contract"
        description="Toate semnările într-un singur loc. Click pentru preview și detalii."
        actions={
          <Button onClick={() => setCreating(true)}>
            <FileSignature className="w-4 h-4" /> Înregistrează semnare
          </Button>
        }
      />

      <SectionCard padding="none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-border">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută după ID, status, observații..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> {filtered.length} rezultate
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyArt
            icon={FileCheck}
            title="Nicio submisie"
            description="Submisiile apar aici când invitațiile sunt finalizate."
            action={
              <Button onClick={() => setCreating(true)}>
                <FileSignature className="w-4 h-4" /> Adaugă manual
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Submisie</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Invitație</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Client</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/3 transition-colors cursor-pointer"
                    onClick={() => setActive(s)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[color:var(--accent)]/20 text-foreground inline-flex items-center justify-center">
                          <FileCheck className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-sm font-semibold">#{s.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">#{s.invite_id}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={`Client ${s.client_id}`} size="xs" />
                        <span className="text-xs">Client #{s.client_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "signed" ? "success" : "neutral"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(s.date_added)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Eye className="w-4 h-4 text-muted-foreground inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width="lg"
        title={`Submisie #${active?.id ?? ""}`}
        description="Date completate de client, semnătură și PDF generat."
        footer={
          active && (
            <div className="flex justify-end gap-2">
              {active.signature_image && (
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadBlob(
                      `/contracts/submissions/${active.id}/signature`,
                      `semnatura-${active.id}.png`
                    )
                  }
                >
                  <PenTool className="w-4 h-4" /> Descarcă semnătura
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  downloadBlob(
                    `/contracts/submissions/${active.id}/pdf`,
                    `contract-${active.id}.pdf`
                  )
                }
              >
                <Download className="w-4 h-4" /> Descarcă PDF
              </Button>
              <Button onClick={() => setActive(null)}>Închide</Button>
            </div>
          )
        }
      >
        {active && (
          <>
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <Badge variant={active.status === "signed" ? "success" : "neutral"}>
                    {active.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invitație</p>
                  <p className="font-medium">#{active.invite_id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Client</p>
                  <p className="font-medium">#{active.client_id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data semnare</p>
                  <p className="font-medium">
                    {fmtDate(active.signed_at ?? active.date_added)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Observații</p>
                  <p className="text-sm">{active.remarks || "—"}</p>
                </div>
              </div>
            </div>

            {active.filled_fields && Object.keys(active.filled_fields).length > 0 && (
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Date completate de client
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(active.filled_fields).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground truncate">{k}</dt>
                      <dd className="font-medium truncate">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> Semnătură client
              </p>
              {active.signature_image ? (
                <div className="rounded-xl border border-border bg-white p-3 flex items-center justify-center">
                  <img
                    src={active.signature_image}
                    alt="Semnătură client"
                    className="max-h-40 object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Submisia nu are semnătură (revocată sau înregistrată manual).
                </p>
              )}
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Înregistrează semnare"
        description="Pentru cazurile când semnătura vine din afara aplicației."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                create.mutate({
                  invite_id: Number(inviteId),
                  client_id: Number(clientId),
                  remarks,
                  status: "signed",
                  expiration_date: new Date(Date.now() + 30 * 86400000).toISOString(),
                });
                setRemarks("");
                setCreating(false);
              }}
            >
              <FileCheck className="w-4 h-4" /> Salvează
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Invite ID" value={inviteId} onChange={(e) => setInviteId(e.target.value)} />
          <Input label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        </div>
        <Input label="Observații" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Drawer>
    </div>
  );
}
