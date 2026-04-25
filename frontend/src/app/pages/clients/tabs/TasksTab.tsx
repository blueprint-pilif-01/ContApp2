import { Link } from "react-router-dom";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { BackendNote } from "../../../../components/ui/BackendNote";

/**
 * Tasks tab shell. Filtering tasks by client requires a list endpoint
 * (`GET /tasks?clientId=…`) that the backend doesn't expose. Tasks remain
 * fully usable from the main Tasks page.
 */
export function TasksTab({ clientId }: { clientId: number }) {
  return (
    <div className="mt-6 space-y-4">
      <BackendNote>
        Listarea sarcinilor per client #{clientId} necesită un endpoint pe
        care backend-ul nu îl expune încă.
      </BackendNote>
      <div className="bg-frame border border-border rounded-2xl p-8">
        <EmptyState
          icon={CheckSquare}
          title="Sarcini indisponibile per client"
          description="Listarea filtrată va fi activată când backend-ul adaugă GET /tasks?clientId=…"
          action={
            <Link to="/app/tasks">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Mergi la sarcini
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
