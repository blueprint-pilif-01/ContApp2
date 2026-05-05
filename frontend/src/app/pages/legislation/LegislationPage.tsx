import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useExtensions } from "../../../hooks/useExtensions";
import {
  useLegislationPreferences,
  useLegislationUpdates,
  useUpdateLegislationPreferences,
} from "../../../hooks/useLegislation";
import { useToast } from "../../../components/ui/Toast";
import {
  AIResultCard,
  AIShimmerText,
  AISparkleButton,
} from "../../../components/ai";
import { summarize, topicDigest } from "../../../lib/ai";
import { fmtRelative, cn } from "../../../lib/utils";

type LegislationItem = {
  id: number;
  title: string;
  category: string;
  caen_codes: string[];
  source: string;
  source_url: string;
  published_at: string;
  summary: string;
};

type NotifyMode = "instant" | "daily" | "weekly" | "never";

const TOPICS = [
  { id: "fiscal", label: "Fiscal" },
  { id: "munca", label: "Muncă" },
  { id: "gdpr", label: "GDPR" },
  { id: "comercial", label: "Comercial" },
];

const CAEN_OPTIONS = [
  { code: "6920", label: "Contabilitate" },
  { code: "7022", label: "Consultanță" },
  { code: "6202", label: "IT services" },
  { code: "8559", label: "Educație" },
  { code: "4719", label: "Retail" },
];

const NOTIFY_MODES: Array<{ id: NotifyMode; label: string }> = [
  { id: "instant", label: "Instant" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "never", label: "Never" },
];

export default function LegislationPage() {
  const ext = useExtensions();
  const toast = useToast();
  const aiAvailable = ext.canUse("ai_assistant");
  const prefs = useLegislationPreferences();
  const updatePrefs = useUpdateLegislationPreferences();
  const [topics, setTopics] = useState<string[]>([]);
  const [caenSelected, setCaenSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [notifyMode, setNotifyMode] = useState<NotifyMode>(
    prefs.data.notify_mode
  );

  const [activeArticle, setActiveArticle] = useState<LegislationItem | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState("");
  const [digestBusy, setDigestBusy] = useState(false);

  const updates = useLegislationUpdates();
  const news = useMemo<LegislationItem[]>(
    () =>
      updates.data.updates.map((item, index) => ({
        id: Number(item.id) || index + 1,
        title: item.title,
        category: item.category_code,
        caen_codes: item.caen_codes ?? [],
        source: item.source_name,
        source_url: item.source_url,
        published_at: item.published_at,
        summary: item.summary,
      })),
    [updates.data.updates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      if (topics.length > 0 && !topics.includes(item.category)) return false;
      if (
        caenSelected.length > 0 &&
        !item.caen_codes.some((c) => caenSelected.includes(c))
      )
        return false;
      if (!q) return true;
      return `${item.title} ${item.summary}`.toLowerCase().includes(q);
    });
  }, [news, topics, caenSelected, query]);

  useEffect(() => {
    if (!activeArticle && filtered.length) setActiveArticle(filtered[0] ?? null);
  }, [filtered, activeArticle]);

  const summarizeArticle = async (article: LegislationItem) => {
    setActiveArticle(article);
    if (!aiAvailable) {
      toast.error("AI Assistant nu este activ. Activează-l din Setări → Abonament.");
      return;
    }
    setBusy(true);
    setSummary("");
    for await (const chunk of summarize(`${article.title}. ${article.summary}`)) {
      setSummary(chunk);
    }
    setBusy(false);
  };

  const buildTopicDigest = async () => {
    if (filtered.length === 0) return;
    if (!aiAvailable) {
      toast.error("AI Assistant nu este activ. Activează-l din Setări → Abonament.");
      return;
    }
    setDigestBusy(true);
    setDigest("");
    const articles = filtered.map((a) => `${a.title}: ${a.summary}`);
    for await (const chunk of topicDigest(articles)) {
      setDigest(chunk);
    }
    setDigestBusy(false);
  };

  const toggle = (
    collection: string[],
    setter: (v: string[]) => void,
    value: string
  ) => {
    if (collection.includes(value)) {
      setter(collection.filter((v) => v !== value));
    } else {
      setter([...collection, value]);
    }
  };

  const activeFilters = topics.length + caenSelected.length;
  const saveNotifyMode = (mode: NotifyMode) => {
    setNotifyMode(mode);
    updatePrefs.mutate({ notify_mode: mode });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legislație"
        description="Filtrează după topic și CAEN. Sumarizează cu AI orice articol sau întreg lot-ul."
        actions={
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută în articole..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        {/* Sidebar filters */}
        <aside className="rounded-2xl border border-border bg-frame p-4 space-y-5 h-fit xl:sticky xl:top-20">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filtre
            </h2>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTopics([]);
                  setCaenSelected([]);
                }}
                className="text-[11px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Topic
            </p>
            <div className="space-y-1">
              {TOPICS.map((t) => {
                const active = topics.includes(t.id);
                const count = news.filter((n) => n.category === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(topics, setTopics, t.id)}
                    className={cn(
                      "w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-xl transition-colors",
                      active
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-foreground/5"
                    )}
                  >
                    <span>{t.label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 rounded-full",
                        active ? "bg-background/15" : "bg-foreground/8 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Cod CAEN
            </p>
            <div className="space-y-1">
              {CAEN_OPTIONS.map((c) => {
                const active = caenSelected.includes(c.code);
                return (
                  <button
                    key={c.code}
                    onClick={() => toggle(caenSelected, setCaenSelected, c.code)}
                    className={cn(
                      "w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-xl transition-colors",
                      active
                        ? "bg-foreground/10 text-foreground"
                        : "hover:bg-foreground/5 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                        active
                          ? "bg-[color:var(--accent)] border-[color:var(--accent)]"
                          : "border-border"
                      )}
                    >
                      {active && (
                        <span className="w-1.5 h-1.5 bg-foreground rounded-sm" />
                      )}
                    </span>
                    <span className="font-mono text-[11px]">{c.code}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              Frecvență digest
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {NOTIFY_MODES.map((mode) => {
                const active = notifyMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => saveNotifyMode(mode.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "bg-foreground/5 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Articles + AI panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-w-0">
          <section className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filtered.length} articole
                {activeFilters > 0 ? ` · ${activeFilters} filtre active` : ""}
              </p>
              <AISparkleButton
                label="Topic digest AI"
                loading={digestBusy}
                onClick={buildTopicDigest}
                disabled={!aiAvailable}
                title={
                  aiAvailable
                    ? "Generează un digest pe topic"
                    : "Necesită AI Assistant activ"
                }
              />
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-frame p-12 text-center text-sm text-muted-foreground">
                Niciun articol pentru filtrele selectate.
              </div>
            ) : (
              filtered.map((article) => {
                const isActive = activeArticle?.id === article.id;
                return (
                  <article
                    key={article.id}
                    className={cn(
                      "rounded-2xl border bg-frame p-5 space-y-3 cursor-pointer transition-colors",
                      isActive
                        ? "border-foreground/40 ring-1 ring-foreground/20"
                        : "border-border hover:border-foreground/20"
                    )}
                    onClick={() => setActiveArticle(article)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold tracking-tight">
                          {article.title}
                        </h3>
                        <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-2 flex-wrap">
                          <Badge variant="neutral">{article.category}</Badge>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtRelative(article.published_at)}
                          </span>
                          <span>· {article.source}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {article.caen_codes.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground"
                          >
                            CAEN {c}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={!aiAvailable}
                          title={aiAvailable ? "Sumarizează cu AI" : "Necesită AI Assistant activ"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void summarizeArticle(article);
                          }}
                        >
                          <Sparkles className="w-3 h-3" /> AI
                        </Button>
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> Sursa
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <aside className="space-y-3 lg:sticky lg:top-20 h-fit">
            <div className="rounded-2xl border border-border bg-frame p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sumar articol
              </p>
              <h3 className="text-sm font-semibold mb-3 truncate">
                {activeArticle?.title ?? "Selectează articol"}
              </h3>
              <AIShimmerText
                active={busy}
                text={
                  summary ||
                  "Apasă „AI” pe un articol pentru a genera o sinteză rapidă."
                }
                className="text-sm text-foreground"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                disabled={!activeArticle || !aiAvailable}
                title={aiAvailable ? undefined : "Necesită AI Assistant activ"}
                onClick={() => activeArticle && summarizeArticle(activeArticle)}
              >
                <Sparkles className="w-4 h-4" /> Sumarizează
              </Button>
            </div>

            {(digest || digestBusy) && (
              <AIResultCard
                loading={digestBusy}
                onRegenerate={buildTopicDigest}
                onCopy={() => navigator.clipboard.writeText(digest)}
                onDismiss={() => setDigest("")}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Topic digest
                </p>
                <AIShimmerText
                  active={digestBusy}
                  text={digest || "Generare digest..."}
                  className="text-sm text-foreground"
                />
              </AIResultCard>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
