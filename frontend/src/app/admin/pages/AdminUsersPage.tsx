import { useEffect, useMemo, useState } from "react";
import { Edit2, Mail, Plus, Search, Trash2, UserCog, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { Input } from "../../../components/ui/Input";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import { fmtRelative } from "../../../lib/utils";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: string;
  type?: string;
  phone?: string;
  title?: string;
  organisation_id?: number;
  date_added?: string;
}

interface Organisation {
  id: number;
  name: string;
}

interface UserUpsertBody {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  organisation_id: number;
  title: string;
  password: string;
}

const TYPE_OPTIONS = [
  { value: "accountant", label: "Contabil" },
  { value: "administrator", label: "Administrator org" },
  { value: "business_owner", label: "Business owner" },
  { value: "employee", label: "Employee" },
];

const STATUS_OPTIONS = ["active", "inactive", "archived"];

function emptyForm(): UserUpsertBody {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    type: "accountant",
    status: "active",
    organisation_id: 1,
    title: "",
    password: "",
  };
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return {
    first: parts[0]!,
    last: parts.slice(1).join(" "),
  };
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserUpsertBody>(emptyForm());
  const toast = useToast();
  const qc = useQueryClient();

  const list = useCollectionList<AdminUser>("admin-users", "/admin/users");
  const orgs = useCollectionList<Organisation>(
    "admin-organisations",
    "/admin/organisations"
  );

  const create = useMutation({
    mutationFn: (payload: UserUpsertBody) =>
      api.post<AdminUser>("/admin/users", payload),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`${user.name} adăugat.`);
      setDrawerOpen(null);
      setForm(emptyForm());
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut crea userul."),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UserUpsertBody }) =>
      api.put<AdminUser>(`/admin/users/${id}`, body),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${u.name} actualizat.`);
      setDrawerOpen(null);
      setEditTarget(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut salva."),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User șters.");
      setConfirmDelete(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut șterge."),
  });

  const impersonate = useMutation({
    mutationFn: (id: number) =>
      api.post<{ message: string }>(`/admin/users/${id}/impersonate`),
    onSuccess: (res, id) => {
      try {
        const target = list.data?.find((u) => u.id === id);
        sessionStorage.setItem(
          "contapp_impersonate",
          JSON.stringify({
            userId: String(id),
            userName: target?.name ?? `User ${id}`,
            userEmail: target?.email ?? "",
          })
        );
      } catch {
        // ignore storage errors
      }
      toast.success(res.message);
    },
    onError: (e) =>
      toast.error(
        isApiError(e) ? e.message : "Impersonarea nu s-a putut realiza."
      ),
  });

  useEffect(() => {
    if (drawerOpen === "edit" && editTarget) {
      const { first, last } = splitName(editTarget.name);
      setForm({
        first_name: first,
        last_name: last,
        email: editTarget.email,
        phone: editTarget.phone ?? "",
        type: editTarget.type ?? "accountant",
        status: editTarget.status,
        organisation_id: editTarget.organisation_id ?? 1,
        title: editTarget.title ?? "",
        password: "",
      });
    }
    if (drawerOpen === "create") setForm(emptyForm());
  }, [drawerOpen, editTarget]);

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(q)
    );
  }, [list.data, query]);

  const orgsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const o of orgs.data ?? []) map.set(o.id, o.name);
    return map;
  }, [orgs.data]);

  const handleSubmit = () => {
    if (!form.first_name.trim() && !form.last_name.trim()) {
      toast.error("Numele este obligatoriu.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email-ul este obligatoriu.");
      return;
    }
    if (drawerOpen === "edit" && editTarget) {
      update.mutate({ id: editTarget.id, body: form });
    } else {
      create.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Useri"
        description="Toți userii platformei, cross-organisation. Administratorul poate crea conturi noi."
        actions={
          <Button onClick={() => setDrawerOpen("create")}>
            <Plus className="w-4 h-4" /> User nou
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută user..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <Badge variant="neutral">{filtered.length} useri</Badge>
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
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Organizație</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Adăugat</th>
                <th className="text-right px-5 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <SkeletonRows rows={6} cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <EmptyArt
                      icon={Users}
                      title="Niciun user"
                      description="Adaugă primul user platformă din butonul de sus."
                      action={
                        <Button size="sm" onClick={() => setDrawerOpen("create")}>
                          <Plus className="w-4 h-4" /> User nou
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border hover:bg-foreground/3"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          {u.title && (
                            <p className="text-xs text-muted-foreground">
                              {u.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {u.email}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.organisation_id
                        ? orgsById.get(u.organisation_id) ?? `#${u.organisation_id}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={u.status === "active" ? "success" : "warning"}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {u.date_added ? fmtRelative(u.date_added) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Editează"
                          onClick={() => {
                            setEditTarget(u);
                            setDrawerOpen("edit");
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Impersonează"
                          onClick={() => impersonate.mutate(u.id)}
                          loading={impersonate.isPending}
                        >
                          <UserCog className="w-3 h-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Șterge"
                          onClick={() => setConfirmDelete(u)}
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

      <Drawer
        open={drawerOpen !== null}
        onClose={() => {
          setDrawerOpen(null);
          setEditTarget(null);
        }}
        title={
          drawerOpen === "edit"
            ? `Editează ${editTarget?.name ?? ""}`
            : "User nou"
        }
        description={
          drawerOpen === "edit"
            ? "Modifică datele acestui user."
            : "Creează un cont nou pentru un membru al unei organizații."
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prenume"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
            <Input
              label="Nume"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="nume@firma.ro"
          />
          {drawerOpen === "create" && (
            <Input
              label="Parolă inițială"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="Userul o poate schimba mai târziu."
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefon"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+40 ..."
            />
            <Input
              label="Titlu"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Senior Accountant"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tip
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Organizație
            </label>
            <select
              value={form.organisation_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  organisation_id: Number.parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {(orgs.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} · {o.name}
                </option>
              ))}
              {(orgs.data ?? []).length === 0 && (
                <option value={1}>#1 · ContApp Cabinet Contabilitate</option>
              )}
            </select>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) del.mutate(confirmDelete.id);
        }}
        title="Ștergi userul?"
        description={`„${confirmDelete?.name}” va fi eliminat. Asignările active vor rămâne fără responsabil.`}
        confirmLabel="Șterge"
      />
    </div>
  );
}
