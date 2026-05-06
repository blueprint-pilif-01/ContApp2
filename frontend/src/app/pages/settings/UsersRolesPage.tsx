import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit2,
  Eye,
  KeyRound,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shield,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ErrorState } from "../../../components/ui/EmptyState";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import {
  useCollectionCreate,
  useCollectionDelete,
  useCollectionAction,
  useCollectionItem,
  useCollectionList,
  useCollectionUpdate,
} from "../../../hooks/useCollection";
import {
  PERMISSION_CATALOG,
  PERMISSION_GROUPS,
  type PermissionDefinition,
} from "../../../lib/permissions";
import { cn } from "../../../lib/utils";

type AppUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_id?: number;
  role_ids?: number[];
  status: string;
  title?: string;
};

type AppRole = {
  id: number;
  name: string;
  description: string;
  permissions: string[];
};
type EffectivePermissions = {
  user_id: number;
  role_ids: number[];
  permissions: string[];
};

const DEFAULT_ROLE_ID = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BACKEND_PERMISSION_SLUGS = new Set(PERMISSION_CATALOG.map((permission) => permission.slug));

function isOwnerRole(role: AppRole | null | undefined): boolean {
  const text = `${role?.name ?? ""} ${role?.description ?? ""}`.toLowerCase();
  return /\bowner\b/.test(text) || text.includes("proprietar");
}

function permissionsForGroup(groupID: string): PermissionDefinition[] {
  return PERMISSION_CATALOG.filter((permission) => permission.group === groupID);
}

function validRolePermissions(permissions: string[]): string[] {
  if (permissions.includes("*")) return ["*"];
  return permissions.filter((permission) => BACKEND_PERMISSION_SLUGS.has(permission));
}

export default function UsersRolesPage() {
  const [active, setActive] = useState("users");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Gestionează utilizatorii, rolurile și matricea de permisiuni."
      />
      <Tabs
        tabs={[
          { id: "users", label: "Utilizatori", icon: <Users className="w-3.5 h-3.5" /> },
          { id: "roles", label: "Roluri", icon: <Shield className="w-3.5 h-3.5" /> },
          { id: "permissions", label: "Permisiuni", icon: <KeyRound className="w-3.5 h-3.5" /> },
          { id: "categories", label: "Categorii angajați", icon: <Tag className="w-3.5 h-3.5" /> },
        ]}
        active={active}
        onChange={setActive}
      />
      <TabPanel id="users" active={active}>
        <UsersTab />
      </TabPanel>
      <TabPanel id="roles" active={active}>
        <RolesTab />
      </TabPanel>
      <TabPanel id="permissions" active={active}>
        <PermissionsTab />
      </TabPanel>
      <TabPanel id="categories" active={active}>
        <EmployeeCategoriesTab />
      </TabPanel>
    </div>
  );
}

type EmployeeCategory = {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
};

const COLOR_PRESETS = [
  "#a8d946",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#737373",
];

function EmployeeCategoriesTab() {
  const toast = useToast();
  const list = useCollectionList<EmployeeCategory>(
    "settings-employee-categories",
    "/settings/employee-categories"
  );
  const create = useCollectionCreate<object, EmployeeCategory>(
    "settings-employee-categories",
    "/settings/employee-categories"
  );
  const update = useCollectionUpdate<object, EmployeeCategory>(
    "settings-employee-categories",
    (id) => `/settings/employee-categories/${id}`
  );
  const remove = useCollectionDelete<{ message: string }>(
    "settings-employee-categories",
    (id) => `/settings/employee-categories/${id}`
  );

  const [drawerOpen, setDrawerOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]!);

  useEffect(() => {
    if (drawerOpen === "edit" && editTarget) {
      setName(editTarget.name);
      setDescription(editTarget.description ?? "");
      setColor(editTarget.color || COLOR_PRESETS[0]!);
    }
    if (drawerOpen === "create") {
      setName("");
      setDescription("");
      setColor(COLOR_PRESETS[0]!);
    }
  }, [drawerOpen, editTarget]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Numele este obligatoriu.");
      return;
    }
    const payload = { name: name.trim(), description: description.trim(), color };
    if (drawerOpen === "edit" && editTarget) {
      update.mutate(
        { id: editTarget.id, payload },
        {
          onSuccess: () => {
            toast.success("Categorie actualizată.");
            setDrawerOpen(null);
            setEditTarget(null);
          },
          onError: () => toast.error("Nu s-a putut salva."),
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("Categorie creată.");
          setDrawerOpen(null);
        },
        onError: () => toast.error("Nu s-a putut crea categoria."),
      });
    }
  };

  if (list.isLoading) return <SkeletonList rows={3} />;
  if (list.isError) return <ErrorState onRetry={() => list.refetch()} />;

  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Categorii angajați"
        description="Etichete folosite pentru clasificare HR. Nu controlează permisiuni — folosit pentru raportare."
        actions={
          <Button size="sm" onClick={() => setDrawerOpen("create")}>
            <Plus className="w-4 h-4" /> Categorie nouă
          </Button>
        }
      >
        {rows.length === 0 ? (
          <EmptyArt
            icon={Tag}
            title="Nicio categorie"
            description="Creează o categorie pentru a clasifica angajații."
            action={
              <Button size="sm" onClick={() => setDrawerOpen("create")}>
                <Plus className="w-4 h-4" /> Categorie nouă
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {rows.map((cat) => (
              <li
                key={cat.id}
                className="px-2 py-3 flex items-center gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-foreground/10"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setEditTarget(cat);
                    setDrawerOpen("edit");
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setDeleteTarget(cat)}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Drawer
        open={drawerOpen !== null}
        onClose={() => {
          setDrawerOpen(null);
          setEditTarget(null);
        }}
        title={
          drawerOpen === "edit" ? "Editează categorie" : "Categorie nouă"
        }
        description="Categoriile sunt etichete simple pentru HR — nu controlează permisiuni."
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Field Employee"
            required
          />
          <Textarea
            label="Descriere"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — în ce constă această categorie."
          />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Culoare
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Culoare ${c}`}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success("Categorie ștearsă.");
                setDeleteTarget(null);
              },
              onError: () => toast.error("Nu s-a putut șterge."),
            });
          }
        }}
        title="Ștergi categoria?"
        description={`Categoria „${deleteTarget?.name}” va fi eliminată. Userii asociați rămân fără categorie.`}
        confirmLabel="Șterge"
      />
    </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const navigate = useNavigate();
  const users = useCollectionList<AppUser>("settings-users", "/settings/users");
  const roles = useCollectionList<AppRole>("settings-roles", "/settings/roles");
  const create = useCollectionCreate<object, AppUser>("settings-users", "/settings/users");
  const update = useCollectionUpdate<object, AppUser>(
    "settings-users",
    (id) => `/settings/users/${id}`
  );
  const remove = useCollectionDelete<{ message: string }>(
    "settings-users",
    (id) => `/settings/users/${id}`
  );
  const sendInvite = useCollectionAction<{ message: string }>(
    "settings-users",
    (id) => `/settings/users/${id}/invite`
  );
  const resetPassword = useCollectionAction<{ message: string }>(
    "settings-users",
    (id) => `/settings/users/${id}/reset-password`
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<AppUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<number[]>([DEFAULT_ROLE_ID]);
  const [query, setQuery] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRoleIds, setEditRoleIds] = useState<number[]>([DEFAULT_ROLE_ID]);
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  const createNameError = name.trim() ? "" : "Numele este obligatoriu.";
  const createEmailError =
    email.trim() && !EMAIL_RE.test(email.trim()) ? "Email invalid." : "";
  const editNameError = editName.trim() ? "" : "Numele este obligatoriu.";
  const editEmailError =
    editEmail.trim() && !EMAIL_RE.test(editEmail.trim()) ? "Email invalid." : "";
  const canCreate = !createNameError && !createEmailError;
  const canSaveEditBase = !editNameError && !editEmailError;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users.data ?? []).filter((u) =>
      !q ? true : `${u.name} ${u.email}`.toLowerCase().includes(q)
    );
  }, [users.data, query]);

  const roleIdsOf = (user: AppUser): number[] => {
    const ids = Array.isArray(user.role_ids) && user.role_ids.length > 0
      ? user.role_ids
      : typeof user.role_id === "number"
        ? [user.role_id]
        : [DEFAULT_ROLE_ID];
    return [...new Set(ids.filter((id) => Number.isFinite(id)))];
  };

  const roleNameOf = (rid: number) =>
    roles.data?.find((r) => r.id === rid)?.name ?? `Rol #${rid}`;

  const roleNamesOf = (ids: number[]) => ids.map(roleNameOf);
  const ownerRoleIds = useMemo(
    () => new Set((roles.data ?? []).filter(isOwnerRole).map((role) => role.id)),
    [roles.data]
  );
  const userHasOwnerRole = (user: AppUser, ids = roleIdsOf(user)) =>
    ids.some((id) => ownerRoleIds.has(id));
  const activeOwnerCount = useMemo(
    () =>
      (users.data ?? []).filter(
        (user) => user.status === "active" && userHasOwnerRole(user)
      ).length,
    [users.data, ownerRoleIds]
  );
  const isLastActiveOwner = (user: AppUser) =>
    user.status === "active" && userHasOwnerRole(user) && activeOwnerCount <= 1;
  const editingIsLastActiveOwner = editing ? isLastActiveOwner(editing) : false;
  const editKeepsOwnerRole = editRoleIds.some((id) => ownerRoleIds.has(id));
  const lastOwnerEditBlocked =
    editingIsLastActiveOwner && (!editKeepsOwnerRole || editStatus !== "active");
  const canSaveEdit = canSaveEditBase && !lastOwnerEditBlocked;

  const toggleRoleId = (id: number, current: number[], setNext: (ids: number[]) => void) => {
    const next = current.includes(id)
      ? current.filter((roleId) => roleId !== id)
      : [...current, id];
    setNext(next.length > 0 ? next : [id]);
  };

  const userHandle = (user: AppUser) =>
    user.email ? `@${user.email.split("@")[0]}` : `#${user.id}`;

  const openEdit = (user: AppUser) => {
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone ?? "");
    setEditTitle(user.title ?? "");
    setEditRoleIds(roleIdsOf(user));
    setEditStatus(user.status === "inactive" ? "inactive" : "active");
  };

  const closeEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing || !canSaveEdit) return;
    if (lastOwnerEditBlocked) {
      toast.error("Ultimul Owner activ nu poate fi demis sau dezactivat din UI.");
      return;
    }
    const savedRoleIds = editRoleIds.length > 0 ? editRoleIds : [DEFAULT_ROLE_ID];
    update.mutate(
      {
        id: editing.id,
        payload: {
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          title: editTitle.trim(),
          role_id: savedRoleIds[0],
          role_ids: savedRoleIds,
          status: editStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success("Utilizator actualizat.");
          closeEdit();
        },
        onError: () => toast.error("Nu s-a putut actualiza utilizatorul."),
      }
    );
  };

  const createUser = () => {
    if (!canCreate) return;
    const savedRoleIds = roleIds.length > 0 ? roleIds : [DEFAULT_ROLE_ID];
    create.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        role_id: savedRoleIds[0],
        role_ids: savedRoleIds,
        status: "active",
      },
      {
        onSuccess: () => {
          toast.success("Utilizator creat.");
          setName("");
          setEmail("");
          setRoleIds([DEFAULT_ROLE_ID]);
          setOpen(false);
        },
        onError: () => toast.error("Nu s-a putut crea utilizatorul."),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (isLastActiveOwner(deleteTarget)) {
      toast.error("Ultimul Owner activ nu poate fi șters din UI.");
      setDeleteTarget(null);
      return;
    }
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Utilizator șters.");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Nu s-a putut șterge utilizatorul."),
    });
  };

  const confirmStatusChange = () => {
    if (!statusTarget) return;
    if (isLastActiveOwner(statusTarget) && statusTarget.status === "active") {
      toast.error("Ultimul Owner activ nu poate fi dezactivat din UI.");
      setStatusTarget(null);
      return;
    }
    const nextStatus = statusTarget.status === "active" ? "inactive" : "active";
    update.mutate(
      { id: statusTarget.id, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(nextStatus === "active" ? "Utilizator activat." : "Utilizator dezactivat.");
          setStatusTarget(null);
        },
        onError: () => toast.error("Statusul nu a putut fi schimbat."),
      }
    );
  };

  const handleInvite = (user: AppUser) => {
    sendInvite.mutate(
      { id: user.id },
      {
        onSuccess: () => toast.success(`Invitație trimisă către ${user.email || user.name}.`),
        onError: () => toast.error("Invitația nu a putut fi trimisă."),
      }
    );
  };

  const handleResetPassword = (user: AppUser) => {
    resetPassword.mutate(
      { id: user.id },
      {
        onSuccess: () => toast.success(`Reset password trimis către ${user.email || user.name}.`),
        onError: () => toast.error("Reset password nu a putut fi trimis."),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută utilizator..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Utilizator nou
        </Button>
      </div>

      <SectionCard padding="none">
        {users.isLoading ? (
          <SkeletonList rows={6} />
        ) : users.isError ? (
          <ErrorState onRetry={users.refetch} />
        ) : filtered.length === 0 ? (
          <EmptyArt icon={Users} title="Niciun utilizator" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-semibold">Persoană</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const userRoleIds = roleIdsOf(u);
                const userRoleNames = roleNamesOf(userRoleIds);
                const lastOwner = isLastActiveOwner(u);
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/3 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" status={u.status === "active" ? "online" : "offline"} />
                        <div>
                          <p className="text-sm font-semibold">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {u.title || userHandle(u)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userRoleNames.slice(0, 2).map((roleName) => (
                          <Badge key={roleName} variant="accent">
                            {roleName}
                          </Badge>
                        ))}
                        {userRoleIds.length > 2 && (
                          <Badge variant="neutral">+{userRoleIds.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={lastOwner}
                        onClick={() => setStatusTarget(u)}
                        className="disabled:cursor-not-allowed disabled:opacity-70"
                        title={lastOwner ? "Ultimul Owner activ este protejat." : "Schimbă status"}
                      >
                        <Badge variant={u.status === "active" ? "success" : "neutral"}>
                          {u.status === "active" ? "Activ" : "Inactiv"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="xs" variant="ghost" onClick={() => navigate(`/app/settings/users/${u.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => openEdit(u)}>
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleInvite(u)}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleResetPassword(u)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => setDeleteTarget(u)}
                          disabled={lastOwner}
                          title={lastOwner ? "Ultimul Owner activ este protejat." : "Șterge utilizator"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Utilizator nou"
        description="Va primi un cont activ cu rolul ales."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              disabled={!canCreate}
              onClick={createUser}
            >
              Adaugă
            </Button>
          </div>
        }
      >
        <Input
          label="Nume"
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...(name.length > 0 && createNameError ? { error: createNameError } : {})}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...(createEmailError ? { error: createEmailError } : {})}
        />
        <div>
          <p className="text-sm font-medium mb-1.5">Roluri</p>
          <div className="flex flex-wrap gap-1.5">
            {(roles.data ?? []).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRoleId(r.id, roleIds, setRoleIds)}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                  roleIds.includes(r.id)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:bg-foreground/5"
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </Drawer>

      <Drawer
        open={!!editing}
        onClose={closeEdit}
        width="lg"
        title="Editează utilizator"
        description={editing ? `${userHandle(editing)} · ${roleNamesOf(roleIdsOf(editing)).join(", ")}` : ""}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeEdit}>
              Anulează
            </Button>
            <Button loading={update.isPending} disabled={!canSaveEdit} onClick={saveEdit}>
              <Check className="w-4 h-4" /> Salvează modificările
            </Button>
          </div>
        }
      >
        {editing && (
          <>
            <section className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-4">
                <Avatar
                  name={editName || editing.name}
                  size="lg"
                  status={editStatus === "active" ? "online" : "offline"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold truncate">
                    {editName || editing.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {userHandle(editing)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roleNamesOf(editRoleIds).map((name) => (
                      <Badge key={name} variant="accent">
                        {name}
                      </Badge>
                    ))}
                    <Badge variant={editStatus === "active" ? "success" : "neutral"}>
                      {editStatus === "active" ? "Activ" : "Inactiv"}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informații personale
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Datele vizibile în echipă și în auditul acțiunilor.
                </p>
              </div>
              <Input
                label="Nume complet"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                {...(editName.length > 0 && editNameError ? { error: editNameError } : {})}
                placeholder="ex: Ana Popescu"
              />
              <Input
                label="Titlu intern"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="ex: Senior Accountant"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  {...(editEmailError ? { error: editEmailError } : {})}
                  leadingIcon={<Mail className="w-4 h-4" />}
                  placeholder="nume@contapp.ro"
                />
                <Input
                  label="Telefon"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  leadingIcon={<Phone className="w-4 h-4" />}
                  placeholder="07xx xxx xxx"
                />
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rol și acces
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Poți selecta mai multe roluri pentru același utilizator.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(roles.data ?? []).map((role) => {
                  const selected = editRoleIds.includes(role.id);
                  const lockedOwnerRole =
                    editingIsLastActiveOwner && selected && ownerRoleIds.has(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      disabled={lockedOwnerRole}
                      onClick={() => {
                        if (lockedOwnerRole) {
                          toast.info("Ultimul Owner activ trebuie să păstreze rolul Owner.");
                          return;
                        }
                        toggleRoleId(role.id, editRoleIds, setEditRoleIds);
                      }}
                      title={lockedOwnerRole ? "Ultimul Owner activ este protejat." : role.name}
                      className={cn(
                        "text-left rounded-xl border p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                        selected
                          ? "border-[color:var(--accent)]/60 bg-[color:var(--accent)]/12"
                          : "border-border hover:bg-foreground/4"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{role.name}</span>
                        {selected && <Check className="w-4 h-4" />}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground line-clamp-2">
                        {role.description || "Rol fără descriere."}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Status cont</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Utilizatorii inactivi rămân în listă, dar sunt marcați separat.
                  </p>
                </div>
                <SegmentedControl
                  value={editStatus}
                  onChange={(next) => {
                    if (next === "inactive" && editingIsLastActiveOwner) {
                      toast.info("Ultimul Owner activ nu poate fi dezactivat.");
                      return;
                    }
                    setEditStatus(next);
                  }}
                  options={[
                    { id: "active", label: "Activ" },
                    { id: "inactive", label: "Inactiv" },
                  ]}
                  className="self-start sm:self-center"
                />
              </div>
              {lastOwnerEditBlocked && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
                  Ultimul Owner activ trebuie să rămână activ și să păstreze rolul Owner.
                </p>
              )}
            </section>
          </>
        )}
      </Drawer>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Șterge utilizator"
        description={`Ești sigur că vrei să ștergi utilizatorul "${deleteTarget?.name ?? ""}"? Acțiunea nu poate fi anulată.`}
        confirmLabel="Șterge"
        confirmPhrase="STERGE"
      />
      <ConfirmModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
        title={statusTarget?.status === "active" ? "Dezactivează utilizator" : "Activează utilizator"}
        description={`Confirmă schimbarea statusului pentru "${statusTarget?.name ?? ""}".`}
        confirmLabel={statusTarget?.status === "active" ? "Dezactivează" : "Activează"}
        variant="warning"
      />
    </div>
  );
}

function RolesTab() {
  const toast = useToast();
  const roles = useCollectionList<AppRole>("settings-roles", "/settings/roles");
  const create = useCollectionCreate<object, AppRole>("settings-roles", "/settings/roles");
  const update = useCollectionUpdate<object, AppRole>(
    "settings-roles",
    (id) => `/settings/roles/${id}`
  );
  const remove = useCollectionDelete<{ message: string }>(
    "settings-roles",
    (id) => `/settings/roles/${id}`
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppRole | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const roleNameError = name.trim() ? "" : "Numele rolului este obligatoriu.";

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setOpen(true);
  };

  const openEditRole = (role: AppRole) => {
    if (isOwnerRole(role)) {
      toast.info("Rolul Owner este protejat și nu poate fi editat din UI.");
      return;
    }
    setEditing(role);
    setName(role.name);
    setDescription(role.description);
    setSelectedPermissions(validRolePermissions(role.permissions ?? []));
    setOpen(true);
  };

  const togglePermission = (key: string) => {
    if (isOwnerRole(editing)) return;
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const saveRole = () => {
    if (roleNameError) return;
    if (isOwnerRole(editing)) {
      toast.error("Rolul Owner nu poate fi modificat.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      permissions: validRolePermissions(selectedPermissions),
    };
    if (editing) {
      update.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success("Rol actualizat.");
            setOpen(false);
          },
          onError: () => toast.error("Rolul nu a putut fi actualizat."),
        }
      );
      return;
    }
    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Rol creat.");
        setOpen(false);
      },
      onError: () => toast.error("Rolul nu a putut fi creat."),
    });
  };

  const deleteRole = () => {
    if (!deleteTarget) return;
    if (isOwnerRole(deleteTarget)) {
      toast.error("Rolul Owner nu poate fi șters.");
      setDeleteTarget(null);
      return;
    }
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Rol șters.");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Rolul nu a putut fi șters."),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Rol nou
        </Button>
      </div>
      {roles.isLoading ? (
        <SkeletonList rows={4} />
      ) : roles.isError ? (
        <ErrorState onRetry={roles.refetch} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(roles.data ?? []).map((role) => {
          const owner = isOwnerRole(role);
          const permissionPreview = owner ? ["*"] : role.permissions ?? [];
          return (
            <article
              key={role.id}
              className="rounded-2xl border border-border bg-frame p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">{role.name}</h3>
                    {owner && <Badge variant="warning">protejat</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                </div>
                <Shield className="w-5 h-5 text-foreground/30" />
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {permissionPreview.slice(0, 6).map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                  >
                    {p === "*" ? "toate permisiunile" : p}
                  </span>
                ))}
                {permissionPreview.length > 6 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{permissionPreview.length - 6}
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
                <Button size="xs" variant="outline" onClick={() => openEditRole(role)} disabled={owner}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(role)} disabled={owner}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        width="lg"
        title={editing ? "Editează rol" : "Rol nou"}
        description="Configurează numele, descrierea și permisiunile rolului."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              disabled={!!roleNameError || isOwnerRole(editing)}
              onClick={saveRole}
            >
              {editing ? "Salvează" : "Creează"}
            </Button>
          </div>
        }
      >
        <Input
          label="Nume rol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...(name.length > 0 && roleNameError ? { error: roleNameError } : {})}
        />
        <Textarea
          label="Descriere"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div>
          <p className="text-sm font-medium mb-2">Permisiuni</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedPermissions((prev) => (prev.includes("*") ? [] : ["*"]))
              }
              disabled={isOwnerRole(editing)}
              className={cn(
                "text-left rounded-xl border p-3 transition-colors disabled:opacity-50",
                selectedPermissions.includes("*")
                  ? "border-[color:var(--accent)]/60 bg-[color:var(--accent)]/12"
                  : "border-border hover:bg-foreground/4"
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-semibold">Acces complet</span>
                {selectedPermissions.includes("*") && <Check className="w-4 h-4" />}
              </span>
              <span className="text-xs text-muted-foreground mt-1 block">
                Include toate permisiunile backend definite în prezent.
              </span>
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {PERMISSION_GROUPS.map((group) => {
              const permissions = permissionsForGroup(group.id);
              const allSelected = permissions.every((permission) =>
                selectedPermissions.includes(permission.slug)
              );
              return (
                <section key={group.id} className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{group.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={selectedPermissions.includes("*") || isOwnerRole(editing)}
                      onClick={() => {
                        setSelectedPermissions((prev) => {
                          const groupSlugs = permissions.map((permission) => permission.slug);
                          if (allSelected) return prev.filter((slug) => !groupSlugs.includes(slug));
                          return [...new Set([...prev, ...groupSlugs])];
                        });
                      }}
                    >
                      {allSelected ? "Debifează" : "Selectează grup"}
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {permissions.map((permission) => {
                      const checked =
                        selectedPermissions.includes("*") ||
                        selectedPermissions.includes(permission.slug);
                      return (
                        <button
                          key={permission.slug}
                          type="button"
                          disabled={selectedPermissions.includes("*") || isOwnerRole(editing)}
                          onClick={() => togglePermission(permission.slug)}
                          className={cn(
                            "text-left rounded-xl border p-3 transition-colors disabled:opacity-50",
                            checked
                              ? "border-foreground/35 bg-foreground/8"
                              : "border-border hover:bg-foreground/4"
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{permission.label}</span>
                            {checked && <Check className="w-4 h-4" />}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-1 block">
                            {permission.slug}
                          </span>
                          <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                            {permission.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </Drawer>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteRole}
        title="Șterge rol"
        description={`Ești sigur că vrei să ștergi rolul "${deleteTarget?.name ?? ""}"?`}
        confirmLabel="Șterge"
        confirmPhrase="STERGE"
      />
    </div>
  );
}

function PermissionsTab() {
  const toast = useToast();
  const users = useCollectionList<AppUser>("settings-users", "/settings/users");
  const roles = useCollectionList<AppRole>("settings-roles", "/settings/roles");
  const update = useCollectionUpdate<object, AppRole>(
    "settings-roles",
    (id) => `/settings/roles/${id}`
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const numericSelectedUserId = Number.parseInt(selectedUserId, 10);
  const effectivePermissions = useCollectionItem<EffectivePermissions>(
    "settings-effective-permissions",
    `/settings/permissions/effective/${numericSelectedUserId}`,
    "",
    Number.isFinite(numericSelectedUserId) && numericSelectedUserId > 0
  );

  useEffect(() => {
    if (!selectedUserId && users.data?.length) {
      setSelectedUserId(String(users.data[0]!.id));
    }
  }, [selectedUserId, users.data]);

  const toggleRolePermission = (role: AppRole, permission: string) => {
    if (isOwnerRole(role)) {
      toast.info("Rolul Owner este protejat și nu poate fi modificat.");
      return;
    }
    const current = role.permissions ?? [];
    const next = current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current.filter((p) => p !== "*"), permission];
    update.mutate(
      {
        id: role.id,
        payload: {
          name: role.name,
          description: role.description,
          permissions: next,
        },
      },
      {
        onSuccess: () => toast.success("Permisiune actualizată."),
        onError: () => toast.error("Permisiunea nu a putut fi salvată."),
      }
    );
  };

  if (roles.isLoading || users.isLoading) return <SkeletonList rows={5} />;
  if (roles.isError || users.isError) {
    return <ErrorState onRetry={() => void Promise.all([roles.refetch(), users.refetch()])} />;
  }

  const userOptions = (users.data ?? []).map((user) => ({
    value: String(user.id),
    label: `${user.name} · ${user.email}`,
  }));
  const selectedUser = users.data?.find((user) => user.id === numericSelectedUserId);
  const effectivePerms = effectivePermissions.data?.permissions ?? [];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Permisiuni efective pe utilizator"
        description="Previzualizare din endpointul /settings/permissions/effective/:userId."
      >
        <div className="space-y-3">
          <Select
            label="Utilizator"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={userOptions}
            placeholder={userOptions.length === 0 ? "Niciun utilizator disponibil" : "Selectează utilizator"}
          />
          {effectivePermissions.isLoading && (
            <p className="text-sm text-muted-foreground">Se încarcă permisiunile efective...</p>
          )}
          {effectivePermissions.isError && (
            <p className="text-sm text-red-500">
              Nu am putut încărca permisiunile pentru utilizatorul selectat.
            </p>
          )}
          {!effectivePermissions.isLoading && !effectivePermissions.isError && selectedUser && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {selectedUser.name} are {effectivePerms.length} permisiuni efective.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {effectivePerms.map((permission) => (
                  <Badge key={permission} variant={permission === "*" ? "success" : "neutral"}>
                    <KeyRound className="w-3 h-3" /> {permission}
                  </Badge>
                ))}
                {effectivePerms.length === 0 && (
                  <Badge variant="neutral">Fără permisiuni</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Matrice de permisiuni"
        description="Bifează ce poate face fiecare rol. Modificările se salvează prin backend."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-semibold">Permisiune</th>
                {(roles.data ?? []).map((role) => (
                  <th key={role.id} className="py-2 px-2 text-center font-semibold">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.id}>
                  <tr key={`${group.id}-heading`} className="bg-foreground/3">
                    <td
                      className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      colSpan={(roles.data ?? []).length + 1}
                    >
                      {group.label}
                    </td>
                  </tr>
                  {permissionsForGroup(group.id).map((perm) => (
                    <tr key={perm.slug} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4">
                        <div>
                          <p className="font-medium">{perm.label}</p>
                          <p className="text-[11px] text-muted-foreground">{perm.slug}</p>
                        </div>
                      </td>
                      {(roles.data ?? []).map((role) => {
                        const owner = isOwnerRole(role);
                        const has = owner || role.permissions.includes("*") || role.permissions.includes(perm.slug);
                        return (
                          <td key={role.id} className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={has}
                              disabled={owner || role.permissions.includes("*") || update.isPending}
                              onChange={() => toggleRolePermission(role, perm.slug)}
                              className="w-4 h-4 accent-foreground"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      </div>
  );
}
