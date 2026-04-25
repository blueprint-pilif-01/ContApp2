import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function SignSuccessPage() {
  const state = useLocation().state as
    | { contract_number?: string; template_name?: string }
    | undefined;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--ai-grad-2)_30%,transparent)_0%,transparent_55%)]" />
      <div className="w-full max-w-md rounded-3xl border border-border bg-frame p-8 text-center space-y-3 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold">Contract semnat cu succes</h1>
        <p className="text-sm text-muted-foreground">
          Mulțumim. Cabinetul a primit semnătura ta și o copie a datelor
          completate.
        </p>
        {state?.template_name && (
          <p className="text-xs text-muted-foreground">
            Document: <strong className="text-foreground">{state.template_name}</strong>
          </p>
        )}
        {state?.contract_number && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/5 text-sm">
            Număr contract: <strong>{state.contract_number}</strong>
          </div>
        )}
        <div className="pt-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Înapoi în aplicație
          </Link>
        </div>
      </div>
    </div>
  );
}
