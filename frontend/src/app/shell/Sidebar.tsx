import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  FileCheck,
  Settings,
  LogOut,
  Scale,
  CalendarDays,
  MessageSquare,
  KanbanSquare,
  BookText,
  BriefcaseBusiness,
  Sparkles,
  Search,
  BarChart3,
  FolderOpen,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { logout, useMe } from "../../hooks/useMe";
import { useExtensions } from "../../hooks/useExtensions";
import { queryClient } from "../../lib/queryClient";
import { Avatar } from "../../components/ui/Avatar";
import { ExtensionLock } from "../../components/ui/ExtensionLock";
import type { ExtensionKey } from "../../lib/extensions";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  badge?: string;
  /** When set, the item is gated by an extension and shows a lock when off. */
  extension?: ExtensionKey;
}

const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/app/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Planner Smart",
        href: "/app/planner-smart",
        icon: Sparkles,
        end: false,
        badge: "AI",
        extension: "ai_assistant",
      },
      {
        label: "Calendar",
        href: "/app/calendar",
        icon: CalendarDays,
        end: false,
      },
    ],
  },
  {
    label: "Operațional",
    items: [
      { label: "Clienți", href: "/app/clients", icon: Users, end: false, extension: "contracts_pro" },
      { label: "Ticketing", href: "/app/ticketing", icon: KanbanSquare, end: false, extension: "ticketing_pro" },
      { label: "Chat intern", href: "/app/chat", icon: MessageSquare, end: false, extension: "internal_chat" },
    ],
  },
  {
    label: "Contracte",
    items: [
      {
        label: "Șabloane",
        href: "/app/contracts/templates",
        icon: FileText,
        end: false,
        extension: "contracts_pro",
      },
      {
        label: "Solicitări",
        href: "/app/contracts/invites",
        icon: Send,
        end: false,
        extension: "contracts_pro",
      },
      {
        label: "Submisii",
        href: "/app/contracts/submissions",
        icon: FileCheck,
        end: false,
        extension: "contracts_pro",
      },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Notebook", href: "/app/notebook", icon: BookText, end: false },
      { label: "Documente", href: "/app/documents", icon: FolderOpen, end: false },
    ],
  },
  {
    label: "People",
    items: [
      { label: "HR", href: "/app/hr", icon: BriefcaseBusiness, end: false, extension: "hr_pro" },
      { label: "Legislație", href: "/app/legislation", icon: Scale, end: false, extension: "legislation_monitor" },
      { label: "Rapoarte", href: "/app/reports", icon: BarChart3, end: false },
    ],
  },
  {
    items: [
      { label: "Setări", href: "/app/settings", icon: Settings, end: false },
      {
        label: "Users + Roles",
        href: "/app/settings/users-roles",
        icon: Users,
        end: false,
      },
      {
        label: "Automatizări",
        href: "/app/settings/automations",
        icon: Zap,
        end: false,
      },
      {
        label: "Activity Log",
        href: "/app/settings/activity-log",
        icon: Activity,
        end: false,
      },
    ],
  },
];

export function Sidebar() {
  const { data: me } = useMe();
  const ext = useExtensions();
  const navigate = useNavigate();
  const location = useLocation();
  const currentSearch = location.search;

  const isItemActive = (item: NavItem, defaultActive: boolean): boolean => {
    if (!defaultActive) return false;
    const [path, query = ""] = item.href.split("?");
    if (location.pathname !== path) return false;
    const itemView = new URLSearchParams(query).get("view");
    const currentView = new URLSearchParams(currentSearch).get("view");
    if (itemView) return currentView === itemView;
    return !currentView || itemView === currentView;
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      navigate("/login");
    }
  };

  const fullName = me
    ? `${me.first_name} ${me.last_name}`.trim() || me.email
    : "—";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-frame border-r border-border flex flex-col z-40 shrink-0">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border shrink-0">
        <img src="/contapplogo.png" alt="ContApp" className="h-8 w-auto" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          ContApp
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          document.dispatchEvent(new CustomEvent("contapp:open-palette"));
        }}
        className="m-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-foreground/5 transition-colors text-left"
      >
        <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.7} />
        <span className="text-xs text-muted-foreground flex-1">
          Caută... (Cmd+K)
        </span>
        <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-foreground/8 text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <nav className="flex-1 overflow-y-auto pb-4 px-3 space-y-5 mt-1">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const locked =
                  !!item.extension && ext.isReady && !ext.canUse(item.extension);
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      end={item.end}
                      title={locked ? `Necesită ${item.extension}` : undefined}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all",
                          isItemActive(item, isActive)
                            ? "bg-foreground text-background font-semibold shadow-sm"
                            : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
                          locked && "opacity-60"
                        )
                      }
                    >
                      <item.icon
                        className="w-4 h-4 shrink-0"
                        strokeWidth={1.85}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && !locked && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[color:var(--ai-grad-1)] to-[color:var(--ai-grad-3)] text-white">
                          {item.badge}
                        </span>
                      )}
                      {locked && item.extension && (
                        <ExtensionLock extension={item.extension} />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-foreground/5 transition-colors">
          <Avatar name={fullName} size="sm" status="online" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {fullName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {me?.email ?? "—"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Deconectare"
            title="Deconectare"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
