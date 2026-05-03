import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, File, FileText, Image, Trash2, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState, ErrorState } from "../../../../components/ui/EmptyState";
import { SkeletonList } from "../../../../components/ui/Skeleton";
import { useToast } from "../../../../components/ui/Toast";
import { useCollectionCreate, useCollectionList } from "../../../../hooks/useCollection";
import { api } from "../../../../lib/api";
import { queryClient } from "../../../../lib/queryClient";
import { fmtDate } from "../../../../lib/utils";

type ClientDocument = {
  id: number;
  name: string;
  mime_type?: string;
  size?: number;
  uploaded_at?: string;
  date_added?: string;
};

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

function fmtSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function iconFor(mime?: string) {
  if (mime?.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  if (mime?.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export function DossierTab({ clientId }: { clientId: number }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const key = `client-documents-${clientId}`;
  const docs = useCollectionList<ClientDocument>(
    key,
    `/clients/${clientId}/documents`
  );
  const upload = useCollectionCreate<object, ClientDocument>(
    key,
    `/clients/${clientId}/documents`
  );
  const remove = useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/clients/${clientId}/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });

  const rows = docs.data ?? [];

  if (docs.isLoading) {
    return (
      <div className="mt-6">
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (docs.isError) {
    return (
      <div className="mt-6">
        <ErrorState onRetry={() => docs.refetch()} />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-frame overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Dosar client</h3>
          <p className="text-xs text-muted-foreground">{rows.length} documente</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4" />
          Încarcă
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            for (const file of files) {
              upload.mutate({
                name: file.name,
                mime_type: file.type,
                size: file.size,
                uploaded_at: new Date().toISOString(),
              });
            }
            if (files.length > 0) toast.success("Documente încărcate.");
            event.currentTarget.value = "";
          }}
        />
      </header>

      {rows.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={FileText}
            title="Dosar gol"
            description="Încarcă documente legate de acest client."
            action={
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Încarcă document
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((doc) => (
            <li key={doc.id} className="px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center">
                {iconFor(doc.mime_type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtSize(doc.size)} · {fmtDate(doc.uploaded_at ?? doc.date_added ?? "")}
                </p>
              </div>
              <a
                href={`${BASE_URL}/clients/${clientId}/documents/${doc.id}/download`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="ghost" size="xs" title="Descarcă">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 hover:bg-red-500/10"
                loading={remove.isPending}
                onClick={() => remove.mutate(doc.id)}
                title="Șterge"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
