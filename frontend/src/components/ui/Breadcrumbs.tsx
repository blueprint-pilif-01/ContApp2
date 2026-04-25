import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useBreadcrumbLabel } from "./BreadcrumbContext";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Base path for the app area: "/admin" or "/app" */
  basePath: string;
  /** Label for the root (e.g. "Overview" for admin, "Dashboard" for app) */
  rootLabel: string;
  /** Map path segment to label. Last segment can be overridden via context. */
  segments: Record<string, string>;
  /** Optional override for the last (detail) segment; overrides context */
  lastLabel?: string;
  className?: string;
}

export function Breadcrumbs({
  basePath,
  rootLabel,
  segments,
  lastLabel: lastLabelProp,
  className,
}: BreadcrumbsProps) {
  const lastLabelFromContext = useBreadcrumbLabel();
  const lastLabel = lastLabelProp ?? lastLabelFromContext;
  const location = useLocation();
  const pathname = location.pathname;

  if (!pathname.startsWith(basePath)) return null;

  const rest = pathname.slice(basePath.length).replace(/^\/+/, "");
  const parts = rest ? rest.split("/") : [];

  const rootHref = basePath === "/admin" ? "/admin" : "/app/dashboard";

  const items: BreadcrumbSegment[] = [];
  // Always show root crumb so it stays visible in the topbar.
  if (pathname === rootHref) {
    items.push({ label: rootLabel });
  } else {
    items.push({ label: rootLabel, href: rootHref });
  }

  let acc = basePath;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;
    if (basePath === "/app" && i === 0 && part === "dashboard") continue;
    acc += (acc.endsWith("/") ? "" : "/") + part;

    const isLast = i === parts.length - 1;
    const label =
      isLast && lastLabel ? lastLabel : segments[part] ?? part;

    items.push(isLast ? { label } : { label, href: acc });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-sm", className)}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Admin breadcrumb segment labels */
export const ADMIN_SEGMENTS: Record<string, string> = {
  tenants: "Tenanți",
  users: "Utilizatori",
  contracts: "Contracte",
  stripe: "Stripe",
  files: "Fișiere",
  notifications: "Notificări",
  jobs: "Jobs",
  audit: "Audit Log",
};

/** App (client) breadcrumb segment labels */
export const APP_SEGMENTS: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clienți",
  ticketing: "Ticketing",
  chat: "Chat",
  calendar: "Calendar",
  hr: "HR",
  notebook: "Notebook",
  "planner-smart": "Planner Smart",
  contracts: "Contracte",
  templates: "Șabloane",
  invites: "Solicitări",
  submissions: "Submisii",
  new: "Nou",
  edit: "Editare",
  settings: "Setări",
  users: "Utilizatori",
  "users-roles": "Users & Roles",
  legislation: "Legislație",
};
