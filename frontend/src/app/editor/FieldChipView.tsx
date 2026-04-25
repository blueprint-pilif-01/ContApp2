import { useState, useRef, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { X, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import type { FieldType } from "./FieldNode";

const typeColors: Record<FieldType, string> = {
  text:                "bg-foreground/8 text-foreground border-foreground/15",
  date:                "bg-foreground/12 text-foreground border-foreground/20",
  number:              "bg-foreground/15 text-foreground border-foreground/25",
  signature:           "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  signature_accountant: "bg-[color:var(--accent)]/25 text-foreground border-[color:var(--accent)]/40",
};

const typeIcons: Record<FieldType, string> = {
  text:                "T",
  date:                "D",
  number:              "#",
  signature:           "S",
  signature_accountant: "C",
};

/**
 * React node view for FieldNode — renders a styled chip inside the editor.
 * The chip shows the field label (editable on click), icon, and remove button.
 */
export function FieldChipView({ node, deleteNode, updateAttributes, selected }: NodeViewProps) {
  const { label, fieldType, required } = node.attrs as {
    label: string;
    fieldType: FieldType;
    required: boolean;
  };

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSaveLabel = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      updateAttributes?.({ label: trimmed });
    } else {
      setEditValue(label);
    }
    setEditing(false);
  };

  return (
    <NodeViewWrapper as="span" className="inline-flex items-center">
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium leading-none group",
          "select-none cursor-default transition-shadow",
          typeColors[fieldType],
          selected && "ring-2 ring-offset-1 ring-accent/60"
        )}
        title={!editing ? `Click pentru a schimba numele câmpului` : undefined}
      >
        <span className="text-[10px] opacity-70 shrink-0">{typeIcons[fieldType]}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveLabel();
              if (e.key === "Escape") {
                setEditValue(label);
                setEditing(false);
              }
            }}
            className="min-w-[60px] max-w-[180px] bg-transparent border-none outline-none py-0 text-inherit"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditValue(label);
              setEditing(true);
            }}
            className="text-left hover:bg-foreground/5 rounded px-0.5 -mx-0.5 py-0.5 min-w-0 inline-flex items-center gap-0.5"
            title="Click pentru a schimba numele câmpului"
          >
            {label}
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" aria-hidden />
          </button>
        )}
        {required && !editing && <span className="opacity-60 text-[10px] shrink-0">*</span>}
        <button
          type="button"
          onClick={deleteNode}
          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity shrink-0"
          tabIndex={-1}
          title="Șterge câmp"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    </NodeViewWrapper>
  );
}
