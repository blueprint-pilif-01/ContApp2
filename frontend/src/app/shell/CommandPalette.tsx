import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageSquare,
  CalendarDays,
  Sparkles,
  BookText,
  BriefcaseBusiness,
  Scale,
  Settings,
  FileText,
  Send,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface CommandEntry {
  label: string;
  href: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
}

const COMMANDS: CommandEntry[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard, group: "Navigare" },
  { label: "Planner Smart", href: "/app/planner-smart", icon: Sparkles, group: "Navigare", hint: "AI" },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays, group: "Navigare" },
  { label: "Clienți", href: "/app/clients", icon: Users, group: "Operațional" },
  { label: "Ticketing", href: "/app/ticketing", icon: KanbanSquare, group: "Operațional" },
  { label: "Chat intern", href: "/app/chat", icon: MessageSquare, group: "Operațional" },
  { label: "Contracte – Șabloane", href: "/app/contracts/templates", icon: FileText, group: "Contracte" },
  { label: "Contracte – Solicitări", href: "/app/contracts/invites", icon: Send, group: "Contracte" },
  { label: "Contracte – Submisii", href: "/app/contracts/submissions", icon: FileCheck, group: "Contracte" },
  { label: "Notebook", href: "/app/notebook", icon: BookText, group: "Knowledge" },
  { label: "HR", href: "/app/hr", icon: BriefcaseBusiness, group: "People" },
  { label: "Legislație", href: "/app/legislation", icon: Scale, group: "People" },
  { label: "Setări", href: "/app/settings", icon: Settings, group: "Setări" },
  { label: "Users & Roles", href: "/app/settings/users-roles", icon: Users, group: "Setări" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setHover(0);
        setQuery("");
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onCustom = () => {
      setOpen(true);
      setHover(0);
      setQuery("");
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("contapp:open-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contapp:open-palette", onCustom);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? COMMANDS.filter((item) => item.label.toLowerCase().includes(q))
      : COMMANDS;
  }, [query]);

  useEffect(() => {
    if (hover >= filtered.length) setHover(0);
  }, [filtered.length, hover]);

  if (!open) return null;

  const groups = filtered.reduce<Record<string, CommandEntry[]>>((acc, cur) => {
    if (!acc[cur.group]) acc[cur.group] = [];
    acc[cur.group]!.push(cur);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-frame border border-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHover((h) => Math.min(filtered.length - 1, h + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHover((h) => Math.max(0, h - 1));
              }
              if (e.key === "Enter" && filtered[hover]) {
                navigate(filtered[hover]!.href);
                setOpen(false);
              }
            }}
            placeholder="Sari oriunde în aplicație..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
          />
          <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-foreground/8 text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {Object.entries(groups).length === 0 && (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">
              Niciun rezultat pentru "{query}".
            </p>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const idx = filtered.indexOf(item);
                  const active = idx === hover;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onMouseEnter={() => setHover(idx)}
                        onClick={() => {
                          navigate(item.href);
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                          active
                            ? "bg-foreground/8 text-foreground"
                            : "text-foreground/80 hover:bg-foreground/5"
                        )}
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.hint && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[color:var(--ai-grad-1)] to-[color:var(--ai-grad-3)] text-white">
                            {item.hint}
                          </span>
                        )}
                        {active && (
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
