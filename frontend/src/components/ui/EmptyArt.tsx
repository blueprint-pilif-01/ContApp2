import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyArt({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6">
      <div className="relative inline-flex items-center justify-center mb-4">
        <span className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-br from-[color:var(--ai-grad-1)]/15 via-[color:var(--ai-grad-2)]/8 to-[color:var(--ai-grad-3)]/15 blur-xl" />
        <span className="relative w-14 h-14 rounded-2xl bg-frame border border-border flex items-center justify-center text-foreground/70">
          <Icon className="w-6 h-6" strokeWidth={1.6} />
        </span>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-5 inline-flex">{action}</div>}
    </div>
  );
}
