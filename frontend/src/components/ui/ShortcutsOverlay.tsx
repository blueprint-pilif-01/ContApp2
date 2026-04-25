import { SHORTCUTS } from "../../hooks/useGlobalShortcuts";

export function ShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-frame border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">Comenzi rapide</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Apasă tastele în secvență pentru navigare rapidă.
        </p>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">→</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border border-border bg-background text-xs font-mono text-foreground">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Apasă <kbd className="mx-1 px-1 py-0.5 rounded border border-border text-[10px]">ESC</kbd> sau <kbd className="mx-1 px-1 py-0.5 rounded border border-border text-[10px]">?</kbd> pentru a închide
          </button>
        </div>
      </div>
    </div>
  );
}
