import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

interface ResourceLookupProps {
  title: string;
  description?: string;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  onLookup: (id: number) => void;
  children?: ReactNode;
}

/**
 * Lookup-by-ID card used on every list-style page until the backend
 * exposes list endpoints. Takes a numeric id, hands it to `onLookup`,
 * and renders children as the result area.
 */
export function ResourceLookup({
  title,
  description,
  placeholder = "Introdu ID-ul",
  isLoading,
  error,
  onLookup,
  children,
}: ResourceLookupProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(id) && id > 0) onLookup(id);
  };

  return (
    <div className="rounded-2xl border border-border bg-frame p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            leadingIcon={<Search className="w-4 h-4" />}
            type="number"
            inputMode="numeric"
            min={1}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button type="submit" size="md" loading={Boolean(isLoading)}>
          Caută
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/8 rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      {children}
    </div>
  );
}
