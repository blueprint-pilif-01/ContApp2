import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  end: boolean;
}

interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

const navGroups: AdminNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Conturi & acces",
    items: [
      { label: "Organizații", href: "/admin/organisations", icon: Building2, end: false },
      { label: "Useri", href: "/admin/users", icon: Users, end: false },
      { label: "Extensii", href: "/admin/extensions", icon: ShieldCheck, end: false },
    ],
  },
  {
    label: "Monetizare",
    items: [
      { label: "Planuri", href: "/admin/plans", icon: Tags, end: false },
      { label: "Billing", href: "/admin/billing", icon: CreditCard, end: false },
    ],
  },
  {
    label: "Operațional",
    items: [
      { label: "Joburi", href: "/admin/jobs", icon: ListChecks, end: false },
      { label: "Fișiere", href: "/admin/files", icon: FolderOpen, end: false },
      { label: "Contracte", href: "/admin/contracts", icon: FileText, end: false },
      { label: "Notificări", href: "/admin/notifications", icon: Bell, end: false },
      { label: "Audit Log", href: "/admin/audit", icon: Activity, end: false },
    ],
  },
];


export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-frame border-r border-border flex flex-col z-40 shrink-0">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border shrink-0">
        <span className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            ContApp Admin
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Platform console
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all",
                        isActive
                          ? "bg-foreground text-background font-semibold shadow-sm"
                          : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.85} />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
