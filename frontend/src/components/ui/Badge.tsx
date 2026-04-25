import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "accent";

const variantClass: Record<BadgeVariant, string> = {
  success:
    "bg-[color:var(--accent)]/15 text-foreground border-[color:var(--accent)]/35",
  warning:
    "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
  danger:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
  info:
    "bg-foreground/6 text-foreground border-border",
  neutral:
    "bg-foreground/5 text-muted-foreground border-border",
  accent:
    "bg-[color:var(--accent)]/20 text-foreground border-[color:var(--accent)]/40",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Convenience: invite/submission status → badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    draft:    { label: "Draft",         variant: "neutral" },
    pending:  { label: "În așteptare",  variant: "warning" },
    sent:     { label: "Trimis",        variant: "info" },
    viewed:   { label: "Vizualizat",    variant: "info" },
    signed:   { label: "Semnat",        variant: "success" },
    expired:  { label: "Expirat",       variant: "danger" },
    revoked:  { label: "Revocat",       variant: "neutral" },
    active:   { label: "Activ",         variant: "success" },
    inactive: { label: "Inactiv",       variant: "neutral" },
    done:     { label: "Finalizat",     variant: "success" },
    open:     { label: "Deschis",       variant: "warning" },
    blocked:  { label: "Blocat",        variant: "danger" },
  };
  const cfg = map[status] ?? { label: status, variant: "neutral" as BadgeVariant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/** Plan badge */
export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, BadgeVariant> = {
    Free:       "neutral",
    Starter:    "info",
    Pro:        "accent",
    Business:   "warning",
    Enterprise: "success",
  };
  return <Badge variant={map[plan] ?? "neutral"}>{plan}</Badge>;
}
