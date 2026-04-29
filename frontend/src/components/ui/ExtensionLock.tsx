import { Lock } from "lucide-react";
import { EXTENSIONS, type ExtensionKey } from "../../lib/extensions";
import { cn } from "../../lib/utils";

interface Props {
  extension: ExtensionKey;
  className?: string;
}

/**
 * Inline lock indicator used in sidebars / nav lists for extensions that
 * are not active on the current organisation.
 */
export function ExtensionLock({ extension, className }: Props) {
  const meta = EXTENSIONS[extension];
  return (
    <span
      title={`Necesită ${meta.label}`}
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-md bg-foreground/8 text-muted-foreground",
        className
      )}
    >
      <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
    </span>
  );
}
