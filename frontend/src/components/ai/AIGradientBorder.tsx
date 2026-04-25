import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function AIGradientBorder({
  active = true,
  className,
  children,
}: {
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-[1px]",
        active ? "ai-gradient-border ai-gradient-border--active" : "ai-gradient-border",
        className
      )}
    >
      <div className="rounded-[calc(theme(borderRadius.2xl)-1px)] bg-frame">{children}</div>
    </div>
  );
}
