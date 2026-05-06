import { useCallback, useMemo, useState } from "react";
import {
  Cloud,
  File,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Image,
  LayoutGrid,
  List,
  Search,
  ShieldCheck,
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
import { filterDirectChildren, itemFullPath, normalizeFolderPath } from "../../../lib/documents";
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

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleIdentityWindow = Window & {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: GoogleTokenResponse) => void;
        }) => GoogleTokenClient;
      };
    };
  };
};

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Drive poate fi conectat doar în browser."));
      return;
    }
    const existing = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as GoogleIdentityWindow).google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Nu s-a putut încărca Google Identity Services.")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Nu s-a putut încărca Google Identity Services."));
    document.head.appendChild(script);
  });
}

function driveFileLink(file: DriveFile): string {
  if (file.webViewLink) return file.webViewLink;
  if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME) {
    return `https://drive.google.com/drive/folders/${file.id}`;
  }
  return `https://drive.google.com/file/d/${file.id}/view`;
}

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

function driveFileIcon(file: DriveFile) {
  if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME) {
    return <Folder className="w-5 h-5 text-amber-400" />;
  }
  return fileIcon(file.mimeType);
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
  const [source, setSource] = useState<"local" | "gdrive">("local");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const items = docs.data ?? [];
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const googleDriveReady = Boolean(googleClientId && googleApiKey);

  const filtered = useMemo(() => {
    let result = filterDirectChildren(items, currentFolder, "");
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q) || (d.client_name ?? "").toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, query, currentFolder]);

  const folderParts = normalizeFolderPath(currentFolder).split("/").filter(Boolean);
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
      folder: normalizeFolderPath(currentFolder),
    } as object);
    setNewFolderName("");
  };

  const loadDriveFiles = useCallback(async (token: string) => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const params = new URLSearchParams({
        pageSize: "50",
        orderBy: "modifiedTime desc",
        fields: "files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)",
        q: "trashed = false",
      });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Google Drive a răspuns cu ${response.status}.`);
      }
      const data = (await response.json()) as { files?: DriveFile[] };
      setDriveFiles(data.files ?? []);
      setDriveConnected(true);
    } catch (error) {
      setDriveError(error instanceof Error ? error.message : "Nu s-au putut încărca fișierele Google Drive.");
    } finally {
      setDriveLoading(false);
    }
  }, []);

  const connectGoogleDrive = useCallback(async () => {
    if (!googleDriveReady || !googleClientId) {
      setDriveError("Lipsesc VITE_GOOGLE_CLIENT_ID și VITE_GOOGLE_API_KEY.");
      return;
    }
    setDriveLoading(true);
    setDriveError(null);
    try {
      await loadGoogleIdentityScript();
      const googleApi = (window as GoogleIdentityWindow).google;
      const tokenClientFactory = googleApi?.accounts?.oauth2?.initTokenClient;
      if (!tokenClientFactory) {
        throw new Error("Google Identity Services nu este disponibil în browser.");
      }
      const token = await new Promise<string>((resolve, reject) => {
        const client = tokenClientFactory({
          client_id: googleClientId,
          scope: "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly",
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (!response.access_token) {
              reject(new Error("Google nu a returnat un access token."));
              return;
            }
            resolve(response.access_token);
          },
        });
        client.requestAccessToken({ prompt: driveAccessToken ? "" : "consent" });
      });
      setDriveAccessToken(token);
      await loadDriveFiles(token);
    } catch (error) {
      setDriveError(error instanceof Error ? error.message : "Conectarea Google Drive a eșuat.");
      setDriveLoading(false);
    }
  }, [driveAccessToken, googleClientId, googleDriveReady, loadDriveFiles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documente"
        description="Manager de fișiere — documente, facturi, declarații per client."
        actions={
          source === "local" ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
          ) : undefined
        }
      />

      <div className="inline-flex rounded-xl border border-border bg-frame p-1">
        <button
          type="button"
          onClick={() => setSource("local")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
            source === "local" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <HardDrive className="w-4 h-4" /> Local
        </button>
        <button
          type="button"
          onClick={() => setSource("gdrive")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
            source === "gdrive" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Cloud className="w-4 h-4" /> Google Drive
        </button>
      </div>

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

      {source === "gdrive" && (
        <GoogleDrivePanel
          ready={googleDriveReady}
          connected={driveConnected}
          files={driveFiles}
          loading={driveLoading}
          error={driveError}
          onConnect={connectGoogleDrive}
          onRefresh={() => {
            if (driveAccessToken) {
              void loadDriveFiles(driveAccessToken);
            } else {
              void connectGoogleDrive();
            }
          }}
        />
      )}

      {source === "local" && (
        <>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setCurrentFolder("/")} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Folder className="w-4 h-4" /> Root
          </button>
          {folderParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <button
                onClick={() => setCurrentFolder(normalizeFolderPath("/" + folderParts.slice(0, i + 1).join("/") + "/"))}
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
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("grid")} className={cn("px-2 py-1 rounded text-xs transition-colors", viewMode === "grid" ? "bg-foreground/10" : "")}>
              <LayoutGrid className="w-3.5 h-3.5" />
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
                  onClick={() => doc.type === "folder" && setCurrentFolder(itemFullPath(doc))}
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
              onClick={() => doc.type === "folder" && setCurrentFolder(itemFullPath(doc))}
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
                  folder: normalizeFolderPath(currentFolder),
                } as object);
              });
              setUploadOpen(false);
            }}
          />
        </div>
      </Drawer>
        </>
      )}
    </div>
  );
}

function GoogleDrivePanel({
  ready,
  connected,
  files,
  loading,
  error,
  onConnect,
  onRefresh,
}: {
  ready: boolean;
  connected: boolean;
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-frame overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <Cloud className="w-4 h-4" /> Google Drive
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conectare OAuth client-side. Tokenurile rămân doar în sesiunea curentă.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          session only
        </span>
      </header>
      {!ready ? (
        <div className="p-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold">Configurare lipsă</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adaugă `VITE_GOOGLE_CLIENT_ID` și `VITE_GOOGLE_API_KEY` pentru a activa Picker/OAuth în frontend.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Fără token persistent</p>
            <p className="text-xs text-muted-foreground mt-1">
              Frontend-ul nu salvează refresh token sau conexiuni permanente. Sync-ul real de metadata cere endpoint backend.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-semibold">
                {connected ? "Google Drive conectat pentru sesiunea curentă" : "Google Drive disponibil"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fișierele sunt citite direct din Drive API. Conexiunea permanentă rămâne backend pending.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {connected && (
                <Button variant="outline" onClick={onRefresh} loading={loading}>
                  <Cloud className="w-4 h-4" />
                  Reîncarcă
                </Button>
              )}
              <Button onClick={onConnect} loading={loading}>
                <ShieldCheck className="w-4 h-4" />
                {connected ? "Reconectează" : "Conectează"}
              </Button>
            </div>
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {connected && files.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5">Nume</th>
                    <th className="text-left px-4 py-2.5 hidden md:table-cell">Mărime</th>
                    <th className="text-left px-4 py-2.5 hidden sm:table-cell">Modificat</th>
                    <th className="text-right px-4 py-2.5 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} className="border-b border-border/50 hover:bg-foreground/3">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {driveFileIcon(file)}
                          <span className="font-medium truncate">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                        {fmtSize(file.size ? Number(file.size) : undefined)}
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">
                        {file.modifiedTime ? fmtDate(file.modifiedTime) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={driveFileLink(file)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[color:var(--accent)] hover:underline"
                        >
                          Deschide
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
              <Cloud className="w-9 h-9 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {loading
                  ? "Se încarcă fișierele Google Drive..."
                  : connected
                    ? "Nu există fișiere în răspunsul Drive."
                    : "Conectează Google Drive pentru a vedea fișierele aici."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Persistența conexiunii și sync-ul metadata rămân marcate backend pending.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
