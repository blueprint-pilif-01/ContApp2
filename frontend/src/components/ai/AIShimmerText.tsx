import { cn } from "../../lib/utils";

export function AIShimmerText({
  text,
  active,
  className,
}: {
  text: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "whitespace-pre-wrap",
        active ? "ai-shimmer-text ai-shimmer-text--active" : "",
        className
      )}
    >
      {text}
    </p>
  );
}
