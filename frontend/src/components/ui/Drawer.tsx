import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  width = "md",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
  footer?: ReactNode;
}) {
  const widthCls =
    width === "sm" ? "max-w-sm" : width === "lg" ? "max-w-2xl" : "max-w-md";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute top-0 right-0 h-full w-full bg-frame border-l border-border shadow-2xl flex flex-col",
          widthCls
        )}
      >
        <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-xl text-muted-foreground hover:bg-foreground/5"
            aria-label="Închide"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        {footer && (
          <footer className="border-t border-border p-4 bg-frame">{footer}</footer>
        )}
      </aside>
    </div>
  );
}
