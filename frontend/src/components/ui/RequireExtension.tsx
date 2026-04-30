import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useExtensions } from "../../hooks/useExtensions";
import { EXTENSIONS, type ExtensionKey } from "../../lib/extensions";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";

interface Props {
  extension: ExtensionKey;
  /** Optional override for the upsell heading (rare). */
  title?: string;
  /** Optional fallback content (defaults to FeatureMissing-like upsell card). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Page-level gate that hides children unless the named extension is active
 * for the current organisation. While the extension state is loading we
 * render a skeleton.
 */
export function RequireExtension({ extension, title, fallback, children }: Props) {
  const { isReady, canUse } = useExtensions();
  const meta = EXTENSIONS[extension];

  if (!isReady) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (canUse(extension)) return <>{children}</>;

  if (fallback !== undefined) return <>{fallback}</>;

  const Icon = meta.icon;
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 rounded-2xl bg-foreground/5" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-7 h-7 text-foreground/70" strokeWidth={1.6} />
        </div>
        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </span>
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        {title ?? `${meta.label} nu este activ`}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
        {meta.description}
      </p>
      {meta.tierHint && (
        <p className="mt-2 text-xs text-muted-foreground">{meta.tierHint}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link to="/app/settings?tab=subscription">
          <Button size="sm">
            Activează din Setări
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <Link to="/app/dashboard">
          <Button size="sm" variant="ghost">
            Înapoi la Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
