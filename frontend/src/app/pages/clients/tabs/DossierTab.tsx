import { Folder, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { BackendNote } from "../../../../components/ui/BackendNote";

/**
 * Dossier tab shell. The data layer requires list + upload/download
 * endpoints that the backend doesn't expose yet:
 *
 *   GET    /clients/:id/documents
 *   POST   /clients/:id/documents        (multipart upload)
 *   GET    /clients/:id/documents/:docId/download
 *   DELETE /clients/:id/documents/:docId
 *
 * The backend currently only has id-based CRUD on `client_documents`
 * which stores metadata + a foreign-key `file_id`. Until the upload/list
 * flow is implemented we surface the tab with a clear notice.
 */
export function DossierTab({ clientId }: { clientId: number }) {
  return (
    <div className="mt-6 space-y-4">
      <BackendNote>
        Dosarul clientului #{clientId} necesită endpoint-uri de listare +
        upload pe care backend-ul nu le expune încă.
      </BackendNote>
      <div className="bg-frame border border-border rounded-2xl p-8">
        <EmptyState
          icon={Folder}
          title="Dosar indisponibil"
          description="Listarea documentelor se va activa odată cu GET /clients/:id/documents. Deocamdată folosește CRUD-ul generic /client-documents din panoul principal."
          action={
            <Button variant="outline" size="sm" disabled>
              <Upload className="w-4 h-4" />
              Încarcă document
            </Button>
          }
        />
      </div>
    </div>
  );
}
