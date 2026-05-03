import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  KeyRound,
  Mail,
  Phone,
  RotateCcw,
  Send,
  Shield,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { SectionCard } from "../../../components/ui/SectionCard";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { ActivityTimeline, type ActivityItem } from "../../../components/ui/ActivityTimeline";
import { useToast } from "../../../components/ui/Toast";
import {
  useCollectionAction,
  useCollectionItem,
  useCollectionList,
} from "../../../hooks/useCollection";
import { fmtDate, fmtRelative } from "../../../lib/utils";

type AppUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_id?: number;
  role_ids?: number[];
  status: string;
  title?: string;
  date_added?: string;
  date_modified?: string;
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

function roleIdsOf(user: AppUser | undefined): number[] {
  if (!user) return [];
  const ids = Array.isArray(user.role_ids) && user.role_ids.length > 0
    ? user.role_ids
    : typeof user.role_id === "number"
      ? [user.role_id]
      : [DEFAULT_ROLE_ID];
  return [...new Set(ids)];
}

export default function UserProfilePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number.parseInt(id ?? "", 10);

  const user = useCollectionItem<AppUser>(
    "settings-user",
    `/settings/users/${numericId}`,
    "",
    Number.isFinite(numericId) && numericId > 0
  );
  const roles = useCollectionList<AppRole>("settings-roles", "/settings/roles");
  const effectivePermissions = useCollectionItem<EffectivePermissions>(
    "settings-effective-permissions",
    `/settings/permissions/effective/${numericId}`,
    "",
    Number.isFinite(numericId) && numericId > 0
  );
  const sendInvite = useCollectionAction<{ message: string }>(
    "settings-users",
    (userId) => `/settings/users/${userId}/invite`
  );
  const resetPassword = useCollectionAction<{ message: string }>(
    "settings-users",
    (userId) => `/settings/users/${userId}/reset-password`
  );

  const selectedRoles = useMemo(() => {
    const ids = roleIdsOf(user.data);
    return (roles.data ?? []).filter((role) => ids.includes(role.id));
  }, [roles.data, user.data]);

  const roleBasedPermissions = useMemo(() => {
    const set = new Set<string>();
    for (const role of selectedRoles) {
      for (const permission of role.permissions ?? []) set.add(permission);
    }
    return Array.from(set);
  }, [selectedRoles]);
  const permissions = effectivePermissions.data?.permissions ?? roleBasedPermissions;

  const timeline: ActivityItem[] = useMemo(() => {
    if (!user.data) return [];
    const rows: ActivityItem[] = [];
    if (user.data.date_added) {
      rows.push({
        id: "created",
        title: "Utilizator creat",
        description: `${user.data.name} a fost adăugat în workspace.`,
        at: fmtRelative(user.data.date_added),
        icon: <UserRound className="w-4 h-4" />,
        tone: "success",
      });
    }
    if (user.data.date_modified && user.data.date_modified !== user.data.date_added) {
      rows.push({
        id: "updated",
        title: "Profil actualizat",
        description: "Datele sau rolurile utilizatorului au fost modificate.",
        at: fmtRelative(user.data.date_modified),
        icon: <Shield className="w-4 h-4" />,
        tone: "info",
      });
    }
    rows.push({
      id: "invite-actions",
      title: "Invitație disponibilă",
      description: "Poți retrimite invitația sau reseta parola din acțiunile rapide.",
      at: "disponibil",
      icon: <Send className="w-4 h-4" />,
      tone: "neutral",
    });
    return rows;
  }, [user.data]);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Utilizator invalid" />
        <Link to="/app/settings/users-roles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" /> Înapoi la Users & Roles
          </Button>
        </Link>
      </div>
    );
  }

  if (user.isLoading || roles.isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (user.isError || roles.isError) {
    return (
      <ErrorState
        onRetry={() => void Promise.all([user.refetch(), roles.refetch()])}
      />
    );
  }

  if (!user.data) return null;

  const handleInvite = () => {
    sendInvite.mutate(
      { id: user.data.id },
      {
        onSuccess: () => toast.success(`Invitație trimisă către ${user.data.email || user.data.name}.`),
        onError: () => toast.error("Invitația nu a putut fi trimisă."),
      }
    );
  };

  const handleReset = () => {
    resetPassword.mutate(
      { id: user.data.id },
      {
        onSuccess: () => toast.success(`Reset password trimis către ${user.data.email || user.data.name}.`),
        onError: () => toast.error("Reset password nu a putut fi trimis."),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.data.name}
        description={user.data.title || "Profil utilizator"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleInvite}>
              <Send className="w-4 h-4" /> Trimite invite
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" /> Reset parolă
            </Button>
          </div>
        }
      />

      <button
        onClick={() => navigate("/app/settings/users-roles")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Înapoi la Users & Roles
      </button>

      <section className="rounded-2xl border border-border bg-frame p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <Avatar name={user.data.name} size="xl" status={user.data.status === "active" ? "online" : "offline"} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{user.data.name}</h2>
              <Badge variant={user.data.status === "active" ? "success" : "neutral"}>
                {user.data.status === "active" ? "Activ" : "Inactiv"}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <a href={`mailto:${user.data.email}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Mail className="w-4 h-4" /> {user.data.email || "Fără email"}
              </a>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" /> {user.data.phone || "Fără telefon"}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                Creat {user.data.date_added ? fmtDate(user.data.date_added) : "necunoscut"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Roluri" description="Rolurile active pe utilizator.">
          <div className="space-y-2">
            {selectedRoles.map((role) => (
              <div key={role.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-sm font-semibold">{role.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Permisiuni" description="Permisiuni efective din endpointul dedicat.">
          {effectivePermissions.isError && (
            <p className="mb-2 text-xs text-muted-foreground">
              Nu am putut încărca endpointul efectiv; afișăm fallback-ul din roluri.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <Badge key={permission} variant={permission === "*" ? "success" : "neutral"}>
                <KeyRound className="w-3 h-3" /> {permission}
              </Badge>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Activitate" description="Istoric operațional.">
          <ActivityTimeline items={timeline} />
        </SectionCard>
      </div>
    </div>
  );
}
