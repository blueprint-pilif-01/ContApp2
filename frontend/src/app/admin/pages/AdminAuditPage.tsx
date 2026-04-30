import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { SectionCard } from "../../../components/ui/SectionCard";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useCollectionList } from "../../../hooks/useCollection";
import { fmtRelative } from "../../../lib/utils";

interface AuditEvent {
  id: number;
  organisation_id: number;
  actor_kind: "user" | "admin";
  actor_id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details?: string;
  created_at: string;
}

export default function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const list = useCollectionList<AuditEvent>("admin-audit", "/admin/audit");

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.action} ${r.actor_name} ${r.entity_type} ${r.details ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [list.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Toate evenimentele administrative și business cu actor identificat."
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută acțiune, actor, detalii..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <Badge variant="neutral">{filtered.length} evenimente</Badge>
      </div>

      <SectionCard icon={Activity} title="Evenimente">
        {list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nicio intrare în jurnal.
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {filtered.map((evt) => (
              <li key={evt.id} className="px-2 py-3 flex items-start gap-3">
                <Avatar name={evt.actor_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="font-mono text-xs px-1 py-0.5 rounded bg-foreground/5 mr-2">
                      {evt.action}
                    </span>
                    <span className="text-muted-foreground">
                      {evt.actor_name} ({evt.actor_kind})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    org #{evt.organisation_id} · {evt.entity_type} #{evt.entity_id}
                    {evt.details ? ` · ${evt.details}` : ""}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {fmtRelative(evt.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
