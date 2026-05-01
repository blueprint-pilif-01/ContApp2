import { Link } from "react-router-dom";
import { KanbanSquare, Plus, Clock } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { Avatar } from "../../../../components/ui/Avatar";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { SkeletonList } from "../../../../components/ui/Skeleton";
import { ErrorState } from "../../../../components/ui/EmptyState";
import { useCollectionList } from "../../../../hooks/useCollection";
import { fmtDate, fmtRelative } from "../../../../lib/utils";

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  assignee_id: number | null;
  due_date: string;
  updated_at: string;
};

const priorityVariant: Record<Ticket["priority"], "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

/**
 * Tickets linked to this client. Backend filters with `?client_id=`.
 */
export function TicketsTab({ clientId }: { clientId: number }) {
  const list = useCollectionList<Ticket>(
    "client-tickets",
    `/ticketing/tickets`,
    `client_id=${clientId}`
  );

  if (list.isLoading) {
    return (
      <div className="mt-6">
        <SkeletonList rows={3} />
      </div>
    );
  }

  if (list.isError) {
    return (
      <div className="mt-6">
        <ErrorState onRetry={() => list.refetch()} />
      </div>
    );
  }

  const tickets = list.data ?? [];

  if (tickets.length === 0) {
    return (
      <div className="mt-6 bg-frame border border-border rounded-2xl p-8">
        <EmptyState
          icon={KanbanSquare}
          title="Niciun ticket pentru acest client"
          description="Creează un ticket nou din Ticketing și asociază-l clientului."
          action={
            <Link to="/app/ticketing">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" /> Mergi la Ticketing
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <ul className="rounded-2xl border border-border bg-frame divide-y divide-border overflow-hidden">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-foreground/3 transition-colors"
          >
            <span
              className={
                "w-1.5 h-10 rounded-full " +
                (t.priority === "high"
                  ? "bg-red-500"
                  : t.priority === "medium"
                    ? "bg-amber-500"
                    : "bg-foreground/30")
              }
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground truncate">{t.description}</p>
              )}
            </div>
            {t.assignee_id && <Avatar name={`User #${t.assignee_id}`} size="xs" />}
            <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
            <Badge variant="neutral">{t.status.replace("_", " ")}</Badge>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {fmtDate(t.due_date)}
            </span>
            <span className="hidden md:inline text-[11px] text-muted-foreground shrink-0">
              {fmtRelative(t.updated_at)}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/app/ticketing" className="inline-flex">
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" /> Ticket nou (Ticketing)
        </Button>
      </Link>
    </div>
  );
}
