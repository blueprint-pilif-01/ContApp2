import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, PenTool } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { useSubmission } from "../../../hooks/useSubmissions";
import { isApiError } from "../../../lib/api";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

async function downloadBlob(path: string, filename: string) {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
          <div className="flex gap-2">
            <Link to="/app/contracts/submissions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" /> Înapoi
              </Button>
            </Link>
            {data && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      `/contracts/submissions/${id}/signature`,
                      `semnatura-${id}.png`
                    )
                  }
                >
                  <PenTool className="w-4 h-4" /> Semnătură
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      `/contracts/submissions/${id}/pdf`,
                      `contract-${id}.pdf`
                    )
                  }
                >
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </>
            )}
          </div>
        }
      />

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
            <strong>User:</strong> {data.user_id ? `#${data.user_id}` : "—"}
          </p>
          <p className="text-sm">
            <strong>PDF File:</strong> {data.pdf_file_id ? `#${data.pdf_file_id}` : "—"}
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
