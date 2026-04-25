import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

interface Props {
  title: string;
  description: string;
  endpoint?: string;
  backTo?: string;
  backLabel?: string;
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
}: Props) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {endpoint && (
        <code className="mt-4 inline-block text-xs px-3 py-1.5 rounded-lg bg-foreground/5 text-muted-foreground">
          {endpoint}
        </code>
      )}
      <Link
        to={backTo}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-foreground hover:underline underline-offset-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
    </div>
  );
}
