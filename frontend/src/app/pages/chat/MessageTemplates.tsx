import { useState } from "react";
import { FileText, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Drawer } from "../../../components/ui/Drawer";
import { Badge } from "../../../components/ui/Badge";
import {
  useCollectionCreate,
  useCollectionList,
} from "../../../hooks/useCollection";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";

type MessageTemplate = {
  id: number;
  title: string;
  content: string;
  category: string;
  usage_count: number;
  created_at: string;
};

const categories = [
  { key: "documente", label: "Documente", color: "bg-blue-500" },
  { key: "facturi", label: "Facturi", color: "bg-amber-500" },
  { key: "declaratii", label: "Declarații", color: "bg-purple-500" },
  { key: "general", label: "General", color: "bg-foreground/40" },
];

interface MessageTemplatesProps {
  open: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

export function MessageTemplates({ open, onClose, onInsert }: MessageTemplatesProps) {
  const templates = useCollectionList<MessageTemplate>(
    "message-templates",
    "/message-templates"
  );
  const create = useCollectionCreate<object, MessageTemplate>(
    "message-templates",
    "/message-templates"
  );
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/message-templates/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["message-templates"] }),
  });

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [filter, setFilter] = useState("all");

  const items = templates.data ?? [];
  const filtered =
    filter === "all" ? items : items.filter((t) => t.category === filter);

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    create.mutate({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    setCreating(false);
    setNewTitle("");
    setNewContent("");
    setNewCategory("general");
  };

  const handleInsert = (tpl: MessageTemplate) => {
    onInsert(tpl.content);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Șabloane mesaje"
      description={`${items.length} șabloane salvate. Click pentru a insera.`}
      footer={
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Șablon nou
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Închide
          </Button>
        </div>
      }
    >
      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            filter === "all"
              ? "border-foreground/40 bg-foreground/8"
              : "border-border hover:bg-foreground/3"
          }`}
        >
          Toate ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
              filter === cat.key
                ? "border-foreground/40 bg-foreground/8"
                : "border-border hover:bg-foreground/3"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="space-y-2 mt-2">
        {filtered.map((tpl) => (
          <article
            key={tpl.id}
            className="rounded-xl border border-border bg-background p-3 space-y-2 hover:border-foreground/20 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{tpl.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {tpl.content}
                </p>
              </div>
              <Badge variant="neutral">{tpl.category}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Folosit {tpl.usage_count}×
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleInsert(tpl)}
                  className="text-xs text-foreground bg-foreground/8 hover:bg-foreground/15 rounded-lg px-2 py-1 inline-flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Inserează
                </button>
                <button
                  onClick={() => remove.mutate(tpl.id)}
                  className="text-xs text-red-500 hover:bg-red-500/10 rounded-lg px-2 py-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Niciun șablon{filter !== "all" ? " în această categorie" : ""}.
          </div>
        )}
      </div>

      {/* Create dialog */}
      {creating && (
        <div className="mt-4 rounded-xl border border-border bg-frame p-4 space-y-3">
          <p className="text-sm font-semibold">Șablon nou</p>
          <Input
            label="Titlu"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Cerere documente lunar"
          />
          <Textarea
            label="Conținut mesaj"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Bună ziua, vă rog să ne transmiteți..."
            rows={4}
          />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Categorie
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setNewCategory(cat.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                    newCategory === cat.key
                      ? "border-foreground/40 bg-foreground/8"
                      : "border-border hover:bg-foreground/3"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || !newContent.trim()}
            >
              <Plus className="w-4 h-4" /> Salvează
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
