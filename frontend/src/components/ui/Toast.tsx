import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
}

interface ToastContextValue {
  show: (opts: Omit<Toast, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

const icons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantClass: Record<ToastVariant, string> = {
  success: "border-green-500/30 bg-frame text-foreground [&_svg]:text-green-500",
  error:   "border-red-500/30 bg-frame text-foreground [&_svg]:text-red-500",
  warning: "border-yellow-500/30 bg-frame text-foreground [&_svg]:text-yellow-500",
  info:    "border-foreground/20 bg-frame text-foreground [&_svg]:text-foreground/70",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const Icon = icons[toast.variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 w-80 rounded-xl border p-4 shadow-lg",
        "animate-in slide-in-from-right-4 fade-in-0 duration-200",
        variantClass[toast.variant]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        )}
        <p className="text-sm text-muted-foreground leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Închide"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { ...opts, id }]); // max 5
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const success = useCallback(
    (message: string, title?: string) =>
      show({ variant: "success", message, ...(title !== undefined ? { title } : {}) }),
    [show]
  );
  const error = useCallback(
    (message: string, title?: string) =>
      show({ variant: "error", message, ...(title !== undefined ? { title } : {}) }),
    [show]
  );
  const warning = useCallback(
    (message: string, title?: string) =>
      show({ variant: "warning", message, ...(title !== undefined ? { title } : {}) }),
    [show]
  );
  const info = useCallback(
    (message: string, title?: string) =>
      show({ variant: "info", message, ...(title !== undefined ? { title } : {}) }),
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2"
          aria-live="polite"
          aria-label="Notificări"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
