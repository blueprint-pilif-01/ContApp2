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
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { logout, useMe } from "../../hooks/useMe";
import { useExtensions } from "../../hooks/useExtensions";
import { queryClient } from "../../lib/queryClient";
import { Avatar } from "../../components/ui/Avatar";
import { ExtensionLock } from "../../components/ui/ExtensionLock";
import type { ExtensionKey } from "../../lib/extensions";
import { canManageWorkspaceSettings } from "../../lib/access";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  badge?: string;
  /** When set, the item is gated by an extension and shows a lock when off. */
  extension?: ExtensionKey;
  adminOnly?: boolean;
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
      { label: "Angajați", href: "/app/employees", icon: BriefcaseBusiness, end: false },
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
    label: "Automatizări",
    items: [
      {
        label: "Studio automatizări",
        href: "/app/automations",
        icon: Zap,
        end: false,
        adminOnly: true,
      },
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
        adminOnly: true,
      },
      {
        label: "Activity Log",
        href: "/app/settings/activity-log",
        icon: Activity,
        end: false,
        adminOnly: true,
      },
    ],
  },
];

export interface SidebarProps {
  /** When false below `lg`, sidebar slides off-screen. Desktop always visible. */
  mobileOpen?: boolean;
  /** Called after choosing a destination on narrow viewports & from header close affordance */
  onMobileClose?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { data: me } = useMe();
  const ext = useExtensions();
  const navigate = useNavigate();
  const location = useLocation();
  const currentSearch = location.search;
  const canManageSettings = canManageWorkspaceSettings(me);

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
      await logout("user");
    } finally {
      queryClient.clear();
      navigate("/login");
      onMobileClose?.();
    }
  };

  const fullName = me
    ? `${me.first_name} ${me.last_name}`.trim() || me.email
    : "—";

  return (
    <aside
      id="contapp-sidebar"
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex w-[min(20rem,calc(100vw-3rem))] max-w-[20rem] shrink-0 flex-col border-r border-border bg-frame shadow-black/40 shadow-xl lg:z-40 lg:w-64 lg:max-w-none lg:shadow-none",
        "transition-[transform] duration-300 motion-reduce:transition-none",
        "ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 pr-3">
        <img src="/egeslogolighty-nav.png" alt="" className="h-10 w-auto dark:hidden" />
        <img src="/egeslogodark-nav.png" alt="" className="hidden h-10 w-auto dark:block" />
        <button
          type="button"
          className={cn(
            "ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground lg:hidden",
            "hover:bg-foreground/5 hover:text-foreground active:scale-95 motion-reduce:active:scale-100",
          )}
          aria-label="Închide meniul"
          onClick={() => onMobileClose?.()}
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.85} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          document.dispatchEvent(new CustomEvent("contapp:open-palette"));
        }}
        className="m-3 mb-2 flex flex-none items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-foreground/5"
      >
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
        <span className="flex-1 text-xs text-muted-foreground">
          Caută... <span className="max-[360px]:hidden">(Cmd+K)</span>
        </span>
        <kbd className="rounded-md bg-foreground/8 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground max-[380px]:hidden">
          ⌘K
        </kbd>
      </button>

      <nav className="relative mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-1">
        <div className="relative z-[1] w-full">
          {/* Spine must live inside scroll content so height = full list, not just viewport */}
          <div
            className="pointer-events-none absolute bottom-2 left-0 top-2 z-0 flex w-[22px] justify-center"
            aria-hidden
          >
            <div className="h-full w-[2px] -translate-x-px rounded-full bg-border dark:bg-white/22" />
          </div>

          {navGroups.map((group, gi) => {
            const items = group.items.filter((item) => !item.adminOnly || canManageSettings);
            if (items.length === 0) return null;
            return (
            <div key={gi} className={gi > 0 ? "mt-2 pt-2.5" : ""}>
              {group.label && (
                <p className="mb-1.5 pl-9 pr-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/95">
                  {group.label}
                </p>
              )}
              <ul className="mr-1 space-y-0.5">
                {items.map((item) => {
                  const locked = !!item.extension && ext.isReady && !ext.canUse(item.extension);
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        end={item.end}
                        title={locked ? `Necesită ${item.extension}` : undefined}
                        prefetch="intent"
                        onClick={() => onMobileClose?.()}
                        className={({ isActive }) => {
                          const on = isItemActive(item, isActive);
                          return cn(
                            "group/nav-row flex w-full cursor-pointer items-stretch gap-0 rounded-xl py-2 pr-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/35",
                            on
                              ? "bg-foreground font-semibold text-background shadow-md dark:shadow-lg"
                              : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                            locked && "opacity-60",
                          );
                        }}
                      >
                        {({ isActive }) => {
                          const on = isItemActive(item, isActive);
                          return (
                            <>
                              <div className="relative flex w-[22px] shrink-0 flex-col items-center justify-center">
                                {on ? (
                                  <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                  >
                                    <span
                                      className={cn(
                                        "absolute h-9 w-9 rounded-full blur-[10px] motion-reduce:blur-none motion-reduce:opacity-75",
                                        "contapp-sidebar-node-glow bg-[color-mix(in_srgb,var(--accent)_50%,transparent)] opacity-[0.72] shadow-[0_0_22px_-4px_var(--accent)] dark:opacity-85",
                                      )}
                                    />
                                  </span>
                                ) : null}
                                {on ? (
                                  <motion.span
                                    layoutId="contapp-sidebar-active-node"
                                    className="relative z-[5] flex h-[11px] w-[11px] items-center justify-center rounded-full border-[1.5px] border-white/90 bg-gradient-to-br from-white via-[color:var(--accent)] to-[color-mix(in_srgb,var(--accent)_75%,#14532d)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.55),0_0_14px_-3px_color-mix(in_srgb,var(--accent)_55%,transparent)] dark:border-[color-mix(in_srgb,var(--accent)_90%,white)] dark:from-white/95 dark:via-accent dark:to-emerald-950/80"
                                    initial={false}
                                    animate={{
                                      scale: [0.92, 1.12, 1],
                                      x: [0, 3, -1],
                                      y: [0, -2, 0],
                                    }}
                                    transition={{
                                      layout: { type: "spring", stiffness: 460, damping: 32, mass: 0.8 },
                                      scale: {
                                        duration: 0.44,
                                        times: [0, 0.38, 1],
                                        ease: [0.34, 1.56, 0.64, 1],
                                      },
                                      x: {
                                        duration: 0.44,
                                        times: [0, 0.38, 1],
                                        ease: [0.34, 1.56, 0.64, 1],
                                      },
                                      y: {
                                        duration: 0.44,
                                        times: [0, 0.38, 1],
                                        ease: [0.34, 1.56, 0.64, 1],
                                      },
                                    }}
                                  >
                                    <span className="pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-br from-white/70 to-transparent opacity-90 mix-blend-overlay dark:from-white/80" />
                                  </motion.span>
                                ) : (
                                  <span
                                    aria-hidden
                                    className="relative z-[4] flex h-[7px] w-[7px] items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-muted/90 to-muted/45 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out group-hover/nav-row:scale-110 dark:border-white/40 dark:from-white/16 dark:to-white/[0.06]"
                                  >
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/35 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] dark:bg-white/45" />
                                  </span>
                                )}
                              </div>
                              <motion.div
                                className="flex min-w-0 flex-1 items-center gap-2.5 pl-1.5"
                                initial={false}
                                animate={on ? { x: [0, 4, 0] } : { x: 0 }}
                                transition={
                                  on
                                    ? { duration: 0.5, times: [0, 0.28, 1], ease: [0.22, 1, 0.36, 1] }
                                    : { duration: 0.2, ease: "easeOut" }
                                }
                                whileTap={{
                                  scale: 0.985,
                                  transition: { type: "spring", stiffness: 540, damping: 35 },
                                }}
                              >
                                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.85} />
                                <span className="min-w-0 flex-1">{item.label}</span>
                                {item.badge && !locked && (
                                  <span className="rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--accent-contrast)]">
                                    {item.badge}
                                  </span>
                                )}
                                {locked && item.extension && <ExtensionLock extension={item.extension} />}
                              </motion.div>
                            </>
                          );
                        }}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-foreground/5">
          <Avatar name={fullName} size="sm" status="online" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{fullName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{me?.email ?? "—"}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Deconectare"
            title="Deconectare"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
