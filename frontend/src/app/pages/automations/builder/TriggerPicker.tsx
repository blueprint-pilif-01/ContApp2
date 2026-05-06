import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Badge } from "../../../../components/ui/Badge";
import { TRIGGERS } from "../../../../lib/automation/catalog";
import { cn } from "../../../../lib/utils";
import type { TriggerKind } from "../../../../lib/automation/types";

export function TriggerPicker({
  value,
  onSelect,
}: {
  value: TriggerKind;
  onSelect: (kind: TriggerKind) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRIGGERS;
    return TRIGGERS.filter((t) =>
      `${t.label} ${t.description} ${t.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof TRIGGERS>();
    for (const t of filtered) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Caută trigger..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leadingIcon={<Search className="h-4 w-4" />}
      />
      <div className="space-y-3">
        {grouped.map(([group, items]) => (
          <div key={group} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1.5">
              {items.map((t) => {
                const Icon = t.icon;
                const active = value === t.kind;
                return (
                  <li key={t.kind}>
                    <button
                      type="button"
                      onClick={() => onSelect(t.kind)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-xl border bg-background px-3 py-2 text-left transition-colors",
                        active
                          ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/30"
                          : "border-border hover:border-foreground/25",
                      )}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/80">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">{t.label}</span>
                          {t.aiPowered && <Badge variant="accent">AI</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
