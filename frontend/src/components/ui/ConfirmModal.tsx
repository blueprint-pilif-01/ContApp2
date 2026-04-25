import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data?: { reason: string }) => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmPhrase?: string; // e.g. "CONFIRM" - user must type this
  variant?: "danger" | "warning";
  reasonRequired?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmă",
  confirmPhrase,
  variant = "danger",
  reasonRequired = false,
}: ConfirmModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm =
    (!confirmPhrase || typedPhrase === confirmPhrase) &&
    (!reasonRequired || reason.trim().length >= 10);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onConfirm(reasonRequired ? { reason: reason.trim() } : undefined);
      onClose();
      setTypedPhrase("");
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTypedPhrase("");
      setReason("");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50" onClick={handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative bg-frame border border-border rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === "danger" ? "bg-red-500/10" : "bg-yellow-500/10"
            }`}
          >
            <AlertTriangle className={`w-5 h-5 ${variant === "danger" ? "text-red-500" : "text-yellow-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}

            {reasonRequired && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Motiv (min. 10 caractere) *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explicați de ce se efectuează acțiunea..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 resize-none"
                />
              </div>
            )}

            {confirmPhrase && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tastați <span className="font-mono font-semibold">{confirmPhrase}</span> pentru a confirma
                </label>
                <input
                  type="text"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder={confirmPhrase}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-foreground/15"
                />
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Anulare
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirm}
                disabled={!canConfirm || loading}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
