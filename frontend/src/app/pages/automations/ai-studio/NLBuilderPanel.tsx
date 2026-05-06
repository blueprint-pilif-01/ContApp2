import { useState } from "react";
import { Bot, Lightbulb, Plus, Sparkles, Wand2 } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Textarea } from "../../../../components/ui/Input";
import { Badge } from "../../../../components/ui/Badge";
import { SectionCard } from "../../../../components/ui/SectionCard";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Skeleton } from "../../../../components/ui/Skeleton";
import { WorkflowCanvas } from "../builder/WorkflowCanvas";
import {
  draftWorkflowFromText,
  explainWorkflow,
  type DraftWorkflowResponse,
} from "../../../../lib/ai";
import {
  generateId,
  useSaveWorkflow,
} from "../../../../lib/automation/storage";
import type { Workflow } from "../../../../lib/automation/types";

const SUGGESTIONS = [
  "Notifică-mă cu 3 zile înainte ca un contract să expire și creează un ticket pentru responsabil.",
  "Când un client trimite un mesaj într-o limbă străină, traduce-l în română și anunță echipa de support.",
  "Vineri la 16:00 trimite un digest cu schimbările legislative pe domeniul nostru.",
  "Dacă un ticket cu prioritate înaltă rămâne neasignat 30 de minute, alertează managerul de cont.",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: DraftWorkflowResponse }
  | { kind: "error" };

export function NLBuilderPanel({
  onUseGenerated,
}: {
  onUseGenerated: (id: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [explanation, setExplanation] = useState<string>("");
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const saveMutation = useSaveWorkflow();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setState({ kind: "loading" });
    setExplanation("");
    try {
      const data = await draftWorkflowFromText(prompt);
      if (!data) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "ready", data });
    } catch {
      setState({ kind: "error" });
    }
  };

  const handleExplain = async () => {
    if (state.kind !== "ready") return;
    const wf = state.data.workflow;
    setExplainingId(wf.id);
    setExplanation("");
    try {
      for await (const chunk of explainWorkflow(wf)) {
        setExplanation(chunk);
      }
    } finally {
      setExplainingId(null);
    }
  };

  const handleUse = () => {
    if (state.kind !== "ready") return;
    const generated = state.data.workflow;
    const workflow: Workflow = {
      ...generated,
      id: generateId("wf"),
      enabled: false,
      source: "ai_generated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveMutation.mutate(workflow, {
      onSuccess: (saved) => onUseGenerated(saved.id),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <SectionCard
        icon={Wand2}
        title="Descrie workflow-ul în limbaj natural"
        description="AI-ul transformă textul într-un flux structurat pe care îl poți edita imediat."
        padding="sm"
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="Ex.: Când o factură depășește 30 de zile restanță, trimite un email politicos clientului și creează un ticket urgent pentru contabilitate..."
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              <Lightbulb className="h-3 w-3" /> {truncate(s, 48)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Apel real către <code>POST /ai/draft-workflow</code>.
          </p>
          <Button onClick={handleGenerate} disabled={!prompt.trim() || state.kind === "loading"}>
            <Sparkles className="h-4 w-4" />
            {state.kind === "loading" ? "Se generează..." : "Generează"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={Bot}
        title="Workflow propus"
        description="Editează-l aici sau salvează-l direct. Poți cere și o explicație în text."
        padding="sm"
        actions={
          state.kind === "ready" && (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="xs" onClick={handleExplain}>
                <Sparkles className="h-3.5 w-3.5" />
                {explainingId ? "Se generează..." : "Explică"}
              </Button>
              <Button size="xs" onClick={handleUse} loading={saveMutation.isPending}>
                <Plus className="h-3.5 w-3.5" /> Salvează
              </Button>
            </div>
          )
        }
      >
        {state.kind === "idle" && (
          <EmptyState
            icon={Wand2}
            title="Nimic generat încă"
            description="Scrie o descriere și apasă Generează pentru a vedea aici fluxul."
          />
        )}
        {state.kind === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}
        {state.kind === "error" && (
          <EmptyState
            icon={Bot}
            title="AI temporar indisponibil"
            description="Endpoint-ul /ai/draft-workflow nu a răspuns. Reîncearcă în câteva momente sau construiește manual fluxul."
          />
        )}
        {state.kind === "ready" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="accent" className="gap-1">
                <Sparkles className="h-3 w-3" /> Generat AI
              </Badge>
              <span className="text-sm font-semibold text-foreground">
                {state.data.workflow.name}
              </span>
            </div>
            {state.data.workflow.description && (
              <p className="text-xs text-muted-foreground">{state.data.workflow.description}</p>
            )}
            <WorkflowCanvas
              workflow={state.data.workflow}
              selectedPath={null}
              onSelectStep={() => {}}
              onSelectTrigger={() => {}}
              onAddStep={() => {}}
              onRemoveStep={() => {}}
            />
            {explanation && (
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Bot className="h-3.5 w-3.5" /> Explicație AI
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{explanation}</p>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
