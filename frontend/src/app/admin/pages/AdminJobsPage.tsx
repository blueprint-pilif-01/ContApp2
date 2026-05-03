import { AlertTriangle, CheckCircle2, Clock, Play } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { SectionCard } from "../../../components/ui/SectionCard";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import { fmtRelative } from "../../../lib/utils";

interface JobRun {
  id: number;
  job_name: string;
  status: "running" | "succeeded" | "failed";
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  affected: number | null;
  error?: string;
}

const KNOWN_JOBS = [
  "invite_expiration",
  "contract_reminder",
  "pdf_generation",
  "legislation_import",
  "legislation_digest",
  "stripe_sync",
  "cleanup_sessions",
];

const statusVariants: Record<JobRun["status"], "success" | "warning" | "danger"> = {
  succeeded: "success",
  running: "warning",
  failed: "danger",
};

const statusIcon = {
  succeeded: CheckCircle2,
  running: Clock,
  failed: AlertTriangle,
};

export default function AdminJobsPage() {
  const list = useCollectionList<JobRun>("admin-jobs", "/admin/jobs");
  const toast = useToast();
  const qc = useQueryClient();

  const trigger = useMutation({
    mutationFn: (name: string) =>
      api.post<{ message: string }>(`/admin/jobs/${name}/trigger`),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Job-ul nu a putut fi declanșat."),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Joburi"
        description="Status-ul joburilor de background și trigger manual."
      />

      <SectionCard
        icon={Play}
        title="Trigger manual"
        description="Declanșează un job acum prin backend."
      >
        <div className="flex flex-wrap gap-2">
          {KNOWN_JOBS.map((name) => (
            <Button
              key={name}
              size="xs"
              variant="outline"
              onClick={() => trigger.mutate(name)}
              loading={trigger.isPending && trigger.variables === name}
            >
              <Play className="w-3 h-3" /> {name}
            </Button>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-border bg-frame overflow-hidden">
        {list.isError ? (
          <div className="p-6">
            <ErrorState onRetry={() => list.refetch()} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-foreground/3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-3">Job</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Pornit</th>
                <th className="text-left px-5 py-3">Durată</th>
                <th className="text-left px-5 py-3">Afectat</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <SkeletonRows rows={5} cols={5} />
              ) : (
                (list.data ?? []).map((run) => {
                  const Icon = statusIcon[run.status];
                  return (
                    <tr
                      key={run.id}
                      className="border-t border-border hover:bg-foreground/3"
                    >
                      <td className="px-5 py-3 font-mono text-xs">{run.job_name}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariants[run.status]} className="inline-flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {fmtRelative(run.started_at)}
                      </td>
                      <td className="px-5 py-3">
                        {run.duration_ms != null ? `${run.duration_ms}ms` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {run.affected != null ? run.affected : "—"}
                        {run.error && (
                          <span className="ml-2 text-xs text-red-500">
                            · {run.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
