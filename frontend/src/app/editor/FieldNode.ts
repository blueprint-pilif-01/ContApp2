import { Node, mergeAttributes } from "@tiptap/core";
import { InputRule } from "@tiptap/core";

export type FieldType = "text" | "date" | "number" | "signature" | "signature_accountant";

export interface FieldNodeAttrs {
  id: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
}

/**
 * Custom Tiptap node: renders a coloured field chip inline.
 *
 * Shorthand InputRules (typed at start of a word):
 *   ____  → text field
 *   ....  → date field
 *   ::::  → number field
 *   ----  → signature field
 *   ====  → signature_accountant field (semnătură contabil)
 */
export const FieldNode = Node.create<Record<string, never>>({
  name: "fieldNode",
  group: "inline",
  inline: true,
  atom: true, // treated as a single, indivisible unit

  addAttributes() {
    return {
      id: { default: "" },
      label: { default: "Câmp" },
      fieldType: { default: "text" as FieldType },
      required: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-field-node]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-field-node": "true" }),
      HTMLAttributes.label ?? "Câmp",
    ];
  },

  addInputRules() {
    const makeRule = (pattern: RegExp, fieldType: FieldType, defaultLabel: string) =>
      new InputRule({
        find: pattern,
        handler: ({ state, range }) => {
          const { tr } = state;
          const nodeType = state.schema.nodes["fieldNode"];
          if (!nodeType) return;
          const node = nodeType.create({
            id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            label: defaultLabel,
            fieldType,
            required: true,
          });
          tr.replaceWith(range.from, range.to, node);
        },
      });

    return [
      makeRule(/_{4}$/, "text", "Text"),
      makeRule(/\.{4}$/, "date", "Dată"),
      makeRule(/:{4}$/, "number", "Număr"),
      makeRule(/-{4}$/, "signature", "Semnătură"),
      makeRule(/={4}$/, "signature_accountant", "Semnătură contabil"),
    ];
  },
});

// ── Helper: extract all fields from Tiptap JSON ──────────────────────────────

export function extractFields(doc: Record<string, unknown>): FieldNodeAttrs[] {
  const fields: FieldNodeAttrs[] = [];
  const walk = (node: Record<string, unknown>) => {
    if (node.type === "fieldNode" && node.attrs) {
      fields.push(node.attrs as FieldNodeAttrs);
    }
    if (Array.isArray(node.content)) {
      (node.content as Record<string, unknown>[]).forEach(walk);
    }
  };
  walk(doc);
  return fields;
}
