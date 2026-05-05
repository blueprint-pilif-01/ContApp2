import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookText,
  Bold,
  Check,
  ChevronDown,
  Clock,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  List,
  Lock,
  Paperclip,
  Plus,
  Search,
  Share2,
  Trash2,
  Type,
  Underline,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import {
  useCollectionCreate,
  useCollectionList,
  useCollectionUpdate,
} from "../../../hooks/useCollection";
import { api } from "../../../lib/api";
import { fmtRelative, cn } from "../../../lib/utils";
import { queryClient } from "../../../lib/queryClient";

type NotebookDoc = {
  id: number;
  title: string;
  content: string;
  visibility: "private" | "shared";
  owner_id: number;
  date_modified: string;
};

type FilterView = "all" | "private" | "shared";

type EditorAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
};
type EditorFormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: boolean;
  h1: boolean;
  h2: boolean;
};

function stripHtml(content: string): string {
  return content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NotebookPage() {
  const list = useCollectionList<NotebookDoc>("notebook", "/notebook/documents");
  const create = useCollectionCreate<object, NotebookDoc>("notebook", "/notebook/documents");
  const update = useCollectionUpdate<object, NotebookDoc>(
    "notebook",
    (id) => `/notebook/documents/${id}`
  );
  const remove = useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/notebook/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebook"] }),
  });

  const [filter, setFilter] = useState<FilterView>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NotebookDoc["visibility"]>("private");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("3");
  const [editorDragOver, setEditorDragOver] = useState(false);
  const [attachments, setAttachments] = useState<EditorAttachment[]>([]);
  const [formatState, setFormatState] = useState<EditorFormatState>({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    h1: false,
    h2: false,
  });
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);

  const docs = list.data ?? [];

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (filter !== "all" && d.visibility !== filter) return false;
        if (!q) return true;
        return `${d.title} ${d.content}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date_modified.localeCompare(a.date_modified));
  }, [docs, query, filter]);

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    if (docs.length === 0) {
      setSelectedId(null);
      setTitle("");
      setContent("");
      return;
    }
    const stillVisible = filteredDocs.some((d) => d.id === selectedId);
    if (selectedId && stillVisible) return;
    const next = filteredDocs[0] ?? docs[0];
    if (next) {
      setSelectedId(next.id);
      setTitle(next.title);
      setContent(next.content);
      setVisibility(next.visibility);
      setAttachments([]);
    }
  }, [docs, filteredDocs, selectedId]);

  // Debounced autosave
  useEffect(() => {
    if (!selected) return;
    if (
      title === selected.title &&
      content === selected.content &&
      visibility === selected.visibility
    ) {
      return;
    }
    setSaveState("saving");
    const timeout = setTimeout(() => {
      update.mutate(
        {
          id: selected.id,
          payload: {
            title,
            content,
            visibility,
            date_modified: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            setSaveState("saved");
            setTimeout(() => setSaveState("idle"), 1200);
          },
          onError: () => setSaveState("idle"),
        }
      );
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, visibility, selected?.id]);

  const counts = {
    total: docs.length,
    shared: docs.filter((d) => d.visibility === "shared").length,
    private: docs.filter((d) => d.visibility === "private").length,
  };
  const plainContent = stripHtml(content);
  const wordCount = plainContent.trim() ? plainContent.trim().split(/\s+/).length : 0;
  const charCount = plainContent.length;

  const focusEditor = () => editorRef.current?.focus();
  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    if (!editor.contains(selection.anchorNode)) return;
    selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRangeRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRangeRef.current);
  };
  const syncToolbarState = () => {
    const font = String(document.queryCommandValue("fontName") ?? "").replaceAll('"', "");
    const size = String(document.queryCommandValue("fontSize") ?? "");
    const block = String(document.queryCommandValue("formatBlock") ?? "").toLowerCase();

    if (font) setFontFamily(font);
    if (size) setFontSize(size);
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      list: document.queryCommandState("insertUnorderedList"),
      h1: block.includes("h1"),
      h2: block.includes("h2"),
    });
  };
  const runCommand = (command: string, value?: string) => {
    focusEditor();
    restoreSelection();
    document.execCommand(command, false, value);
    setContent(editorRef.current?.innerHTML ?? "");
    saveSelection();
    syncToolbarState();
  };
  const preserveSelectionOnMouseDown = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    restoreSelection();
  };
  const toolbarBtnClass = (active: boolean) =>
    cn(
      "h-9 w-9 p-0 rounded-lg border transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-foreground/5"
    );

  useEffect(() => {
    const onSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      if (!editor.contains(selection.anchorNode)) return;
      saveSelection();
      syncToolbarState();
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const t = window.setTimeout(() => syncToolbarState(), 0);
    return () => window.clearTimeout(t);
  }, [selected?.id, content]); // keep toolbar state aligned with cursor context

  const pushFiles = (files: File[]) => {
    if (files.length === 0) return;
    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    ]);
    focusEditor();
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (!reader.result || typeof reader.result !== "string") return;
          runCommand("insertImage", reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        runCommand("insertText", ` [Attachment: ${file.name}] `);
      }
    }
  };

  const createNew = (defaultVisibility: NotebookDoc["visibility"]) => {
    create.mutate(
      {
        title: "Document fără titlu",
        content: "",
        visibility: defaultVisibility,
      },
      {
        onSuccess: (data) => {
          if (data) {
            setSelectedId(data.id);
            setTitle(data.title);
            setContent(data.content);
            setVisibility(data.visibility);
            setTimeout(() => titleRef.current?.focus(), 80);
          }
        },
      }
    );
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[300px_1fr] rounded-2xl border border-border bg-frame overflow-hidden"
      style={{ height: "calc(100dvh - 8rem)", minHeight: 520 }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="border-r border-border bg-frame flex flex-col min-h-0">
        {/* Header */}
        <div className="px-3 py-3 border-b border-border space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-foreground/8 flex items-center justify-center">
                <BookText className="w-3.5 h-3.5" />
              </span>
              <p className="text-sm font-semibold tracking-tight">Notebook</p>
            </div>
            <Button
              size="xs"
              onClick={() => createNew(filter === "shared" ? "shared" : "private")}
              loading={create.isPending}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută în documente..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: `Toate ${counts.total}` },
              { id: "private", label: `Private ${counts.private}` },
              { id: "shared", label: `Shared ${counts.shared}` },
            ]}
            className="w-full"
          />
        </div>

        {/* List (only this scrolls) */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredDocs.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {docs.length === 0
                ? "Niciun document încă. Apasă „+\u201D pentru a crea unul."
                : "Niciun document în această secțiune."}
            </div>
          ) : (
            <ul className="p-1">
              {filteredDocs.map((doc) => {
                const isSelected = selectedId === doc.id;
                const isShared = doc.visibility === "shared";
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(doc.id);
                        setTitle(doc.title);
                        setContent(doc.content);
                        setVisibility(doc.visibility);
                      }}
                      className={cn(
                        "group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-start gap-2 relative",
                        isSelected
                          ? "bg-foreground/8 text-foreground"
                          : "text-foreground/80 hover:bg-foreground/5"
                      )}
                    >
                      {isShared && (
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r bg-[color:var(--accent)]" />
                      )}
                      <div className="flex-1 min-w-0 pl-1">
                        <p className="font-medium truncate">{doc.title || "Fără titlu"}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {stripHtml(doc.content) || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {fmtRelative(doc.date_modified)}
                          </span>
                          {isShared && (
                            <span className="inline-flex items-center gap-0.5 text-foreground/80">
                              <Share2 className="w-2.5 h-2.5" /> shared
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between shrink-0 bg-frame">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
            {counts.shared} shared
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
            {counts.private} private
          </span>
        </div>
      </aside>

      {/* ── Editor ─────────────────────────────────────── */}
      <section className="bg-background flex flex-col min-h-0 relative">
        {selected ? (
          <>
            <header className="px-6 py-3 border-b border-border bg-frame shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  {visibility === "shared" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--accent)]/20 text-foreground border border-[color:var(--accent)]/40 shrink-0">
                      <Share2 className="w-3 h-3" /> Shared
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/8 text-foreground border border-border shrink-0">
                      <Lock className="w-3 h-3" /> Privat
                    </span>
                  )}
                  <Avatar name={`User ${selected.owner_id}`} size="xs" />
                  <span className="truncate">· {fmtRelative(selected.date_modified)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SegmentedControl
                    value={visibility}
                    onChange={setVisibility}
                    options={[
                      { id: "private", label: "Privat" },
                      { id: "shared", label: "Shared" },
                    ]}
                  />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      if (!selected) return;
                      if (!confirm("Șterge documentul?")) return;
                      remove.mutate(selected.id);
                    }}
                    className="text-red-500 hover:bg-red-500/10"
                    title="Șterge document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Type className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      runCommand("fontName", e.target.value);
                    }}
                    className="h-8 appearance-none rounded-lg border border-border bg-background pl-7 pr-7 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times</option>
                    <option value="Courier New">Courier</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value);
                      runCommand("fontSize", e.target.value);
                    }}
                    className="h-8 appearance-none rounded-lg border border-border bg-background pl-2 pr-7 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">XL</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.bold)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("bold")} title="Bold">
                  <Bold className="w-4.5 h-4.5" />
                </Button>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.italic)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("italic")} title="Italic">
                  <Italic className="w-4.5 h-4.5" />
                </Button>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.underline)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("underline")} title="Underline">
                  <Underline className="w-4.5 h-4.5" />
                </Button>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.h1)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("formatBlock", "H1")} title="Heading 1">
                  <Heading1 className="w-4.5 h-4.5" />
                </Button>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.h2)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("formatBlock", "H2")} title="Heading 2">
                  <Heading2 className="w-4.5 h-4.5" />
                </Button>
                <Button size="xs" variant="ghost" className={toolbarBtnClass(formatState.list)} onMouseDown={preserveSelectionOnMouseDown} onClick={() => runCommand("insertUnorderedList")} title="Listă">
                  <List className="w-4.5 h-4.5" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    pushFiles(Array.from(e.target.files ?? []));
                    e.currentTarget.value = "";
                  }}
                />
                <Button size="xs" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </Button>
                <Button size="xs" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-3.5 h-3.5" /> Add image
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titlu document..."
                  className="w-full bg-transparent border-0 outline-none text-3xl md:text-4xl font-semibold tracking-tight text-foreground placeholder:text-foreground/25"
                />
                <div className="space-y-3">
                  <div
                    className={cn(
                      "rounded-xl border border-border bg-transparent p-4 min-h-[400px] text-[15px] leading-7 text-foreground/90",
                      editorDragOver && "border-[color:var(--accent)] bg-[color:var(--accent)]/8"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setEditorDragOver(true);
                    }}
                    onDragLeave={() => setEditorDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setEditorDragOver(false);
                      pushFiles(Array.from(e.dataTransfer.files ?? []));
                    }}
                  >
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
                      onMouseUp={saveSelection}
                      onKeyUp={saveSelection}
                      dangerouslySetInnerHTML={{ __html: content || "" }}
                      data-placeholder="Scrie aici notițele tale..."
                      className="min-h-[360px] outline-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-foreground/30"
                    />
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file) => (
                        <span
                          key={file.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-frame px-2 py-1 text-xs text-muted-foreground"
                        >
                          <Paperclip className="w-3 h-3" />
                          {file.name}
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((current) => current.filter((item) => item.id !== file.id))
                            }
                            className="rounded-full p-0.5 hover:bg-foreground/10"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="border-t border-border bg-frame px-6 py-2 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
              <div className="inline-flex items-center gap-2">
                {saveState === "saving" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Se salvează…
                  </>
                )}
                {saveState === "saved" && (
                  <>
                    <Check className="w-3 h-3 text-[color:var(--accent)]" />
                    <span className="text-foreground">Salvat</span>
                  </>
                )}
                {saveState === "idle" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                    Sincronizat
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-3">
                <span>{wordCount} cuvinte</span>
                <span>·</span>
                <span>{charCount} caractere</span>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10">
            <EmptyArt
              icon={BookText}
              title="Notebook gol"
              description="Începe cu un document nou. Poți să-l păstrezi privat sau să-l împărtășești cu echipa."
              action={
                <Button onClick={() => createNew("private")} loading={create.isPending}>
                  <Plus className="w-4 h-4" /> Document nou
                </Button>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
