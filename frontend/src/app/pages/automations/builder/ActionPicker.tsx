import { useMemo, useState } from "react";
import { Search, Sparkles, Filter, Clock } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Badge } from "../../../../components/ui/Badge";
import { ACTIONS, AI_ACTIONS } from "../../../../lib/automation/catalog";
import { cn } from "../../../../lib/utils";
import type { ActionKind, AIActionKind } from "../../../../lib/automation/types";

export type ActionPickerChoice =
  | { kind: "action"; type: ActionKind }
  | { kind: "ai"; action: AIActionKind }
  | { kind: "condition" }
  | { kind: "delay" };

export function ActionPicker({
  onSelect,
}: {
  onSelect: (choice: ActionPickerChoice) => void;
}) {
  const [query, setQuery] = useState("");

  const standardFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter((t) =>
      `${t.label} ${t.description} ${t.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  const aiFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AI_ACTIONS;
    return AI_ACTIONS.filter((t) =>
      `${t.label} ${t.description} ${t.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Caută acțiune..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leadingIcon={<Search className="h-4 w-4" />}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ControlChoice
          icon={Filter}
          title="Condiție (if / else)"
          description="Bifurcă fluxul după o expresie."
          onClick={() => onSelect({ kind: "condition" })}
        />
        <ControlChoice
          icon={Clock}
          title="Așteptare"
          description="Întârziere între pași (minute, ore, zile)."
          onClick={() => onSelect({ kind: "delay" })}
        />
      </div>

      {aiFiltered.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--accent)]">
            Acțiuni AI
          </p>
          <ul className="space-y-1.5">
            {aiFiltered.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.kind}>
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "ai", action: a.kind })}
                    className="flex w-full items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/25"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/15 text-foreground">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{a.label}</span>
                        <Badge variant="accent" className="gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> AI
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{a.description}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {standardFiltered.length > 0 &&
        groupActions(standardFiltered).map(([group, items]) => (
          <div key={group} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1.5">
              {items.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.kind}>
                    <button
                      type="button"
                      onClick={() => onSelect({ kind: "action", type: a.kind })}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/25"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/80">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{a.label}</p>
                        <p className="text-[11px] text-muted-foreground">{a.description}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );
}

function ControlChoice({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Filter;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-dashed border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/40",
      )}
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/80">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function groupActions<T extends { group: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const a of items) {
    if (!map.has(a.group)) map.set(a.group, []);
    map.get(a.group)!.push(a);
  }
  return Array.from(map.entries());
}
