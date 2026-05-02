import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { useCollectionCreate, useCollectionList } from "../../../hooks/useCollection";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";

type Client = {
  id: number;
  client_type?: "person" | "company";
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string;
  email: string;
  phone: string;
  status: string;
  address: string;
  cnp?: string | number | null;
  cui?: string | number | null;
  tva?: boolean | null;
  responsible_name?: string | null;
  responsible_email?: string | null;
};

function clientDisplay(c: Client): string {
  if (c.client_type === "company" && c.company_name) return c.company_name;
  return `${c.first_name} ${c.last_name}`.trim() || `Client #${c.id}`;
}

function clientIdentifier(c: Client): string {
  const value = c.client_type === "company" ? c.cui ?? c.cnp : c.cnp;
  return value == null || value === "" ? "—" : String(value);
}

const PAGE_SIZE = 8;

export default function ClientsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [creating, setCreating] = useState(false);
  const [clientType, setClientType] = useState<"person" | "company">("person");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [tva, setTva] = useState(false);
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const trimmedQuery = query.trim();
  const list = useCollectionList<Client>(
    "clients-list",
    "/clients",
    trimmedQuery ? `q=${encodeURIComponent(trimmedQuery)}` : ""
  );
  const create = useCollectionCreate<object, Client>(
    "clients-list",
    "/clients"
  );

  const all = list.data ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return all;
    return all.filter((c) =>
      statusFilter === "active" ? c.status === "active" : c.status !== "active"
    );
  }, [all, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = {
    all: all.length,
    active: all.filter((c) => c.status === "active").length,
    inactive: all.filter((c) => c.status !== "active").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clienți"
        description="Caută, filtrează după status și deschide profilul pentru detalii."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Client nou
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SectionCard padding="sm">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total clienți</p>
              <p className="text-2xl font-semibold mt-0.5">{counts.all}</p>
            </div>
            <Users className="w-5 h-5 text-foreground/40" />
          </div>
        </SectionCard>
        <SectionCard padding="sm">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Activi</p>
              <p className="text-2xl font-semibold mt-0.5 text-foreground">
                {counts.active}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-foreground/60" />
          </div>
        </SectionCard>
        <SectionCard padding="sm">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Inactivi</p>
              <p className="text-2xl font-semibold mt-0.5 text-red-500">{counts.inactive}</p>
            </div>
            <Filter className="w-5 h-5 text-red-500/60" />
          </div>
        </SectionCard>
      </div>

      <SectionCard padding="none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Caută după nume, email, telefon..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>
          <SegmentedControl
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { id: "all", label: "Toți" },
              { id: "active", label: "Activi" },
              { id: "inactive", label: "Inactivi" },
            ]}
          />
        </div>

        {list.isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <SkeletonRows rows={5} cols={4} />
              </tbody>
            </table>
          </div>
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : paged.length === 0 ? (
          <EmptyArt
            icon={Users}
            title="Niciun client găsit"
            description="Modifică filtrul sau caută alt termen, sau creează un client nou."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="w-4 h-4" /> Adaugă client
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Adresă</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/3 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={clientDisplay(client)} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                            {clientDisplay(client)}
                            <Badge
                              variant="neutral"
                              className="text-[9px] uppercase tracking-wider"
                            >
                              {client.client_type === "company"
                                ? "Companie"
                                : "Persoană"}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.client_type === "company" ? "CUI" : "CNP"}{" "}
                            {clientIdentifier(client)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1 text-xs">
                        <p className="flex items-center gap-1.5 text-foreground/80">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {client.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {client.phone || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        {client.address}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={client.status === "active" ? "success" : "neutral"}>
                        {client.status === "active" ? "Activ" : "Inactiv"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground p-4 border-t border-border">
            <p>
              {filtered.length} clienți · pagina {safePage} din {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Următor
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Client nou"
        description="Completează informațiile esențiale; restul pot fi adăugate ulterior."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                const isCompany = clientType === "company";
                if (isCompany && !companyName.trim()) return;
                if (!isCompany && (!firstName.trim() || !lastName.trim())) return;
                const fallbackEmail = isCompany
                  ? `${companyName}@firma.ro`
                      .toLowerCase()
                      .replace(/[^a-z0-9@.]+/g, "")
                  : `${firstName}.${lastName}@mail.ro`.toLowerCase();
                create.mutate({
                  client_type: clientType,
                  first_name: isCompany ? null : firstName.trim(),
                  last_name: isCompany ? null : lastName.trim(),
                  cnp: isCompany ? null : identifier.trim() || null,
                  company_name: isCompany ? companyName : "",
                  cui: isCompany ? identifier.trim() || null : null,
                  tva: isCompany ? tva : null,
                  responsible_name: isCompany ? responsibleName.trim() || null : null,
                  responsible_email: isCompany ? responsibleEmail.trim() || null : null,
                  email: email || fallbackEmail,
                  phone,
                  status: "active",
                  address,
                });
                setFirstName("");
                setLastName("");
                setCompanyName("");
                setIdentifier("");
                setTva(false);
                setResponsibleName("");
                setResponsibleEmail("");
                setEmail("");
                setPhone("");
                setAddress("");
                setCreating(false);
              }}
            >
              <Plus className="w-4 h-4" /> Creează
            </Button>
          </div>
        }
      >
        <SegmentedControl
          value={clientType}
          onChange={setClientType}
          options={[
            { id: "person", label: "Persoană fizică" },
            { id: "company", label: "Companie" },
          ]}
        />
        {clientType === "person" ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prenume"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Nume"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        ) : (
          <Input
            label="Nume firmă"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="ex: SC Atlas SRL"
          />
        )}
        <Input
          label={clientType === "company" ? "CUI" : "CNP (opțional)"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={clientType === "company" ? "RO12345678" : "1960101123456"}
        />
        {clientType === "company" && (
          <>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={tva}
                onChange={(e) => setTva(e.target.checked)}
              />
              Plătitor TVA
            </label>
            <Input
              label="Persoană responsabilă"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder="Ana Popescu"
            />
            <Input
              label="Email responsabil"
              type="email"
              value={responsibleEmail}
              onChange={(e) => setResponsibleEmail(e.target.value)}
              placeholder="ana@example.com"
            />
          </>
        )}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Adresă" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Drawer>
    </div>
  );
}
