import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "../../lib/utils";
import type { FieldType, FieldNodeAttrs } from "./FieldNode";
import { extractFields } from "./FieldNode";

/** Find position of fieldNode with given id in document */
function findFieldPosition(
  doc: { descendants: (f: (node: { type: { name: string }; attrs?: Record<string, unknown> }, pos: number) => void | boolean) => void },
  fieldId: string
): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (node.type.name === "fieldNode" && node.attrs?.id === fieldId) {
      found = pos;
      return false; // stop iteration
    }
    return; // continue
  });
  return found;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string; description: string; shorthand: string }[] = [
  { type: "text",                label: "Text",               icon: "T",  description: "Nume, adresă, etc.",     shorthand: "____" },
  { type: "date",                label: "Dată",               icon: "D", description: "Dată calendaristică",   shorthand: "...." },
  { type: "number",              label: "Număr",              icon: "#",  description: "Sumă, cantitate, etc.", shorthand: "::::" },
  { type: "signature",           label: "Semnătură",           icon: "S",  description: "Semnătură digitală",   shorthand: "----" },
  { type: "signature_accountant", label: "Semnătură contabil", icon: "C", description: "Semnătura contabilului", shorthand: "====" },
];

const typeColors: Record<FieldType, string> = {
  text:                "bg-foreground/8 text-foreground",
  date:                "bg-foreground/12 text-foreground",
  number:              "bg-foreground/15 text-foreground",
  signature:           "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  signature_accountant: "bg-[color:var(--accent)]/25 text-foreground",
};

interface FieldSidebarProps {
  editor: Editor | null;
}

function FieldListItem({
  field,
  editor,
  typeColors,
  fieldTypes,
}: {
  field: FieldNodeAttrs;
  editor: Editor;
  typeColors: Record<FieldType, string>;
  fieldTypes: typeof FIELD_TYPES;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setEditValue(field.label);
  }, [field.label]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== field.label && field.id) {
      const pos = findFieldPosition(editor.state.doc, field.id);
      if (pos !== null) {
        const node = editor.state.doc.nodeAt(pos);
        if (node) {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, null, { ...node.attrs, label: trimmed })
          );
        }
      }
    } else {
      setEditValue(field.label);
    }
    setEditing(false);
  };

  const ft = fieldTypes.find((x) => x.type === field.fieldType);
  return (
    <div className="flex items-center gap-2 text-xs group">
      <span
        className={cn(
          "w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold shrink-0",
          typeColors[field.fieldType]
        )}
      >
        {ft?.icon}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditValue(field.label);
              setEditing(false);
            }
          }}
          className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-foreground/80 truncate hover:text-foreground hover:bg-foreground/5 rounded px-0.5 py-0.5 -mx-0.5 min-w-0"
          title="Click pentru a redenumi"
        >
          {field.label}
        </button>
      )}
      {field.required && !editing && <span className="text-muted-foreground shrink-0">*</span>}
    </div>
  );
}

export function FieldSidebar({ editor }: FieldSidebarProps) {
  const addField = (fieldType: FieldType, label: string) => {
    if (!editor) return;
    const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    editor.chain().focus().insertContent({
      type: "fieldNode",
      attrs: { id, label, fieldType, required: true },
    }).run();
  };

  // Extract current fields from editor doc
  const docJson = editor?.getJSON() ?? {};
  const fields: FieldNodeAttrs[] = extractFields(docJson as Record<string, unknown>);

  return (
    <div className="w-60 shrink-0 flex flex-col gap-4">
      {/* Insert field types */}
      <div className="bg-frame border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Inserează câmp
        </h4>
        <p className="text-[11px] text-muted-foreground mb-2">
          Click pe un câmp din document pentru a-i schimba numele.
        </p>
        <div className="flex flex-col gap-1.5">
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft.type}
              onClick={() => addField(ft.type, ft.label)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-foreground/5 text-left transition-colors group"
            >
              <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0", typeColors[ft.type])}>
                {ft.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{ft.label}</p>
                <p className="text-[10px] text-muted-foreground">{ft.description}</p>
              </div>
              <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto shrink-0 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Shorthand cheatsheet */}
      <div className="bg-frame border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Scurtături tastatură
        </h4>
        <div className="flex flex-col gap-1.5">
          {FIELD_TYPES.map((ft) => (
            <div key={ft.type} className="flex items-center justify-between text-xs">
              <code className="px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground font-mono text-[11px]">
                {ft.shorthand}
              </code>
              <span className="text-muted-foreground">{ft.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field list */}
      {fields.length > 0 && (
        <div className="bg-frame border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Câmpuri ({fields.length})
          </h4>
          <p className="text-[11px] text-muted-foreground mb-3">
            Click pe nume pentru a redenumi.
          </p>
          <div className="flex flex-col gap-1.5">
            {fields.map((f, i) =>
              editor ? (
                <FieldListItem
                  key={f.id || i}
                  field={f}
                  editor={editor}
                  typeColors={typeColors}
                  fieldTypes={FIELD_TYPES}
                />
              ) : (
                <div key={f.id || i} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold shrink-0", typeColors[f.fieldType])}>
                    {FIELD_TYPES.find((x) => x.type === f.fieldType)?.icon}
                  </span>
                  <span className="text-foreground/80 truncate">{f.label}</span>
                  {f.required && <span className="text-muted-foreground ml-auto shrink-0">*</span>}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
