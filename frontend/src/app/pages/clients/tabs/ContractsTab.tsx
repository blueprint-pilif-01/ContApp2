import { Link } from "react-router-dom";
import { Calendar, ExternalLink, FileCheck, FileText, Send } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { EmptyState, ErrorState } from "../../../../components/ui/EmptyState";
import { SkeletonList } from "../../../../components/ui/Skeleton";
import { useCollectionList } from "../../../../hooks/useCollection";
import { fmtDate, fmtRelative } from "../../../../lib/utils";

type InviteStatus = "draft" | "sent" | "viewed" | "signed" | "expired" | "revoked";

type Invite = {
  id: number;
  template_id: number;
  client_id: number;
  remarks?: string;
  expiration_date: string;
  status: InviteStatus;
  public_token?: string;
  date_added: string;
};

type Submission = {
  id: number;
  invite_id: number;
  client_id: number;
  status: string;
  remarks?: string;
  signed_at?: string | null;
  date_added: string;
};

const statusVariant: Record<InviteStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  draft: "neutral",
  sent: "info",
  viewed: "warning",
  signed: "success",
  expired: "danger",
  revoked: "danger",
};

export function ContractsTab({ clientId }: { clientId: number }) {
  const invites = useCollectionList<Invite>("client-invites", "/contracts/invites");
  const submissions = useCollectionList<Submission>(
    "client-submissions",
    "/contracts/submissions"
  );

  if (invites.isLoading || submissions.isLoading) {
    return (
      <div className="mt-6">
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (invites.isError || submissions.isError) {
    return (
      <div className="mt-6">
        <ErrorState
          onRetry={() => {
            invites.refetch();
            submissions.refetch();
          }}
        />
      </div>
    );
  }

  const clientInvites = (invites.data ?? []).filter((item) => item.client_id === clientId);
  const clientSubmissions = (submissions.data ?? []).filter(
    (item) => item.client_id === clientId
  );

  if (clientInvites.length === 0 && clientSubmissions.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-frame p-8">
        <EmptyState
          icon={FileText}
          title="Niciun contract pentru acest client"
          description="Creează o solicitare de semnare sau verifică pipeline-ul de contracte."
          action={
            <Link to="/app/contracts/invites">
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4" />
                Solicitare nouă
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section className="rounded-2xl border border-border bg-frame overflow-hidden">
        <header className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Solicitări</h3>
            <p className="text-xs text-muted-foreground">{clientInvites.length} în pipeline</p>
          </div>
          <Link to="/app/contracts/invites">
            <Button variant="ghost" size="xs">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </header>
        <ul className="divide-y divide-border">
          {clientInvites.map((invite) => (
            <li key={invite.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    Solicitare #{invite.id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Template #{invite.template_id}
                    {invite.remarks ? ` · ${invite.remarks}` : ""}
                  </p>
                </div>
                <Badge variant={statusVariant[invite.status]}>{invite.status}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {fmtDate(invite.expiration_date)}
                </span>
                <span>{fmtRelative(invite.date_added)}</span>
              </div>
            </li>
          ))}
          {clientInvites.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Fără solicitări.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-frame overflow-hidden">
        <header className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Semnări</h3>
            <p className="text-xs text-muted-foreground">{clientSubmissions.length} finalizate</p>
          </div>
          <Link to="/app/contracts/submissions">
            <Button variant="ghost" size="xs">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </header>
        <ul className="divide-y divide-border">
          {clientSubmissions.map((submission) => (
            <li key={submission.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    Contract semnat #{submission.id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Invitație #{submission.invite_id}
                    {submission.remarks ? ` · ${submission.remarks}` : ""}
                  </p>
                </div>
                <Badge variant={submission.status === "signed" ? "success" : "neutral"}>
                  {submission.status}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                {fmtDate(submission.signed_at ?? submission.date_added)}
              </p>
            </li>
          ))}
          {clientSubmissions.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Fără semnări.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
