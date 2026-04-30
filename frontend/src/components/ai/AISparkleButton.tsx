import { Sparkles, Square } from "lucide-react";
import { Button, type ButtonSize } from "../ui/Button";
import { cn } from "../../lib/utils";

export function AISparkleButton({
  label,
  loadingLabel = "Generating...",
  loading,
  onClick,
  size = "sm",
  className,
  disabled,
  title,
}: {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  onClick?: () => void;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "relative overflow-hidden border-transparent text-white ai-sparkle-btn",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {loading ? <Square className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? loadingLabel : label}
      </span>
    </Button>
  );
}
