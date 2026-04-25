import { Link } from "react-router-dom";
import { FileText, Send, FileCheck } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { BackendNote } from "../../../../components/ui/BackendNote";

/**
 * Contracts tab shell. Showing a client's invites and submissions needs
 * filtered list endpoints (`GET /contract-invites?client_id=…`,
 * `GET /contract-submissions?client_id=…`) that the backend doesn't expose
 * yet. Contracts remain fully usable from the main Contracts section.
 */
export function ContractsTab({ clientId }: { clientId: number }) {
  return (
    <div className="mt-6 space-y-4">
      <BackendNote>
        Istoricul contractelor pentru clientul #{clientId} necesită
        endpoint-uri filtrate pe <code>/contract-invites</code> și{" "}
        <code>/contract-submissions</code>. Deocamdată folosește CRUD-ul
        generic al acestora.
      </BackendNote>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-frame border border-border rounded-2xl p-6">
          <EmptyState
            icon={Send}
            title="Fără invitații"
            description="GET /contract-invites?client_id=… nu este expus."
            action={
              <Link to="/app/contracts/invites">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4" />
                  Invitații
                </Button>
              </Link>
            }
          />
        </div>
        <div className="bg-frame border border-border rounded-2xl p-6">
          <EmptyState
            icon={FileCheck}
            title="Fără semnări"
            description="GET /contract-submissions?client_id=… nu este expus."
            action={
              <Link to="/app/contracts/submissions">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4" />
                  Semnări
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
