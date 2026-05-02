import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

interface Props {
  title: string;
  description: string;
  endpoint?: string;
  backTo?: string;
  backLabel?: string;
  /** When true, omits fullscreen centering wrapper (e.g. inside AuthShell card). */
  embedded?: boolean;
}

/**
 * Rendered on pages whose backing endpoint doesn't exist in the Go backend
 * yet. Sets expectations clearly for the user.
 */
export function FeatureMissing({
  title,
  description,
  endpoint,
  backTo = "/",
  backLabel = "Înapoi",
  embedded = false,
}: Props) {
  const inner = (
    <>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4 mx-auto">
        <Construction className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="max-w-md mx-auto text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {endpoint && (
        <code className="mt-4 inline-block text-xs px-3 py-1.5 rounded-lg bg-foreground/5 text-muted-foreground">
          {endpoint}
        </code>
      )}
      <Link
        to={backTo}
        className={`${embedded ? "mt-8" : "mt-6"} inline-flex items-center gap-1.5 justify-center text-sm font-medium text-foreground hover:underline underline-offset-2 rounded-lg px-2 py-1 -mx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
      >
        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
        {backLabel}
      </Link>
    </>
  );

  if (embedded) {
    return <div className="text-center">{inner}</div>;
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {inner}
    </div>
  );
}
