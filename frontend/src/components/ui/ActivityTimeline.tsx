import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  at: string;
  icon?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneClass: Record<NonNullable<ActivityItem["tone"]>, string> = {
  neutral: "bg-foreground/8 text-muted-foreground",
  success: "bg-[color:var(--accent)]/18 text-foreground",
  warning: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/12 text-red-600 dark:text-red-400",
  info: "bg-foreground/12 text-foreground",
};

export function ActivityTimeline({
  items,
  empty = "Nicio activitate încă.",
  className,
}: {
  items: ActivityItem[];
  empty?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border p-6 text-center", className)}>
        <Clock3 className="w-5 h-5 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">{empty}</p>
      </div>
    );
  }

  return (
    <ol className={cn("relative space-y-3", className)}>
      {items.map((item, idx) => (
        <li key={item.id} className="relative flex gap-3">
          {idx < items.length - 1 && (
            <span className="absolute left-4 top-9 bottom-[-14px] w-px bg-border" />
          )}
          <span
            className={cn(
              "relative z-10 w-8 h-8 rounded-xl shrink-0 inline-flex items-center justify-center",
              toneClass[item.tone ?? "neutral"]
            )}
          >
            {item.icon ?? <Clock3 className="w-4 h-4" />}
          </span>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <time className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {item.at}
              </time>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
