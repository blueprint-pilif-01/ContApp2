import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  FilePlus2,
  FileText,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { EmptyArt } from "../../../components/ui/EmptyArt";
import { useCollectionCreate, useCollectionList } from "../../../hooks/useCollection";
import { fmtRelative } from "../../../lib/utils";

type Template = {
  id: number;
  name: string;
  contract_type: string;
  user_id: number;
  organisation_id: number;
  date_added: string;
};

const typeColors: Record<string, string> = {
  contabilitate: "from-[color:var(--accent)]/30 to-transparent",
  consultanta: "from-foreground/12 to-transparent",
  servicii: "from-[color:var(--accent)]/15 to-transparent",
  default: "from-foreground/8 to-transparent",
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("contabilitate");

  const list = useCollectionList<Template>("templates-list", "/contracts/templates");
  const create = useCollectionCreate<object, Template>(
    "templates-list",
    "/contracts/templates"
  );

  const templates = list.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      `${t.name} ${t.contract_type}`.toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Șabloane contract"
        description="Editor cu câmpuri dinamice, semnături și export PDF."
        actions={
          <>
            <Button variant="outline" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" /> Șablon rapid
            </Button>
            <Button onClick={() => navigate("/app/contracts/templates/new")}>
              <FilePlus2 className="w-4 h-4" /> Editor nou
            </Button>
          </>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută șablon..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} șabloane disponibile
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-frame">
          <EmptyArt
            icon={FileText}
            title="Niciun șablon încă"
            description="Începe cu un șablon nou și completează editorul cu câmpuri dinamice."
            action={
              <Button onClick={() => navigate("/app/contracts/templates/new")}>
                <FilePlus2 className="w-4 h-4" /> Creează șablon
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tpl) => {
            const grad = typeColors[tpl.contract_type] ?? typeColors.default!;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => navigate(`/app/contracts/templates/${tpl.id}/edit`)}
                className="group text-left relative overflow-hidden rounded-2xl border border-border bg-frame hover:border-foreground/20 transition-colors"
              >
                <div
                  className={`h-24 bg-gradient-to-br ${grad} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 flex items-center justify-end p-4 text-foreground/20">
                    <FileText className="w-12 h-12" strokeWidth={1.2} />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {tpl.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">{tpl.contract_type}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {fmtRelative(tpl.date_added)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Șablon nou"
        description="Va apărea în grid și se poate edita în Contract Editor."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Anulează
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => {
                if (!name.trim()) return;
                create.mutate({
                  name,
                  contract_type: type,
                  user_id: 1,
                  organisation_id: 1,
                });
                setName("");
                setCreating(false);
              }}
            >
              <Sparkles className="w-4 h-4" /> Creează
            </Button>
          </div>
        }
      >
        <Input label="Nume șablon" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Tip contract" value={type} onChange={(e) => setType(e.target.value)} />
      </Drawer>
    </div>
  );
}
