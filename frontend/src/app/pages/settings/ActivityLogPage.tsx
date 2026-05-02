import { useMemo, useState } from "react";
import { Activity, Filter, Search, ExternalLink } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { Input } from "../../../components/ui/Input";
import { useCollectionList } from "../../../hooks/useCollection";
import { fmtRelative, fmtDate } from "../../../lib/utils";

type ActivityEntry = {
  id: number;
  user_id: number;
  user_name: string;
  action: "create" | "update" | "delete" | "login" | "sign";
  entity_type: string;
  entity_id: number;
  entity_title: string;
  details?: string;
  created_at: string;
  link?: string;
};

const actionStyles: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  create: { label: "Creat", variant: "success" },
  update: { label: "Modificat", variant: "warning" },
  delete: { label: "Șters", variant: "danger" },
  login: { label: "Autentificare", variant: "info" },
  sign: { label: "Semnat", variant: "success" },
};

const entityLabels: Record<string, string> = {
  client: "Client",
  contract: "Contract",
  task: "Ticket",
  document: "Document",
  hr_leave: "Concediu",
  message: "Mesaj",
};

export default function ActivityLogPage() {
  const logs = useCollectionList<ActivityEntry>("activity-log", "/activity-log");
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const items = logs.data ?? [];

  const filtered = useMemo(() => {
    let result = items;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.entity_title.toLowerCase().includes(q) ||
          e.user_name.toLowerCase().includes(q) ||
          (e.details ?? "").toLowerCase().includes(q)
      );
    }
    if (actionFilter !== "all") result = result.filter((e) => e.action === actionFilter);
    if (entityFilter !== "all") result = result.filter((e) => e.entity_type === entityFilter);
    return result;
  }, [items, query, actionFilter, entityFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>();
    for (const e of filtered) {
      const day = e.created_at.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Istoric complet al tuturor acțiunilor din sistem."
        actions={
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{items.length} acțiuni</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Caută acțiune, user, entitate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="all">Toate acțiunile</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="sign">Sign</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="all">Toate entitățile</option>
            <option value="client">Clienți</option>
            <option value="contract">Contracte</option>
            <option value="task">Tickete</option>
            <option value="document">Documente</option>
            <option value="hr_leave">Concedii</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {grouped.map(([day, entries]) => (
          <section key={day}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {fmtDate(day + "T00:00:00")}
            </h3>
            <div className="space-y-1">
              {entries.map((entry) => {
                const style = actionStyles[entry.action] || { label: entry.action, variant: "neutral" as const };
                return (
                  <article
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-frame px-4 py-3 hover:border-foreground/20 transition-colors group"
                  >
                    <Avatar name={entry.user_name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{entry.user_name}</span>{" "}
                        <span className="text-muted-foreground">
                          a {style.label.toLowerCase()}{" "}
                          {entityLabels[entry.entity_type] ?? entry.entity_type}:
                        </span>{" "}
                        <span className="font-medium">{entry.entity_title}</span>
                      </p>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {entry.details}
                        </p>
                      )}
                    </div>
                    <Badge variant={style.variant}>{style.label}</Badge>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {fmtRelative(entry.created_at)}
                    </span>
                    {entry.link && (
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nicio acțiune găsită.</p>
          </div>
        )}
      </div>
    </div>
  );
}
