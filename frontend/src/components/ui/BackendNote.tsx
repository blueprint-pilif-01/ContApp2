import type { ReactNode } from "react";
import { Info } from "lucide-react";

/**
 * Inline notice for UI surfaces whose backing endpoints are limited or
 * missing. Use to set expectations — the real Go backend exposes id-based
 * CRUD only, so there are no list endpoints yet.
 */
export function BackendNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3.5 text-sm text-amber-900 dark:text-amber-200">
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
