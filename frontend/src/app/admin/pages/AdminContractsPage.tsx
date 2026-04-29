import { FileCheck, FileText, Send } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useCollectionItem } from "../../../hooks/useCollection";
import { fmtRelative } from "../../../lib/utils";

interface ContractsOverview {
  templates_total: number;
  invites_active: number;
  invites_signed: number;
  submissions_total: number;
  latest_submissions: Array<{
    id: number;
    invite_id: number;
    client_id: number;
    status: string;
    date_added?: string;
    signed_at?: string;
  }>;
}

export default function AdminContractsPage() {
  const overview = useCollectionItem<ContractsOverview>(
    "admin-contracts",
    "/admin/contracts"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracte"
        description="Overview cross-organisation: șabloane, solicitări și semnări."
      />

      {overview.isError ? (
        <ErrorState onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={FileText}
            label="Șabloane"
            value={overview.data?.templates_total ?? "—"}
            accent="brand"
          />
          <StatCard
            icon={Send}
            label="Solicitări active"
            value={overview.data?.invites_active ?? "—"}
            accent="warning"
          />
          <StatCard
            icon={FileCheck}
            label="Solicitări semnate"
            value={overview.data?.invites_signed ?? "—"}
            accent="success"
          />
          <StatCard
            icon={FileCheck}
            label="Submisii totale"
            value={overview.data?.submissions_total ?? "—"}
            accent="success"
          />
        </div>
      )}

      <SectionCard icon={FileCheck} title="Ultimele submisii">
        {overview.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (overview.data?.latest_submissions ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nicio submisie înregistrată.
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {(overview.data?.latest_submissions ?? []).map((s) => (
              <li
                key={s.id}
                className="px-2 py-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">Submisie #{s.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Client #{s.client_id} · invitație #{s.invite_id}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {fmtRelative(s.signed_at ?? s.date_added ?? "")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
