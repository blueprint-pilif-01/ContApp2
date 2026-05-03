import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState, ErrorState } from "../../../../components/ui/EmptyState";
import { Input, Textarea } from "../../../../components/ui/Input";
import { SkeletonList } from "../../../../components/ui/Skeleton";
import { useToast } from "../../../../components/ui/Toast";
import { useCollectionCreate, useCollectionList } from "../../../../hooks/useCollection";
import { useMe } from "../../../../hooks/useMe";
import { fmtRelative } from "../../../../lib/utils";

type ClientNote = {
  id: number;
  client_id?: number;
  owner_id?: number;
  title?: string;
  name?: string;
  content?: string;
  data?: string;
  visibility?: "personal" | "shared";
  date_added?: string;
  date_modified?: string;
};

export function NotesTab({ clientId }: { clientId: number }) {
  const toast = useToast();
  const { data: me } = useMe();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const key = `client-notes-${clientId}`;
  const notes = useCollectionList<ClientNote>(
    key,
    "/workspace/notes",
    `client_id=${clientId}`
  );
  const create = useCollectionCreate<object, ClientNote>(key, "/workspace/notes");

  const rows = notes.data ?? [];

  const addNote = () => {
    if (!title.trim() && !body.trim()) return;
    create.mutate(
      {
        client_id: clientId,
        owner_id: me?.id ?? 0,
        title: title.trim() || "Notiță client",
        name: title.trim() || "Notiță client",
        content: body.trim(),
        data: body.trim(),
        visibility: "shared",
        date_added: new Date().toISOString(),
        date_modified: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Notiță adăugată.");
          setTitle("");
          setBody("");
        },
        onError: () => toast.error("Notița nu a putut fi salvată."),
      }
    );
  };

  if (notes.isLoading) {
    return (
      <div className="mt-6">
        <SkeletonList rows={3} />
      </div>
    );
  }

  if (notes.isError) {
    return (
      <div className="mt-6">
        <ErrorState onRetry={() => notes.refetch()} />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <section className="rounded-2xl border border-border bg-frame overflow-hidden">
        <header className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notițe client</h3>
          <p className="text-xs text-muted-foreground">{rows.length} intrări</p>
        </header>
        {rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={StickyNote}
              title="Nicio notiță pentru acest client"
              description="Adaugă context intern, follow-up-uri sau observații."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((note) => (
              <li key={note.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {note.title ?? note.name ?? `Notiță #${note.id}`}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                      {note.content ?? note.data ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {fmtRelative(note.date_modified ?? note.date_added ?? "")}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-2xl border border-border bg-frame p-4 space-y-3 h-fit">
        <h3 className="text-sm font-semibold">Adaugă notiță</h3>
        <Input
          label="Titlu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Follow-up, observație, risc..."
        />
        <Textarea
          label="Conținut"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button
          className="w-full"
          loading={create.isPending}
          disabled={!title.trim() && !body.trim()}
          onClick={addNote}
        >
          <Plus className="w-4 h-4" />
          Salvează notița
        </Button>
      </aside>
    </div>
  );
}
