import { AlertTriangle, FolderOpen, HardDrive } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { SectionCard } from "../../../components/ui/SectionCard";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useCollectionItem } from "../../../hooks/useCollection";

interface FilesOverview {
  total_storage_mb: number;
  orphans: number;
  per_organisation: Array<{
    organisation_id: number;
    name: string;
    used_mb: number;
    files: number;
  }>;
}

export default function AdminFilesPage() {
  const overview = useCollectionItem<FilesOverview>("admin-files", "/admin/files");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fișiere"
        description="Storage usage per organizație și fișiere orfane."
      />

      {overview.isError ? (
        <ErrorState onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={HardDrive}
            label="Storage total"
            value={overview.data ? `${overview.data.total_storage_mb} MB` : "—"}
            accent="brand"
          />
          <StatCard
            icon={AlertTriangle}
            label="Fișiere orfane"
            value={overview.data?.orphans ?? "—"}
            accent={overview.data?.orphans ? "warning" : "neutral"}
          />
        </div>
      )}

      <SectionCard icon={FolderOpen} title="Per organizație">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-2 py-2">Organizație</th>
              <th className="text-left px-2 py-2">Fișiere</th>
              <th className="text-left px-2 py-2">Storage</th>
            </tr>
          </thead>
          <tbody>
            {overview.isLoading ? (
              <SkeletonRows rows={4} cols={3} />
            ) : (
              (overview.data?.per_organisation ?? []).map((row) => (
                <tr key={row.organisation_id} className="border-t border-border">
                  <td className="px-2 py-2.5">{row.name}</td>
                  <td className="px-2 py-2.5">{row.files}</td>
                  <td className="px-2 py-2.5">{row.used_mb} MB</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
