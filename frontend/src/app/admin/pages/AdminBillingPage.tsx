import { CreditCard, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Badge } from "../../../components/ui/Badge";
import { SkeletonRows, Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useCollectionItem, useCollectionList } from "../../../hooks/useCollection";
import { fmtRelative } from "../../../lib/utils";

interface BillingOverview {
  mrr_eur: number;
  active_subscriptions: number;
  trialing: number;
  past_due: number;
  organisations: Array<{
    id: number;
    name: string;
    plan: string;
    status: string;
    renewal_at: string;
  }>;
}

interface BillingEvent {
  id: string;
  type: string;
  organisation_id: number;
  amount_eur: number;
  created_at: string;
}

export default function AdminBillingPage() {
  const overview = useCollectionItem<BillingOverview>(
    "admin-billing",
    "/admin/billing"
  );
  const events = useCollectionList<BillingEvent>(
    "admin-billing-events",
    "/admin/billing/events"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="MRR, abonamente active și ultimele evenimente Stripe."
      />

      {overview.isError ? (
        <ErrorState onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Wallet}
            label="MRR"
            value={overview.data ? `${overview.data.mrr_eur} €` : "—"}
            accent="brand"
          />
          <StatCard
            icon={CreditCard}
            label="Abonamente active"
            value={overview.data?.active_subscriptions ?? "—"}
            accent="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Trial"
            value={overview.data?.trialing ?? "—"}
            accent="neutral"
          />
          <StatCard
            icon={CreditCard}
            label="Past due"
            value={overview.data?.past_due ?? "—"}
            accent={overview.data?.past_due ? "danger" : "neutral"}
          />
        </div>
      )}

      <SectionCard icon={CreditCard} title="Subscriptions per organizație">
        {overview.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-2 py-2">Organizație</th>
                <th className="text-left px-2 py-2">Plan</th>
                <th className="text-left px-2 py-2">Status</th>
                <th className="text-left px-2 py-2">Reînnoire</th>
              </tr>
            </thead>
            <tbody>
              {(overview.data?.organisations ?? []).map((org) => (
                <tr key={org.id} className="border-t border-border">
                  <td className="px-2 py-2.5">{org.name}</td>
                  <td className="px-2 py-2.5">
                    <Badge variant="neutral">{org.plan}</Badge>
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge
                      variant={org.status === "active" ? "success" : "warning"}
                    >
                      {org.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {fmtRelative(org.renewal_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard icon={TrendingUp} title="Evenimente Stripe">
        {events.isError ? (
          <ErrorState onRetry={() => events.refetch()} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-2 py-2">Event</th>
                <th className="text-left px-2 py-2">Organizație</th>
                <th className="text-left px-2 py-2">Sumă</th>
                <th className="text-left px-2 py-2">Când</th>
              </tr>
            </thead>
            <tbody>
              {events.isLoading ? (
                <SkeletonRows rows={3} cols={4} />
              ) : (
                (events.data ?? []).map((evt) => (
                  <tr key={evt.id} className="border-t border-border">
                    <td className="px-2 py-2.5 font-mono text-xs">{evt.type}</td>
                    <td className="px-2 py-2.5">org #{evt.organisation_id}</td>
                    <td className="px-2 py-2.5">
                      {evt.amount_eur ? `${evt.amount_eur} €` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {fmtRelative(evt.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
