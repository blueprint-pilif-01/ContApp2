import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function SectionCard({
  icon: Icon,
  title,
  description,
  actions,
  children,
  padding = "md",
  className,
}: {
  icon?: LucideIcon;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}) {
  const padCls =
    padding === "none"
      ? "p-0"
      : padding === "sm"
        ? "p-3"
        : padding === "lg"
          ? "p-6"
          : "p-5";

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-frame overflow-hidden",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-start gap-2.5">
            {Icon && (
              <span className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/70 mt-0.5">
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </span>
            )}
            <div>
              {title && (
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(padCls, title || actions ? "pt-0" : "")}>{children}</div>
    </section>
  );
}
