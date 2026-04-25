import { useEffect, useRef, useState, type ReactNode } from "react";
import { Copy, RefreshCcw, X } from "lucide-react";
import { AIGradientBorder } from "./AIGradientBorder";
import { AIBottomGlow } from "./AIBottomGlow";
import { Button } from "../ui/Button";

export function AIResultCard({
  children,
  onCopy,
  onRegenerate,
  onDismiss,
  loading,
}: {
  children: ReactNode;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onDismiss?: () => void;
  /** Pass true while AI is still streaming, false when done. The card
   * will flash a subtle bottom glow at the moment it transitions to false. */
  loading?: boolean;
}) {
  // If the consumer doesn't pass loading, infer "just mounted" once.
  const [internalActive, setInternalActive] = useState(loading ?? true);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Allow a short delay then mark complete so a freshly-rendered card
      // also benefits from the bottom-glow welcome.
      const t = setTimeout(() => setInternalActive(false), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);
  useEffect(() => {
    if (typeof loading === "boolean") setInternalActive(loading);
  }, [loading]);

  return (
    <AIBottomGlow active={internalActive}>
      <AIGradientBorder active={internalActive}>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[color:var(--ai-grad-1)]/8 via-transparent to-[color:var(--ai-grad-3)]/8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/7 text-foreground">
              AI
            </span>
          </div>
          {children}
          <div className="mt-3 flex items-center gap-2">
            <Button size="xs" variant="ghost" onClick={onRegenerate}>
              <RefreshCcw className="w-3.5 h-3.5" /> Regenerate
            </Button>
            <Button size="xs" variant="ghost" onClick={onCopy}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </Button>
            <Button size="xs" variant="ghost" onClick={onDismiss}>
              <X className="w-3.5 h-3.5" /> Dismiss
            </Button>
          </div>
        </div>
      </AIGradientBorder>
    </AIBottomGlow>
  );
}
