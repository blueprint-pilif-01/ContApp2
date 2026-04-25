import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { BackendNote } from "../../../components/ui/BackendNote";
import { useSubmission } from "../../../hooks/useSubmissions";
import { isApiError } from "../../../lib/api";

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number.parseInt(params.id ?? "", 10);
  const { data, isLoading, error } = useSubmission(
    Number.isFinite(id) ? id : undefined
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Semnare #${id}`}
        actions={
          <Link to="/app/contracts/submissions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </Button>
          </Link>
        }
      />

      <BackendNote>
        Backend-ul nu expune încă descărcarea PDF-ului (
        <code>GET /contracts/submissions/:id/pdf</code>). Funcția va fi
        activată după ce endpoint-ul este implementat.
      </BackendNote>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Se încarcă…</p>
      )}
      {error ? (
        <p className="text-sm text-red-500">
          {isApiError(error) ? error.message : "Eroare la încărcare."}
        </p>
      ) : null}

      {data && (
        <div className="rounded-2xl border border-border bg-frame p-5 space-y-2">
          <p className="text-sm">
            <strong>Status:</strong> {data.status}
          </p>
          <p className="text-sm">
            <strong>Invitație:</strong> #{data.invite_id}
          </p>
          <p className="text-sm">
            <strong>Client:</strong> #{data.client_id}
          </p>
          <p className="text-sm">
            <strong>User:</strong> #{data.user_id}
          </p>
          <p className="text-sm">
            <strong>PDF File:</strong> #{data.pdf_file_id}
          </p>
          <p className="text-sm">
            <strong>Expiră:</strong>{" "}
            {new Date(data.expiration_date).toLocaleDateString("ro-RO")}
          </p>
          {data.remarks && (
            <p className="text-sm">
              <strong>Observații:</strong> {data.remarks}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
