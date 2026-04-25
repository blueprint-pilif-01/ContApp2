import { useMemo, useState } from "react";
import {
  File,
  FileText,
  Folder,
  FolderPlus,
  Image,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Drawer } from "../../../components/ui/Drawer";
import { useCollectionList, useCollectionCreate } from "../../../hooks/useCollection";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";
import { fmtDate, cn } from "../../../lib/utils";

type DocItem = {
  id: number;
  name: string;
  type: "file" | "folder";
  mime_type?: string;
  size?: number;
  client_id?: number;
  client_name?: string;
  folder: string;
  uploaded_by?: number;
  uploaded_at: string;
};

function fmtSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileIcon(mime?: string) {
  if (!mime) return <File className="w-5 h-5 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <Image className="w-5 h-5 text-blue-400" />;
  if (mime.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

export default function DocumentsPage() {
  const docs = useCollectionList<DocItem>("documents", "/documents");
  const upload = useCollectionCreate<object, DocItem>("documents", "/documents/upload");
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const [query, setQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("/");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const items = docs.data ?? [];

  const filtered = useMemo(() => {
    let result = items.filter((d) => d.folder === currentFolder || d.folder.startsWith(currentFolder));
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q) || (d.client_name ?? "").toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, query, currentFolder]);

  const folderParts = currentFolder.split("/").filter(Boolean);
  const stats = useMemo(() => {
    const files = items.filter((d) => d.type === "file");
    return {
      totalFiles: files.length,
      totalSize: files.reduce((a, d) => a + (d.size ?? 0), 0),
      folders: items.filter((d) => d.type === "folder").length,
      clients: new Set(items.map((d) => d.client_id).filter(Boolean)).size,
    };
  }, [items]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    upload.mutate({
      name: newFolderName.trim(),
      type: "folder",
      folder: currentFolder,
    } as object);
    setNewFolderName("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documente"
        description="Manager de fișiere — documente, facturi, declarații per client."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-frame p-3 text-center">
          <p className="text-2xl font-bold">{stats.totalFiles}</p>
          <p className="text-[11px] text-muted-foreground uppercase">Fișiere</p>
        </div>
        <div className="rounded-xl border border-border bg-frame p-3 text-center">
          <p className="text-2xl font-bold">{fmtSize(stats.totalSize)}</p>
          <p className="text-[11px] text-muted-foreground uppercase">Spațiu</p>
        </div>
        <div className="rounded-xl border border-border bg-frame p-3 text-center">
          <p className="text-2xl font-bold">{stats.folders}</p>
          <p className="text-[11px] text-muted-foreground uppercase">Foldere</p>
        </div>
        <div className="rounded-xl border border-border bg-frame p-3 text-center">
          <p className="text-2xl font-bold">{stats.clients}</p>
          <p className="text-[11px] text-muted-foreground uppercase">Clienți</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setCurrentFolder("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            📁 Root
          </button>
          {folderParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <button
                onClick={() => setCurrentFolder("/" + folderParts.slice(0, i + 1).join("/") + "/")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {part}
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Caută fișiere..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={<Search className="w-4 h-4" />}
          />
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setViewMode("list")} className={cn("px-2 py-1 rounded text-xs transition-colors", viewMode === "list" ? "bg-foreground/10" : "")}>
              ☰
            </button>
            <button onClick={() => setViewMode("grid")} className={cn("px-2 py-1 rounded text-xs transition-colors", viewMode === "grid" ? "bg-foreground/10" : "")}>
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* New folder inline */}
      <div className="flex items-center gap-2">
        <FolderPlus className="w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Folder nou..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 w-48"
        />
        <Button size="xs" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
          Crează
        </Button>
      </div>

      {/* File list */}
      {viewMode === "list" ? (
        <div className="rounded-2xl border border-border bg-frame overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2.5">Nume</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">Client</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Mărime</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Data</th>
                <th className="text-right px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/50 hover:bg-foreground/3 transition-colors cursor-pointer"
                  onClick={() => doc.type === "folder" && setCurrentFolder(doc.folder + doc.name + "/")}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {doc.type === "folder" ? <Folder className="w-5 h-5 text-amber-400" /> : fileIcon(doc.mime_type)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">
                    {doc.client_name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                    {doc.type === "file" ? fmtSize(doc.size) : `—`}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                    {fmtDate(doc.uploaded_at)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {doc.type === "file" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); remove.mutate(doc.id); }}
                        className="text-red-500/60 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Niciun fișier în acest folder.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((doc) => (
            <article
              key={doc.id}
              onClick={() => doc.type === "folder" && setCurrentFolder(doc.folder + doc.name + "/")}
              className="rounded-xl border border-border bg-frame p-4 text-center hover:border-foreground/20 transition-colors cursor-pointer space-y-2"
            >
              {doc.type === "folder" ? (
                <Folder className="w-10 h-10 mx-auto text-amber-400" />
              ) : (
                <div className="w-10 h-10 mx-auto flex items-center justify-center">
                  {fileIcon(doc.mime_type)}
                </div>
              )}
              <p className="text-xs font-medium truncate">{doc.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {doc.type === "file" ? fmtSize(doc.size) : "Folder"}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Upload Drawer */}
      <Drawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Documente"
        description="Trage fișiere sau selectează din calculator."
      >
        <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-foreground/30 transition-colors">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Trage fișiere aici</p>
          <p className="text-xs text-muted-foreground mt-1">sau click pentru a selecta</p>
          <input
            type="file"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              files.forEach((f) => {
                upload.mutate({
                  name: f.name,
                  type: "file",
                  mime_type: f.type,
                  size: f.size,
                  folder: currentFolder,
                } as object);
              });
              setUploadOpen(false);
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}
