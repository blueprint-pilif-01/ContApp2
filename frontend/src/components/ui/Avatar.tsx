import { cn, initials } from "../../lib/utils";

const palette = [
  "from-zinc-700 to-zinc-900 text-white",
  "from-zinc-800 to-black text-white",
  "from-stone-700 to-zinc-900 text-white",
  "from-zinc-600 to-zinc-800 text-white",
  "from-[color:var(--accent)] to-[color:var(--accent)] text-foreground",
  "from-zinc-500 to-zinc-700 text-white",
];

function paletteFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length] ?? palette[0]!;
}

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({
  name,
  size = "md",
  className,
  status,
}: {
  name: string;
  size?: AvatarSize;
  className?: string;
  status?: "online" | "away" | "offline";
}) {
  const grad = paletteFor(name || "?");
  const dotColor =
    status === "online"
      ? "bg-[color:var(--accent)]"
      : status === "away"
        ? "bg-amber-500"
        : "bg-zinc-400";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br font-semibold flex items-center justify-center shadow-sm",
          grad,
          sizeMap[size]
        )}
      >
        {initials(name || "?")}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-frame",
            dotColor
          )}
        />
      )}
    </div>
  );
}

export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((name) => (
        <div key={name} className="ring-2 ring-frame rounded-full">
          <Avatar name={name} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div className="ring-2 ring-frame rounded-full w-8 h-8 bg-foreground/10 text-foreground flex items-center justify-center text-xs font-semibold">
          +{extra}
        </div>
      )}
    </div>
  );
}
