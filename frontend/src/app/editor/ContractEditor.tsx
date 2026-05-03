import { useEffect } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, List, ListOrdered, Heading2,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
} from "lucide-react";
import { FieldNode } from "./FieldNode";
import { FieldChipView } from "./FieldChipView";
import { FieldSidebar } from "./FieldSidebar";
import { cn } from "../../lib/utils";

// ─── Toolbar button ────────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ─── Editor component ──────────────────────────────────────────────────────────

interface ContractEditorProps {
  initialContent?: Record<string, unknown> | undefined;
  onChange?: ((json: Record<string, unknown>) => void) | undefined;
  readOnly?: boolean | undefined;
}

export function ContractEditor({ initialContent, onChange, readOnly = false }: ContractEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Scrie conținutul contractului. Tastează ____ text, .... dată, :::: număr, ---- semnătură, ==== semnătură contabil." }),
      FieldNode.extend({
        addNodeView() {
          return ReactNodeViewRenderer(FieldChipView);
        },
      }),
    ],
    content: initialContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (!editor || !initialContent) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(initialContent);
    if (current !== next) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  const iconSize = "w-4 h-4";

  return (
    <div className="flex gap-4">
      {/* Main editor pane */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {/* Toolbar */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border border-border border-b-0 rounded-t-xl bg-frame">
            {/* Undo / Redo */}
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Anulează (Ctrl+Z)">
              <Undo className={iconSize} />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refă (Ctrl+Y)">
              <Redo className={iconSize} />
            </ToolBtn>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Heading */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Titlu"
            >
              <Heading2 className={iconSize} />
            </ToolBtn>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Bold / Italic */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Îngroșat (Ctrl+B)"
            >
              <Bold className={iconSize} />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Cursiv (Ctrl+I)"
            >
              <Italic className={iconSize} />
            </ToolBtn>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Lists */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Listă"
            >
              <List className={iconSize} />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Listă numerotată"
            >
              <ListOrdered className={iconSize} />
            </ToolBtn>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Alignment */}
            <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Aliniere stânga">
              <AlignLeft className={iconSize} />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centrare">
              <AlignCenter className={iconSize} />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Aliniere dreapta">
              <AlignRight className={iconSize} />
            </ToolBtn>
          </div>
        )}

        {/* Editor content area */}
        <EditorContent
          editor={editor}
          className={cn(
            "flex-1 min-h-[460px] border border-border bg-background p-6",
            !readOnly ? "rounded-b-xl" : "rounded-xl",
            "[&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none",
            "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-4",
            "[&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-relaxed",
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3",
            "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground/50",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:float-left",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
          )}
        />
      </div>

      {/* Sidebar */}
      {!readOnly && <FieldSidebar editor={editor} />}
    </div>
  );
}
