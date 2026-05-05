import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { SectionCard } from "../../../../components/ui/SectionCard";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { AI_ACTIONS, CATALOG_COUNTS } from "../../../../lib/automation/catalog";

const EXAMPLES: Partial<
  Record<
    (typeof AI_ACTIONS)[number]["kind"],
    { endpoint: string; usage: string }
  >
> = {
  ai_summarize: {
    endpoint: "POST /ai/summarize",
    usage: "Pași workflow: comprimă descrieri lungi de contract sau note interne.",
  },
  ai_draft_email: {
    endpoint: "POST /ai/draft-email",
    usage: "După trigger pe client sau ticket — generează corp email pentru review uman.",
  },
  ai_classify: {
    endpoint: "POST /ai/classify",
    usage: "Etichetează automat mesaje sau tickete după categorii definite de tine.",
  },
  ai_extract_fields: {
    endpoint: "POST /ai/extract-fields",
    usage: "Transformă text liber în câmpuri structurate (sumă, dată, parte).",
  },
  ai_translate: {
    endpoint: "POST /ai/translate",
    usage: "Traduce mesaje sau comentarii pentru echipe multilingve.",
  },
  ai_sentiment: {
    endpoint: "POST /ai/sentiment",
    usage: "Detectează tonul mesajului pentru routing sau escaladare.",
  },
  ai_suggest_assignee: {
    endpoint: "POST /ai/suggest-assignee",
    usage: "Propune responsabil pe baza sarcinilor și disponibilității echipei.",
  },
  ai_predict_due_date: {
    endpoint: "POST /ai/predict-due-date",
    usage: "Estimează termen realist pentru un ticket nou.",
  },
  ai_generate_task_description: {
    endpoint: "POST /ai/generate-task-description",
    usage: "Primește un titlu scurt și întoarce descriere structurată pentru ticketing.",
  },
  ai_score_lead: {
    endpoint: "POST /ai/score-lead",
    usage: "Prioritizează lead-uri sau clienți în funnel după scor 0–100.",
  },
};

export function AIActionCatalog({
  onCreateWorkflow,
}: {
  onCreateWorkflow: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard
        icon={Sparkles}
        title="Catalog acțiuni AI în workflow-uri"
        description={`${CATALOG_COUNTS.ai_actions} acțiuni mapate la endpoint-uri /ai/*. Motorul va invoca aceleași rute la execuție.`}
        padding="sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AI_ACTIONS.map((a) => {
            const ex = EXAMPLES[a.kind];
            const Icon = a.icon;
            return (
              <article
                key={a.kind}
                className="flex flex-col rounded-2xl border border-border bg-frame p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15">
                    <Icon className="h-4 w-4" strokeWidth={1.85} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="neutral" className="text-[10px]">
                    {a.group}
                  </Badge>
                  {ex && (
                    <Badge variant="info" className="text-[10px] font-mono">
                      {ex.endpoint}
                    </Badge>
                  )}
                </div>
                {ex && (
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ex.usage}</p>
                )}
              </article>
            );
          })}
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-frame px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4" />
          Gata să combini acțiuni într-un flux vizual?
        </div>
        <Button size="sm" onClick={onCreateWorkflow}>
          Deschide builderul <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
