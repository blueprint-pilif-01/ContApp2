import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CreditCard,
  Edit2,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { Input } from "../../../components/ui/Input";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import {
  EXTENSIONS,
  EXTENSION_KEYS,
  labelOneLine,
  type ExtensionKey,
} from "../../../lib/extensions";
import { cn } from "../../../lib/utils";

interface SubscriptionPlan {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency: string;
  stripe_price_id: string | null;
  limits: Record<string, number | null | string>;
  features: string[];
  created_at: string;
}

interface PlanLimits {
  users: number | null;
  clients: number | null;
  templates: number | null;
  signings_per_month: number | null;
  storage_mb: number | null;
}

interface PlanForm {
  slug: string;
  name: string;
  price: number;
  currency: string;
  stripe_price_id: string;
  limits: PlanLimits;
  features: ExtensionKey[];
}

const CURRENCY_OPTIONS = ["RON", "EUR", "USD"];

const LIMIT_DEFS: { key: keyof PlanLimits; label: string; unit: string }[] = [
  { key: "users", label: "Useri", unit: "user" },
  { key: "clients", label: "Clienți", unit: "client" },
  { key: "templates", label: "Șabloane", unit: "template" },
  { key: "signings_per_month", label: "Semnări / lună", unit: "submisii" },
  { key: "storage_mb", label: "Stocare", unit: "MB" },
];

function emptyForm(): PlanForm {
  return {
    slug: "",
    name: "",
    price: 0,
    currency: "RON",
    stripe_price_id: "",
    limits: {
      users: 5,
      clients: 10,
      templates: 1,
      signings_per_month: 5,
      storage_mb: 256,
    },
    features: [],
  };
}

function formatLimit(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "Nelimitat";
  if (typeof value !== "number") return String(value);
  return `${value.toLocaleString("ro-RO")} ${unit}`;
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Gratuit";
  return `${price.toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export default function AdminPlansPage() {
  const [drawerOpen, setDrawerOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<SubscriptionPlan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionPlan | null>(
    null
  );
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const toast = useToast();
  const qc = useQueryClient();

  const list = useCollectionList<SubscriptionPlan>(
    "admin-subscription-plans",
    "/admin/subscription-plans"
  );

  const create = useMutation({
    mutationFn: (payload: Omit<PlanForm, "stripe_price_id"> & {
      stripe_price_id: string | null;
    }) => api.post<SubscriptionPlan>("/admin/subscription-plans", payload),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success(`Planul „${plan.name}” a fost creat.`);
      setDrawerOpen(null);
      setForm(emptyForm());
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut crea planul."),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: PlanForm }) =>
      api.put<SubscriptionPlan>(`/admin/subscription-plans/${id}`, body),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success(`Plan „${plan.name}” actualizat.`);
      setDrawerOpen(null);
      setEditTarget(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut salva."),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/admin/subscription-plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success("Plan șters.");
      setConfirmDelete(null);
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Nu s-a putut șterge."),
  });

  useEffect(() => {
    if (drawerOpen === "edit" && editTarget) {
      const limits = editTarget.limits ?? {};
      setForm({
        slug: editTarget.slug,
        name: editTarget.name,
        price: editTarget.price,
        currency: editTarget.currency,
        stripe_price_id: editTarget.stripe_price_id ?? "",
        limits: {
          users: numericOrNull(limits.users),
          clients: numericOrNull(limits.clients),
          templates: numericOrNull(limits.templates),
          signings_per_month: numericOrNull(limits.signings_per_month),
          storage_mb: numericOrNull(limits.storage_mb),
        },
        features: (editTarget.features ?? []).filter(
          (f): f is ExtensionKey => (EXTENSION_KEYS as readonly string[]).includes(f)
        ),
      });
    }
    if (drawerOpen === "create") setForm(emptyForm());
  }, [drawerOpen, editTarget]);

  const sortedPlans = useMemo(
    () =>
      (list.data ?? [])
        .slice()
        .sort((a, b) => a.price - b.price),
    [list.data]
  );

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Numele planului este obligatoriu.");
      return;
    }
    const payload = {
      ...form,
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      stripe_price_id: form.stripe_price_id.trim() || null,
    };
    if (drawerOpen === "edit" && editTarget) {
      update.mutate({ id: editTarget.id, body: { ...form, slug: payload.slug } });
    } else {
      create.mutate(payload);
    }
  };

  const toggleFeature = (key: ExtensionKey, on: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.features);
      if (on) next.add(key);
      else next.delete(key);
      return { ...prev, features: Array.from(next) };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planuri de abonament"
        description="Definește planurile platformei: preț, limite și extensii incluse. Folosit la Stripe checkout + entitlement."
        actions={
          <Button onClick={() => setDrawerOpen("create")}>
            <Plus className="w-4 h-4" /> Plan nou
          </Button>
        }
      />

      {list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : list.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : sortedPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-frame p-12 text-center">
          <Layers className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-semibold mb-1">Niciun plan definit.</p>
          <p className="text-xs text-muted-foreground mb-4">
            Adaugă cel puțin un plan ca organizațiile să poată subscrie.
          </p>
          <Button onClick={() => setDrawerOpen("create")}>
            <Plus className="w-4 h-4" /> Plan nou
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => {
                setEditTarget(plan);
                setDrawerOpen("edit");
              }}
              onDelete={() => setConfirmDelete(plan)}
            />
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen !== null}
        onClose={() => {
          setDrawerOpen(null);
          setEditTarget(null);
        }}
        width="lg"
        title={
          drawerOpen === "edit"
            ? `Editează „${editTarget?.name ?? ""}”`
            : "Plan nou"
        }
        description="Completează prețul, limitele și extensiile incluse."
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
              {drawerOpen === "edit" ? "Salvează" : "Creează plan"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informații
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nume"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Pro"
                required
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="pro"
                hint="Auto-generat dacă lași gol."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Preț"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Monedă
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Stripe price ID"
                value={form.stripe_price_id}
                onChange={(e) =>
                  setForm({ ...form, stripe_price_id: e.target.value })
                }
                placeholder="price_..."
                hint="Opțional."
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Limite
            </h3>
            <div className="space-y-2">
              {LIMIT_DEFS.map((def) => {
                const value = form.limits[def.key];
                const unlimited = value === null;
                return (
                  <div
                    key={def.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {def.unit}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      disabled={unlimited}
                      value={unlimited ? "" : (value as number)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            [def.key]:
                              Number.parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className={cn(
                        "w-28 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-right",
                        unlimited && "opacity-40"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            [def.key]: unlimited ? 0 : null,
                          },
                        }))
                      }
                      className={cn(
                        "text-[11px] px-2 py-1 rounded-md border transition-colors shrink-0",
                        unlimited
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-foreground"
                          : "border-border text-muted-foreground hover:bg-foreground/5"
                      )}
                    >
                      {unlimited ? "Nelimitat" : "Setează nelimitat"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Extensii incluse
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {EXTENSION_KEYS.map((key) => {
                const meta = EXTENSIONS[key];
                const Icon = meta.icon;
                const enabled = form.features.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleFeature(key, !enabled)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border text-left transition-colors",
                      enabled
                        ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5"
                        : "border-border bg-background hover:bg-foreground/3"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        enabled
                          ? "bg-[color:var(--accent)]/20 text-foreground"
                          : "bg-foreground/8 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="text-sm font-semibold whitespace-pre-line">
                          {meta.label}
                        </span>
                        {!meta.available && (
                          <Badge variant="neutral" className="text-[10px] shrink-0">
                            roadmap
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1",
                        enabled
                          ? "bg-[color:var(--accent)] border-[color:var(--accent)]"
                          : "border-border"
                      )}
                    >
                      {enabled && (
                        <Check className="w-3 h-3 text-foreground" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) del.mutate(confirmDelete.id);
        }}
        title="Ștergi planul?"
        description={`„${confirmDelete?.name}” va fi eliminat. Organizațiile pe acest plan trebuie migrate manual.`}
        confirmLabel="Șterge plan"
      />
    </div>
  );
}

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.toLowerCase() === "unlimited") return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-frame overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {plan.slug}
            </p>
            <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-foreground/8 text-muted-foreground">
            <CreditCard className="w-3 h-3" /> #{plan.id}
          </span>
        </div>
        <p className="text-2xl font-semibold">
          {formatPrice(plan.price, plan.currency)}
          {plan.price > 0 && (
            <span className="text-xs text-muted-foreground font-normal ml-1">
              / lună
            </span>
          )}
        </p>
        {plan.stripe_price_id && (
          <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
            stripe: {plan.stripe_price_id}
          </p>
        )}
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Limite
          </p>
          <ul className="space-y-1 text-sm">
            {LIMIT_DEFS.map((def) => {
              const value = plan.limits?.[def.key];
              if (value === undefined) return null;
              return (
                <li
                  key={def.key}
                  className="flex items-center justify-between gap-2 text-foreground/80"
                >
                  <span className="text-muted-foreground">{def.label}</span>
                  <span className="font-medium">
                    {value === null || value === "unlimited" ? (
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Sparkles className="w-3 h-3" /> nelimitat
                      </span>
                    ) : (
                      formatLimit(value as number, def.unit)
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Extensii incluse
          </p>
          {(plan.features ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Doar pachetul de bază.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(plan.features ?? []).map((key) => {
                const meta = (EXTENSION_KEYS as readonly string[]).includes(key)
                  ? EXTENSIONS[key as ExtensionKey]
                  : null;
                return (
                  <Badge key={key} variant="accent" className="text-[10px]">
                    {meta ? labelOneLine(meta.label) : key}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-border flex justify-end gap-2">
        <Button size="xs" variant="outline" onClick={onEdit}>
          <Edit2 className="w-3 h-3" /> Editează
        </Button>
        <Button size="xs" variant="ghost" onClick={onDelete}>
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
