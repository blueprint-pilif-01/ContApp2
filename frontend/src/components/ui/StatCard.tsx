import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

export type StatTrend = "up" | "down" | "flat";
export type StatAccent = "brand" | "success" | "warning" | "danger" | "neutral";

const accentMap: Record<StatAccent, { bg: string; icon: string }> = {
  brand: {
    bg: "from-[color:var(--accent)]/15 to-transparent",
    icon: "text-foreground",
  },
  success: {
    bg: "from-[color:var(--accent)]/12 to-transparent",
    icon: "text-foreground",
  },
  warning: {
    bg: "from-amber-500/12 to-transparent",
    icon: "text-amber-500",
  },
  danger: {
    bg: "from-red-500/10 to-transparent",
    icon: "text-red-500",
  },
  neutral: {
    bg: "from-foreground/8 to-transparent",
    icon: "text-foreground/70",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  hint,
  accent = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: StatTrend;
  trendValue?: string;
  hint?: string;
  accent?: StatAccent;
}) {
  const tone = accentMap[accent];
  const trendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendCls =
    trend === "up"
      ? "text-foreground bg-[color:var(--accent)]/20"
      : trend === "down"
        ? "text-red-500 bg-red-500/10"
        : "text-muted-foreground bg-foreground/5";
  const TrendIcon = trendIcon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-frame">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          tone.bg
        )}
      />
      <div className="relative p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center bg-foreground/5",
              tone.icon
            )}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                trendCls
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {trendValue ?? ""}
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
