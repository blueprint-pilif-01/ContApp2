import { Link } from "react-router-dom";
import { StickyNote, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { BackendNote } from "../../../../components/ui/BackendNote";

/**
 * Notes tab shell. Filtering notes by client requires a list endpoint
 * (`GET /notes?clientId=…`) that the backend doesn't expose. Notes remain
 * available from the main Notes page where users can create & look them up
 * by ID.
 */
export function NotesTab({ clientId }: { clientId: number }) {
  return (
    <div className="mt-6 space-y-4">
      <BackendNote>
        Listarea notițelor per client #{clientId} necesită un endpoint pe
        care backend-ul nu îl expune încă. Creează și caută notițe în
        secțiunea principală.
      </BackendNote>
      <div className="bg-frame border border-border rounded-2xl p-8">
        <EmptyState
          icon={StickyNote}
          title="Notițe indisponibile per client"
          description="Listarea filtrată va fi activată când backend-ul adaugă GET /notes?clientId=…"
          action={
            <Link to="/app/notes">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Mergi la notițe
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
