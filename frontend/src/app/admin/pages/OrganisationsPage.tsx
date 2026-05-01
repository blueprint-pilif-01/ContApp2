import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Edit2,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { Input } from "../../../components/ui/Input";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import { fmtRelative } from "../../../lib/utils";

interface Organisation {
  id: number;
  name: string;
  slug: string;
  status: "active" | "trialing" | "suspended";
  plan: string;
  employees: number;
  created_at: string;
  contact_email: string;
  cui?: number | null;
  address?: string;
  country?: string;
}

interface OrgUpsertBody {
  name: string;
  slug: string;
  contact_email: string;
  status: string;
  plan: string;
  employees: number;
  cui?: number | null;
  address?: string;
  country?: string;
}

const PLAN_OPTIONS = ["Free", "Starter", "Pro", "Business", "Enterprise"];
const STATUS_OPTIONS = ["active", "trialing", "suspended"];

const statusVariants: Record<Organisation["status"], "success" | "info" | "warning"> = {
  active: "success",
  trialing: "info",
  suspended: "warning",
};

function emptyForm(): OrgUpsertBody {
  return {
    name: "",
    slug: "",
    contact_email: "",
    status: "active",
    plan: "Free",
    employees: 0,
    cui: null,
    address: "",
    country: "RO",
  };
}

export default function OrganisationsPage() {
  const [filter, setFilter] = useState<Organisation["status"] | "all">("all");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Organisation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Organisation | null>(null);
  const [form, setForm] = useState<OrgUpsertBody>(emptyForm());

  const toast = useToast();
  const qc = useQueryClient();

  const list = useCollectionList<Organisation>(
    "admin-organisations",
    "/admin/organisations"
  );

  const action = useMutation({
    mutationFn: ({ id, op }: { id: number; op: "suspend" | "restore" }) =>
      api.post<Organisation>(`/admin/organisations/${id}/${op}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organisations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e) =>
      toast.error(
        isApiError(e) ? e.message : "Acțiunea nu s-a putut finaliza."
      ),
  });

  const create = useMutation({
    mutationFn: (payload: OrgUpsertBody) =>
      api.post<Organisation>("/admin/organisations", payload),
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: ["admin-organisations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`${org.name} a fost creată.`);
      setDrawerOpen(null);
      setForm(emptyForm());
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut crea organizația."),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: OrgUpsertBody }) =>
      api.put<Organisation>(`/admin/organisations/${id}`, body),
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: ["admin-organisations"] });
      toast.success(`${org.name} actualizată.`);
      setDrawerOpen(null);
      setEditTarget(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut salva."),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/admin/organisations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organisations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Organizație ștearsă.");
      setConfirmDelete(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut șterge."),
  });

  // Reset form when transitioning into edit mode for a fresh target.
  useEffect(() => {
    if (drawerOpen === "edit" && editTarget) {
      setForm({
        name: editTarget.name,
        slug: editTarget.slug,
        contact_email: editTarget.contact_email,
        status: editTarget.status,
        plan: editTarget.plan,
        employees: editTarget.employees,
        cui: editTarget.cui ?? null,
        address: editTarget.address ?? "",
        country: editTarget.country ?? "RO",
      });
    }
    if (drawerOpen === "create") setForm(emptyForm());
  }, [drawerOpen, editTarget]);

  const filtered = useMemo(() => {
    let rows = list.data ?? [];
    if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((r) =>
        `${r.name} ${r.slug} ${r.contact_email}`.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [list.data, filter, query]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Numele este obligatoriu.");
      return;
    }
    const payload: OrgUpsertBody = {
      ...form,
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
    };
    if (drawerOpen === "edit" && editTarget) {
      update.mutate({ id: editTarget.id, body: payload });
    } else {
      create.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizații"
        description="Toate organizațiile platformei. Adaugă, suspendă sau reactivează conturi."
        actions={
          <Button onClick={() => setDrawerOpen("create")}>
            <Plus className="w-4 h-4" /> Organizație nouă
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută organizație..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "Toate" },
            { id: "active", label: "Active" },
            { id: "trialing", label: "Trial" },
            { id: "suspended", label: "Suspendate" },
          ]}
        />
      </div>

      <div className="rounded-2xl border border-border bg-frame overflow-hidden">
        {list.isError ? (
          <div className="p-6">
            <ErrorState onRetry={() => list.refetch()} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-foreground/3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-3">Organizație</th>
                <th className="text-left px-5 py-3">Plan</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Angajați</th>
                <th className="text-left px-5 py-3">Creat</th>
                <th className="text-right px-5 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <SkeletonRows rows={5} cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <EmptyArt
                      icon={Building2}
                      title="Nicio organizație"
                      description="Adaugă o organizație nouă sau ajustează filtrul curent."
                      action={
                        <Button size="sm" onClick={() => setDrawerOpen("create")}>
                          <Plus className="w-4 h-4" /> Organizație nouă
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr
                    key={org.id}
                    className="border-t border-border hover:bg-foreground/3"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/extensions?org=${org.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-foreground/8 flex items-center justify-center group-hover:bg-foreground/12">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:underline">
                            {org.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {org.slug} · {org.contact_email || "—"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="neutral">{org.plan}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariants[org.status]}>
                        {org.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">{org.employees}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {fmtRelative(org.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link to={`/admin/extensions?org=${org.id}`}>
                          <Button size="xs" variant="ghost" title="Extensii">
                            <ShieldCheck className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Editează"
                          onClick={() => {
                            setEditTarget(org);
                            setDrawerOpen("edit");
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        {org.status === "suspended" ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Reactivează"
                            onClick={() =>
                              action.mutate(
                                { id: org.id, op: "restore" },
                                {
                                  onSuccess: () =>
                                    toast.success(`${org.name} reactivat.`),
                                }
                              )
                            }
                          >
                            <PlayCircle className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Suspendă"
                            onClick={() =>
                              action.mutate(
                                { id: org.id, op: "suspend" },
                                {
                                  onSuccess: () =>
                                    toast.success(`${org.name} suspendat.`),
                                }
                              )
                            }
                          >
                            <PauseCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Șterge"
                          onClick={() => setConfirmDelete(org)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {list.data && list.data.length > 0 && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> {list.data.length} organizații
          totale, {filtered.length} afișate.
        </p>
      )}

      <Drawer
        open={drawerOpen !== null}
        onClose={() => {
          setDrawerOpen(null);
          setEditTarget(null);
        }}
        title={
          drawerOpen === "edit"
            ? `Editează ${editTarget?.name ?? ""}`
            : "Organizație nouă"
        }
        description={
          drawerOpen === "edit"
            ? "Modifică datele acestei organizații."
            : "Setează datele de bază. Extensiile pot fi activate ulterior din pagina dedicată."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDrawerOpen(null);
                setEditTarget(null);
              }}
            >
              Anulează
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              onClick={handleSubmit}
            >
              {drawerOpen === "edit" ? "Salvează" : "Creează"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nume"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ex: Atlas Legal SRL"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="atlas-legal"
              hint="Generat automat din nume dacă lași gol."
            />
            <Input
              label="Email contact"
              type="email"
              value={form.contact_email}
              onChange={(e) =>
                setForm({ ...form, contact_email: e.target.value })
              }
              placeholder="office@firma.ro"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Plan
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Angajați"
              type="number"
              value={form.employees}
              onChange={(e) =>
                setForm({
                  ...form,
                  employees: Number.parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <Input
              label="Țară"
              value={form.country ?? "RO"}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="RO"
            />
          </div>
          <Input
            label="CUI"
            type="number"
            value={form.cui ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                cui: e.target.value
                  ? Number.parseInt(e.target.value, 10)
                  : null,
              })
            }
            placeholder="12345678"
          />
          <Input
            label="Adresă"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Str. Exemplu nr. 1, București"
          />
        </div>
      </Drawer>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) del.mutate(confirmDelete.id);
        }}
        title="Ștergi organizația?"
        description={`„${confirmDelete?.name}” va fi eliminată definitiv. Datele asociate (extensii, audit) nu mai pot fi recuperate.`}
        confirmLabel="Șterge"
      />
    </div>
  );
}
