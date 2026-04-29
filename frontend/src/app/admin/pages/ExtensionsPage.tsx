import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Layers, Lock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import {
  EXTENSIONS,
  labelOneLine,
  EXTENSION_KEYS,
  type ExtensionKey,
} from "../../../lib/extensions";
import { cn } from "../../../lib/utils";

interface AdminOrganisation {
  id: number;
  name: string;
  status: string;
  plan: string;
  employees: number;
}

type OrgExtensionsResponse = {
  extensions: Record<ExtensionKey, boolean>;
};

export default function ExtensionsPage() {
  const [params, setParams] = useSearchParams();
  const orgParam = params.get("org");
  const toast = useToast();
  const qc = useQueryClient();

  const orgs = useCollectionList<AdminOrganisation>(
    "admin-organisations",
    "/admin/organisations"
  );

  const [selectedId, setSelectedId] = useState<number | null>(
    orgParam ? Number.parseInt(orgParam, 10) : null
  );

  useEffect(() => {
    if (!selectedId && orgs.data && orgs.data.length > 0) {
      setSelectedId(orgs.data[0]!.id);
    }
  }, [orgs.data, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const next = new URLSearchParams(params);
    next.set("org", String(selectedId));
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const orgExt = useQuery<OrgExtensionsResponse>({
    queryKey: ["admin-org-extensions", selectedId],
    queryFn: () =>
      api.get<OrgExtensionsResponse>(
        `/admin/organisations/${selectedId}/extensions`
      ),
    enabled: !!selectedId,
  });

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: ExtensionKey; enabled: boolean }) =>
      api.put<OrgExtensionsResponse>(
        `/admin/organisations/${selectedId}/extensions`,
        { key, enabled }
      ),
    onSuccess: (data) => {
      qc.setQueryData(["admin-org-extensions", selectedId], data);
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Toggle eșuat."),
  });

  const selectedOrg = useMemo(
    () => orgs.data?.find((o) => o.id === selectedId) ?? null,
    [orgs.data, selectedId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extensii pe organizație"
        description="Activează / dezactivează extensiile plătite pentru fiecare organizație."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-2xl border border-border bg-frame overflow-hidden">
          <header className="px-4 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Organizații
          </header>
          {orgs.isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : orgs.isError ? (
            <div className="p-4">
              <ErrorState onRetry={() => orgs.refetch()} />
            </div>
          ) : (
            <ul className="p-1 max-h-[460px] overflow-y-auto">
              {(orgs.data ?? []).map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-colors",
                      selectedId === o.id
                        ? "bg-foreground/8"
                        : "hover:bg-foreground/5"
                    )}
                  >
                    <span className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{o.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.plan} · {o.employees} angajați
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="rounded-2xl border border-border bg-frame">
          {!selectedOrg ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-60" />
              Selectează o organizație din stânga.
            </div>
          ) : (
            <>
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">{selectedOrg.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrg.plan} · {selectedOrg.employees} angajați ·
                    status {selectedOrg.status}
                  </p>
                </div>
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" /> admin
                </Badge>
              </header>
              <div className="p-4 space-y-2">
                {orgExt.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : orgExt.isError ? (
                  <ErrorState onRetry={() => orgExt.refetch()} />
                ) : (
                  EXTENSION_KEYS.map((key) => {
                    const meta = EXTENSIONS[key];
                    const Icon = meta.icon;
                    const enabled = !!orgExt.data?.extensions[key];
                    const disabled = toggle.isPending || !meta.available;
                    return (
                      <div
                        key={key}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border"
                      >
                        <span className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
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
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            toggle.mutate(
                              { key, enabled: !enabled },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    `${labelOneLine(meta.label)}: ${enabled ? "dezactivat" : "activat"}`
                                  ),
                              }
                            )
                          }
                          disabled={disabled}
                          aria-label={`Comută ${labelOneLine(meta.label)}`}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative shrink-0 mt-1",
                            enabled ? "bg-[color:var(--accent)]" : "bg-foreground/15",
                            disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                              enabled && "translate-x-5"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
