import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  Library,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs } from "../../../components/ui/Tabs";
import { NLBuilderPanel } from "./ai-studio/NLBuilderPanel";
import { AgentDesigner } from "./ai-studio/AgentDesigner";
import { AIActionCatalog } from "./ai-studio/AIActionCatalog";
import { Badge } from "../../../components/ui/Badge";

type StudioTab = "nl" | "agents" | "catalog";

export default function AIStudioPage() {
  const [tab, setTab] = useState<StudioTab>("nl");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            AI Studio
            <Badge variant="accent" className="gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" /> Live
            </Badge>
          </span>
        }
        description="Construiește workflow-uri din text liber, definește agenți AI multi-pas și răsfoiește catalogul de acțiuni AI."
      />

      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          Toate funcțiile AI fac apeluri reale către backend (<code>POST /ai/*</code>). Dacă
          endpoint-ul nu e încă activat în mediu, vei vedea o eroare reală — nu există
          răspunsuri simulate.
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={(id) => setTab(id as StudioTab)}
        tabs={[
          { id: "nl", label: "Builder din text", icon: <Wand2 className="h-4 w-4" /> },
          { id: "agents", label: "Agenți AI", icon: <Bot className="h-4 w-4" /> },
          { id: "catalog", label: "Catalog acțiuni AI", icon: <Library className="h-4 w-4" /> },
        ]}
      />

      {tab === "nl" && (
        <NLBuilderPanel
          onUseGenerated={(wfId) => navigate(`/app/automations/workflows/${wfId}`)}
        />
      )}
      {tab === "agents" && <AgentDesigner />}
      {tab === "catalog" && (
        <AIActionCatalog
          onCreateWorkflow={() => navigate("/app/automations/workflows/new")}
        />
      )}
    </div>
  );
}

export function AIStudioCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-[color:var(--accent)]/15"
    >
      <Plus className="h-3 w-3" /> Mergi în AI Studio
    </button>
  );
}
