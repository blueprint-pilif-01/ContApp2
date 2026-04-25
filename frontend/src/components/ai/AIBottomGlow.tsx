import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Wraps any AI surface and triggers a one-shot premium edge glow the moment
 * generation finishes (`active` true → false). Duration matches CSS (~1.25s).
 *
 * Use it whenever an AI thing has just been "generated" — chat replies,
 * legislation summaries, planner plans, etc.
 */
export function AIBottomGlow({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [phase, setPhase] = useState<"idle" | "ready">("idle");
  const wasActive = useRef(active);

  useEffect(() => {
    if (wasActive.current === true && active === false) {
      setPhase("ready");
      const t = setTimeout(() => setPhase("idle"), 1350);
      wasActive.current = active;
      return () => clearTimeout(t);
    }
    wasActive.current = active;
    return undefined;
  }, [active]);

  return (
    <div
      className={cn("ai-bottom-glow relative rounded-2xl", className)}
      data-state={phase}
    >
      {children}
    </div>
  );
}
