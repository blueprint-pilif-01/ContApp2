import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Edit2,
  Plus,
  Shield,
  Tag,
  Trash2,
  Users,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs, TabPanel } from "../../../components/ui/Tabs";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Drawer } from "../../../components/ui/Drawer";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { useToast } from "../../../components/ui/Toast";
import {
  useCollectionCreate,
  useCollectionDelete,
  useCollectionList,
  useCollectionUpdate,
} from "../../../hooks/useCollection";
import { usePrincipal } from "../../../hooks/useMe";
import { api, isApiError } from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { useLocalTeams, type LocalTeam } from "../../../lib/teams";

type Role = {
  id: number;
  slug?: string;
  name: string;
  system_role?: boolean;
};

type Member = {
  membership_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  employee_category_id?: number | null;
  employee_category?: string | null;
  display_name?: string | null;
  job_title?: string | null;
  status: string;
  roles?: Role[];
};

type Category = {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  created_at?: string;
};

type MemberPayload = {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  employee_category_id: number | null;
  display_name: string | null;
  job_title: string | null;
  status: string;
};

const COLOR_PRESETS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

function isOwnerRole(role: Role | null | undefined): boolean {
  const text = `${role?.slug ?? ""} ${role?.name ?? ""}`.toLowerCase();
  return text.includes("owner") || text.includes("proprietar");
}

export default function EmployeesPage() {
  const [active, setActive] = useState("employees");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Angajați"
        description="Echipă internă, roluri, categorii și grupuri operaționale."
      />
      <Tabs
        tabs={[
          { id: "employees", label: "Angajați", icon: <UserRound className="w-3.5 h-3.5" /> },
          { id: "teams", label: "Echipe", icon: <Users className="w-3.5 h-3.5" /> },
          { id: "categories", label: "Categorii", icon: <Tag className="w-3.5 h-3.5" /> },
          { id: "roles", label: "Roluri", icon: <Shield className="w-3.5 h-3.5" /> },
        ]}
        active={active}
        onChange={setActive}
      />
      <TabPanel id="employees" active={active}>
        <EmployeesTab />
      </TabPanel>
      <TabPanel id="teams" active={active}>
        <TeamsTab />
      </TabPanel>
      <TabPanel id="categories" active={active}>
        <CategoriesTab />
      </TabPanel>
      <TabPanel id="roles" active={active}>
        <RolesSummaryTab />
      </TabPanel>
    </div>
  );
}

function EmployeesTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const members = useCollectionList<Member>("employees-members", "/members");
  const roles = useCollectionList<Role>("employees-roles", "/roles");
  const categories = useCollectionList<Category>("employees-categories", "/employee-categories");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [query, setQuery] = useState("");
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    categoryId: "",
    status: "active",
    password: "password",
  });

  const createMember = useMutation({
    mutationFn: async (payload: MemberPayload) => api.post<Member>("/members", payload),
    onSuccess: async (created) => {
      if (roleIds.length > 0) {
        await api.put(`/members/${created.membership_id}/roles`, { role_ids: roleIds });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["employees-members"] }),
        qc.invalidateQueries({ queryKey: ["team-users"] }),
      ]);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: MemberPayload }) =>
      api.put(`/members/${id}`, payload),
    onSuccess: async (_value, variables) => {
      await api.put(`/members/${variables.id}/roles`, { role_ids: roleIds });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["employees-members"] }),
        qc.invalidateQueries({ queryKey: ["team-users"] }),
      ]);
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (members.data ?? []).filter((member) => {
      const text = `${member.first_name} ${member.last_name} ${member.email} ${member.job_title ?? ""}`.toLowerCase();
      return !q || text.includes(q);
    });
  }, [members.data, query]);

  const categoryOptions = [
    { value: "", label: "Fără categorie" },
    ...(categories.data ?? []).map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];
  const ownerRoleIds = useMemo(
    () => new Set((roles.data ?? []).filter(isOwnerRole).map((role) => role.id)),
    [roles.data]
  );
  const memberHasOwnerRole = (member: Member, ids = (member.roles ?? []).map((role) => role.id)) =>
    ids.some((id) => ownerRoleIds.has(id)) || (member.roles ?? []).some(isOwnerRole);
  const activeOwnerCount = useMemo(
    () =>
      (members.data ?? []).filter(
        (member) => member.status === "active" && memberHasOwnerRole(member)
      ).length,
    [members.data, ownerRoleIds]
  );
  const editingIsLastActiveOwner =
    editing?.status === "active" && memberHasOwnerRole(editing) && activeOwnerCount <= 1;

  const openCreate = () => {
    setEditing(null);
    setRoleIds([]);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      categoryId: "",
      status: "active",
      password: "password",
    });
    setDrawerOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setRoleIds((member.roles ?? []).map((role) => role.id));
    setForm({
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone ?? "",
      title: member.job_title ?? "",
      categoryId: member.employee_category_id ? String(member.employee_category_id) : "",
      status: member.status === "removed" ? "suspended" : member.status,
      password: "",
    });
    setDrawerOpen(true);
  };

  const payload = (): MemberPayload => ({
    email: form.email.trim(),
    ...(editing ? {} : { password: form.password || "password" }),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone: form.phone.trim() || null,
    employee_category_id: form.categoryId ? Number(form.categoryId) : null,
    display_name: `${form.firstName} ${form.lastName}`.trim() || null,
    job_title: form.title.trim() || null,
    status: form.status,
  });

  const save = () => {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Prenumele, numele și emailul sunt obligatorii.");
      return;
    }
    if (editingIsLastActiveOwner) {
      const keepsOwnerRole = roleIds.some((id) => ownerRoleIds.has(id));
      if (!keepsOwnerRole || form.status !== "active") {
        toast.error("Ultimul Owner activ trebuie să rămână activ și să păstreze rolul Owner.");
        return;
      }
    }
    if (editing) {
      updateMember.mutate(
        { id: editing.membership_id, payload: payload() },
        {
          onSuccess: () => {
            toast.success("Angajat actualizat.");
            setDrawerOpen(false);
          },
          onError: (e) => toast.error(isApiError(e) ? e.message : "Nu s-a putut salva angajatul."),
        }
      );
      return;
    }
    createMember.mutate(payload(), {
      onSuccess: () => {
        toast.success("Angajat creat.");
        setDrawerOpen(false);
      },
      onError: (e) => toast.error(isApiError(e) ? e.message : "Nu s-a putut crea angajatul."),
    });
  };

  if (members.isLoading || categories.isLoading || roles.isLoading) return <SkeletonList rows={5} />;
  if (members.isError || categories.isError || roles.isError) {
    return <ErrorState onRetry={() => void Promise.all([members.refetch(), categories.refetch(), roles.refetch()])} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută angajat..."
          className="max-w-md"
        />
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Angajat nou
        </Button>
      </div>

      <SectionCard padding="none">
        {filtered.length === 0 ? (
          <EmptyArt icon={Users} title="Niciun angajat" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Persoană</th>
                <th className="px-4 py-3 hidden md:table-cell">Categorie</th>
                <th className="px-4 py-3 hidden lg:table-cell">Roluri</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const name = memberName(member);
                return (
                  <tr key={member.membership_id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} size="sm" status={member.status === "active" ? "online" : "offline"} />
                        <div>
                          <p className="font-semibold">{name}</p>
                          <p className="text-xs text-muted-foreground">{member.job_title || member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {member.employee_category ? (
                        <Badge variant="neutral">{member.employee_category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(member.roles ?? []).map((role) => (
                          <Badge key={role.id} variant={role.slug === "owner" ? "warning" : "neutral"}>
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === "active" ? "success" : "neutral"}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="outline" onClick={() => openEdit(member)}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="lg"
        title={editing ? "Editează angajat" : "Angajat nou"}
        description="Salvează datele angajatului, categoria HR și rolurile operaționale."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Anulează</Button>
            <Button loading={createMember.isPending || updateMember.isPending} onClick={save}>
              {editing ? "Salvează" : "Creează"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Prenume" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Nume" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {!editing && (
            <Input label="Parolă inițială" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <Input label="Titlu intern" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select
            label="Categorie angajat"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={categoryOptions}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: "active", label: "Activ" },
              { value: "suspended", label: "Suspendat" },
              { value: "invited", label: "Invitat" },
            ]}
          />
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Roluri</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(roles.data ?? []).map((role) => {
              const selected = roleIds.includes(role.id);
              const lockedOwnerRole = editingIsLastActiveOwner && selected && isOwnerRole(role);
              return (
                <button
                  key={role.id}
                  type="button"
                  disabled={lockedOwnerRole}
                  title={lockedOwnerRole ? "Ultimul Owner activ este protejat." : role.name}
                  onClick={() => {
                    if (lockedOwnerRole) {
                      toast.info("Ultimul Owner activ trebuie să păstreze rolul Owner.");
                      return;
                    }
                    setRoleIds((current) =>
                      selected ? current.filter((id) => id !== role.id) : [...current, role.id]
                    );
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                    selected ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-border hover:bg-foreground/4"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{role.name}</span>
                    {selected && <Check className="w-4 h-4" />}
                  </span>
                  <span className="text-xs text-muted-foreground">{role.slug ?? "custom"}</span>
                </button>
              );
            })}
          </div>
          {editingIsLastActiveOwner && (
            <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
              Ultimul Owner activ este protejat în UI: nu poate pierde rolul Owner sau statusul activ.
            </p>
          )}
        </div>
      </Drawer>
    </div>
  );
}

function TeamsTab() {
  const principal = usePrincipal("user");
  const members = useCollectionList<Member>("employees-members", "/members");
  const teamsStore = useLocalTeams(principal?.kind === "user" ? principal.organisation_id : null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LocalTeam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalTeam | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setMemberIds([]);
    setDrawerOpen(true);
  };

  const openEdit = (team: LocalTeam) => {
    setEditing(team);
    setName(team.name);
    setDescription(team.description);
    setMemberIds(team.memberIds);
    setDrawerOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    if (editing) {
      teamsStore.updateTeam(editing.id, { name, description, memberIds });
    } else {
      teamsStore.createTeam({ name, description, memberIds });
    }
    setDrawerOpen(false);
  };

  if (members.isLoading) return <SkeletonList rows={4} />;
  if (members.isError) return <ErrorState onRetry={members.refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Echipă nouă
        </Button>
      </div>
      {teamsStore.teams.length === 0 ? (
        <EmptyArt icon={Users} title="Nicio echipă" description="Definește echipe locale pentru HR și chat până există backend." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamsStore.teams.map((team) => (
            <article key={team.id} className="rounded-2xl border border-border bg-frame p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <h3 className="text-sm font-semibold">{team.name}</h3>
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{team.description || "Fără descriere."}</p>
                </div>
                <Badge variant="neutral">{team.memberIds.length} membri</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {team.memberIds.slice(0, 8).map((id) => {
                  const member = members.data?.find((row) => row.membership_id === id);
                  return <Badge key={id} variant="neutral">{member ? memberName(member) : `User #${id}`}</Badge>;
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
                <Button size="xs" variant="outline" onClick={() => openEdit(team)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(team)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Editează echipă" : "Echipă nouă"}
        description="Echipele sunt locale în frontend până când backend-ul adaugă modelul dedicat."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Anulează</Button>
            <Button onClick={save} disabled={!name.trim()}>{editing ? "Salvează" : "Creează"}</Button>
          </div>
        }
      >
        <Input label="Nume echipă" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Descriere" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <p className="text-sm font-medium mb-2">Membri</p>
          <div className="space-y-2">
            {(members.data ?? []).map((member) => {
              const selected = memberIds.includes(member.membership_id);
              return (
                <button
                  key={member.membership_id}
                  type="button"
                  onClick={() =>
                    setMemberIds((current) =>
                      selected
                        ? current.filter((id) => id !== member.membership_id)
                        : [...current, member.membership_id]
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    selected ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-border hover:bg-foreground/4"
                  )}
                >
                  <Avatar name={memberName(member)} size="xs" />
                  <span className="flex-1 text-sm font-medium">{memberName(member)}</span>
                  {selected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) teamsStore.deleteTeam(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Șterge echipă"
        description={`Echipa "${deleteTarget?.name ?? ""}" va fi eliminată local.`}
        confirmLabel="Șterge"
      />
    </div>
  );
}

function CategoriesTab() {
  const toast = useToast();
  const list = useCollectionList<Category>("employees-categories", "/settings/employee-categories");
  const create = useCollectionCreate<object, Category>("employees-categories", "/settings/employee-categories");
  const update = useCollectionUpdate<object, Category>("employees-categories", (id) => `/settings/employee-categories/${id}`);
  const remove = useCollectionDelete<{ message: string }>("employees-categories", (id) => `/settings/employee-categories/${id}`);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0] ?? "#3b82f6");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setColor(COLOR_PRESETS[0] ?? "#3b82f6");
    setDrawerOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setColor(category.color ?? COLOR_PRESETS[0] ?? "#3b82f6");
    setDrawerOpen(true);
  };

  const save = () => {
    const payload = { name: name.trim(), description: description.trim(), color };
    if (!payload.name) return;
    if (editing) {
      update.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success("Categorie actualizată.");
            setDrawerOpen(false);
          },
          onError: () => toast.error("Nu s-a putut salva categoria."),
        }
      );
      return;
    }
    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Categorie creată.");
        setDrawerOpen(false);
      },
      onError: () => toast.error("Nu s-a putut crea categoria."),
    });
  };

  if (list.isLoading) return <SkeletonList rows={4} />;
  if (list.isError) return <ErrorState onRetry={list.refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Categorie nouă
        </Button>
      </div>
      <SectionCard padding="none">
        {(list.data ?? []).length === 0 ? (
          <EmptyArt icon={Tag} title="Nicio categorie" />
        ) : (
          <ul className="divide-y divide-border">
            {(list.data ?? []).map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                <span className="h-3 w-3 rounded-full border border-foreground/10" style={{ backgroundColor: category.color ?? "#737373" }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.description || "Fără descriere."}</p>
                </div>
                <Button size="xs" variant="ghost" onClick={() => openEdit(category)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(category)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Editează categorie" : "Categorie nouă"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Anulează</Button>
            <Button onClick={save} loading={create.isPending || update.isPending}>Salvează</Button>
          </div>
        }
      >
        <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Descriere" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Culoare ${preset}`}
              onClick={() => setColor(preset)}
              className={cn("h-7 w-7 rounded-full border-2", color === preset ? "border-foreground" : "border-transparent")}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </Drawer>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Categorie ștearsă.");
              setDeleteTarget(null);
            },
            onError: () => toast.error("Nu s-a putut șterge categoria."),
          });
        }}
        title="Șterge categorie"
        description={`Categoria "${deleteTarget?.name ?? ""}" va fi eliminată.`}
        confirmLabel="Șterge"
      />
    </div>
  );
}

function RolesSummaryTab() {
  const roles = useCollectionList<Role & { permissions?: string[] }>("employees-settings-roles", "/settings/roles");

  if (roles.isLoading) return <SkeletonList rows={4} />;
  if (roles.isError) return <ErrorState onRetry={roles.refetch} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(roles.data ?? []).map((role) => {
        const owner = role.name.toLowerCase() === "owner" || role.slug === "owner";
        return (
          <article key={role.id} className="rounded-2xl border border-border bg-frame p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{role.name}</h3>
                  {owner && <Badge variant="warning">protejat</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{role.slug ?? "custom"}</p>
              </div>
              <Shield className="w-5 h-5 text-foreground/35" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(owner ? ["toate permisiunile"] : role.permissions ?? []).slice(0, 10).map((permission) => (
                <Badge key={permission} variant="neutral">{permission}</Badge>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function memberName(member: Member): string {
  return (
    member.display_name?.trim() ||
    `${member.first_name} ${member.last_name}`.trim() ||
    member.email ||
    `User #${member.membership_id}`
  );
}
