import { motion, type Transition } from "motion/react";
import {
  AlertTriangle,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  CircleCheck,
  Clock,
  FileCheck,
  FileText,
  GripVertical,
  KanbanSquare,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

const cardAnimation = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

const getCardTransition = (delay = 0): Transition => ({
  duration: 0.8,
  ease: EASE,
  delay,
});

function BrowserWindowMock({
  children,
  url: _url,
  title,
  variant = "full",
  stretch = false,
}: {
  children: ReactNode;
  url: string;
  title: string;
  variant?: "full" | "compact" | "large";
  stretch?: boolean;
}): ReactNode {
  const isCompact = variant === "compact";
  const isLarge = variant === "large";

  return (
    <div
      className={`
        relative flex flex-col overflow-hidden z-10 rounded-lg border border-border/50 bg-background shadow-lg ring-1 ring-black/5
        ${stretch ? "w-full" : isCompact ? "w-72 md:w-80" : isLarge ? "w-full max-w-[500px] min-h-[340px]" : "w-80 md:w-[420px]"}
        ${stretch ? "" : isLarge ? "min-h-[320px] aspect-[4/3]" : "aspect-[4/3]"}
      `}
    >
      {/* Title bar – window controls + title */}
      <div className={`flex items-center gap-2 border-b border-border/50 bg-neutral-100 dark:bg-neutral-800/90 shrink-0 ${isCompact ? "px-2 py-1" : isLarge ? "px-3 py-1.5" : "px-3 py-1.5"}`}>
        <div className="flex gap-1" aria-hidden="true">
          <div className="w-2 h-2 rounded-full bg-red-400/90 dark:bg-red-500/80" />
          <div className="w-2 h-2 rounded-full bg-amber-400/90 dark:bg-amber-500/80" />
          <div className="w-2 h-2 rounded-full bg-green-400/90 dark:bg-green-500/80" />
        </div>
        <span className={`text-muted-foreground truncate flex-1 ml-1 ${isCompact ? "text-[9px]" : "text-[11px]"}`}>{title}</span>
      </div>

      {/* Content area */}
      <div
        className={`
          relative flex-1 min-h-0 overflow-hidden
          bg-[var(--color-frame)] dark:bg-neutral-900
          ${isCompact ? "p-2" : isLarge ? "p-4" : "p-3"}
        `}
      >
        {children}
      </div>
    </div>
  );
}

function DecorativeCircles(): ReactNode {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="absolute size-56 border border-accent/80 rounded-full" />
      <div className="absolute size-72 border border-accent/60 rounded-full" />
      <div className="absolute size-88 border border-accent/40 rounded-full" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Group 1 — Contracts Pro hero
 * ──────────────────────────────────────────────────────────────────────────── */

function StepByStepCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-primary rounded-4xl p-6 md:p-6 overflow-hidden min-h-140 md:row-span-2 flex flex-col"
    >
      <div className="relative z-10 mb-4 transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-neutral-900/60 mb-2">
          Contracts Pro
        </span>
        <h3 className="text-2xl md:text-3xl font-medium text-neutral-900 leading-tight mb-2">
          Semnare Fără Fricțiune
        </h3>
        <p className="text-neutral-700 text-sm max-w-md">
          Generezi link public de semnare și primești PDF automat. Fără cont necesar pentru semnatar.
        </p>
      </div>

      <div className="flex-1 flex justify-center items-stretch min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.01]">
        <BrowserWindowMock url="app.contapp.ro" title="Dashboard – ContApp" variant="large">
          <div className="h-full flex flex-col gap-3 min-h-0">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[
                { label: "Șabloane", value: "12", sub: "contracte" },
                { label: "Solicitări", value: "3", sub: "în așteptare" },
                { label: "Semnate", value: "24", sub: "total" },
                { label: "Clienți", value: "8", sub: "în baza" },
              ].map((k) => (
                <div key={k.label} className="bg-background border border-border rounded-xl p-2 flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{k.label}</span>
                  <span className="text-lg font-bold text-foreground">{k.value}</span>
                  <span className="text-[10px] text-muted-foreground">{k.sub}</span>
                </div>
              ))}
            </div>
            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              {[
                { icon: FileText, label: "Nou șablon", sub: "Creează contract" },
                { icon: Send, label: "Solicitare nouă", sub: "Trimite contract" },
                { icon: Users, label: "Client nou", sub: "Adaugă client" },
              ].map((a) => (
                <div key={a.label} className="bg-background border border-border rounded-xl p-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                    <a.icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Recent submissions mini table */}
            <div className="flex-1 min-h-0 border border-border rounded-xl overflow-hidden flex flex-col bg-background">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-xs font-semibold text-foreground">Submisii recente</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Vezi toate</span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <table className="w-full text-left">
                  <tbody>
                    {[
                      { name: "Bogdan Marian", template: "Contract Prestări", time: "acum 2 zile", done: true },
                      { name: "Victor Ionescu", template: "NDA", time: "acum 1 săpt.", done: false },
                      { name: "Elena Nistor", template: "Colaborare", time: "acum 3 săpt.", done: false },
                    ].map((r) => (
                      <tr key={r.name} className={`border-b border-border last:border-0 ${r.done ? "bg-accent/10" : "bg-transparent"}`}>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium text-foreground">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.template}</p>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.done && <CircleCheck className="w-4 h-4 text-accent inline-block ml-1" />}
                          <span className="text-[10px] text-muted-foreground">{r.time}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </BrowserWindowMock>
      </div>
    </motion.div>
  );
}

function DashboardCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.1)}
      className="group bg-card-secondary rounded-4xl p-6 md:p-8 overflow-hidden min-h-80 relative flex flex-col md:flex-row md:items-center gap-6"
    >
      <div className="relative z-10 shrink-0 w-[170px] transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-card-foreground-muted mb-2">
          Contracts Pro
        </span>
        <h3 className="text-xl md:text-2xl font-medium text-card-foreground leading-tight mb-2">
          Contracte în Minute
        </h3>
        <p className="text-card-foreground-muted text-sm">
          Fără Word, fără email cu atașamente. Contracte profesionale trimise direct din platformă.
        </p>
      </div>

      <div className="relative flex-1 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
        <DecorativeCircles />

        <BrowserWindowMock url="app.contapp.ro/contracts/templates/new" title="Șablon nou – ContApp" variant="compact">
          <div className="h-full flex flex-col gap-2 min-h-0">
            {/* Top bar: back + name + save */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground">← Înapoi</span>
              <div className="flex-1 rounded-lg border border-border bg-background px-2 py-1">
                <span className="text-xs text-muted-foreground">Numele șablonului...</span>
              </div>
              <span className="text-[10px] bg-accent text-accent-contrast px-2 py-1 rounded font-medium">Salvează</span>
            </div>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border border-border rounded-t-lg bg-background shrink-0">
              {["↶", "↷", "H", "B", "I", "•", "1."].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-muted-foreground bg-foreground/5">
                  {c}
                </div>
              ))}
            </div>
            {/* Editor content */}
            <div className="flex-1 min-h-0 border border-border border-t-0 rounded-b-lg rounded-t-none bg-background p-3">
              <p className="text-sm font-medium text-foreground">Contract de prestări servicii</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Între <span className="inline-block px-1.5 py-0.5 rounded bg-accent/20 text-foreground text-[10px]">Client</span> și părțile ...
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Scrie conținutul. Tastează ____ text, .... dată, ---- semnătură.
              </p>
            </div>
          </div>
        </BrowserWindowMock>
      </div>
    </motion.div>
  );
}

function TrustedByCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.2)}
      className="group bg-card-secondary rounded-4xl p-6 md:p-8 flex flex-col min-h-64 overflow-hidden"
    >
      <div className="mb-4 transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-card-foreground-muted mb-2">
          Contracts Pro
        </span>
        <h3 className="text-2xl md:text-3xl font-medium text-card-foreground leading-tight mb-1">
          Profil Client
        </h3>
        <p className="text-card-foreground-muted text-sm">
          Persoane fizice sau companii — dosar complet cu documente atașate.
        </p>
      </div>

      <div className="flex-1 min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <BrowserWindowMock url="app.contapp.ro/clients/123" title="SC Tech Web SRL – ContApp" stretch>
          <div className="flex flex-col gap-2.5">
            {/* Client header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                TW
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">SC Tech Web SRL</p>
                <p className="text-[10px] text-muted-foreground">CUI: 12345678 · SRL · București</p>
              </div>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent shrink-0">Activ</span>
            </div>
            {/* Contact */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Email", value: "contact@techweb.ro" },
                { label: "Tel", value: "0721 234 567" },
              ].map((r) => (
                <div key={r.label} className="p-2 rounded-lg bg-background border border-border">
                  <p className="text-[9px] text-muted-foreground mb-0.5">{r.label}</p>
                  <p className="text-[10px] font-medium text-foreground truncate">{r.value}</p>
                </div>
              ))}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Contracte", value: "4" },
                { label: "Documente", value: "7" },
                { label: "Tickete", value: "2" },
              ].map((s) => (
                <div key={s.label} className="p-2 rounded-lg bg-background border border-border text-center">
                  <p className="text-base font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Recent docs */}
            <div className="space-y-1">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Documente recente</p>
              {[
                { name: "Contract prestări servicii.pdf", date: "12 feb." },
                { name: "NDA_2025_TechWeb.pdf", date: "3 ian." },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border">
                  <span className="text-[10px] text-foreground truncate">{doc.name}</span>
                  <span className="text-[9px] text-muted-foreground shrink-0">{doc.date}</span>
                </div>
              ))}
            </div>
          </div>
        </BrowserWindowMock>
      </div>

      <div className="flex items-center gap-2 mt-4 text-card-foreground-muted transition-transform duration-500 ease-out group-hover:scale-105">
        <Star className="size-4 fill-current" />
        <span className="text-xs font-medium">Persoane fizice sau companii (CNP / CUI)</span>
      </div>
    </motion.div>
  );
}

function IntegrationsCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.3)}
      className="group bg-card-primary rounded-4xl p-6 md:p-8 flex flex-col min-h-64 overflow-hidden"
    >
      <div className="mb-4 transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-neutral-900/60 mb-2">
          Legislation Monitor
        </span>
        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 leading-tight mb-2">
          Legislație la zi
        </h3>
        <p className="text-neutral-700 text-sm">
          Filtrare pe topic și cod CAEN. Sumarizare AI. Frecvență la alegere.
        </p>
      </div>

      <div className="flex-1 min-h-0 mt-4 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <BrowserWindowMock url="app.contapp.ro/legislation" title="Legislație – ContApp" stretch>
          <div className="flex flex-col gap-2">
            {[
              { cat: "TVA", title: "Modificări TVA microîntreprinderi 2026", date: "18 feb.", urgent: true },
              { cat: "Salarii", title: "Salariu minim brut: 4.050 lei de la 1 ian.", date: "2 feb.", urgent: false },
              { cat: "e-Factura", title: "e-Factura obligatorie B2B din iulie 2025", date: "28 ian.", urgent: false },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-background/80 hover:border-accent/30 transition-colors">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 ${item.urgent ? "bg-red-500/15 text-red-600" : "bg-foreground/8 text-muted-foreground"}`}>
                  {item.cat}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-foreground leading-snug">{item.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </BrowserWindowMock>
      </div>

      <p className="mt-4 text-xs text-neutral-700 leading-relaxed transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        Monitorizăm live orice schimbare legislativă relevantă — când apare ceva nou, ești notificat instant.
      </p>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Group 2 — Ticketing + Chat (operațional)
 * ──────────────────────────────────────────────────────────────────────────── */

function TicketingCard(): ReactNode {
  const columns: { key: string; label: string; tone: string; tickets: { title: string; priority: "high" | "medium" | "low"; assignee: string }[] }[] = [
    {
      key: "todo",
      label: "De făcut",
      tone: "bg-foreground/5",
      tickets: [
        { title: "Verificare balanță Q1", priority: "high", assignee: "AP" },
        { title: "Onboarding client nou", priority: "medium", assignee: "MS" },
      ],
    },
    {
      key: "progress",
      label: "În progres",
      tone: "bg-amber-500/10",
      tickets: [
        { title: "Pregătire raport anual", priority: "high", assignee: "VI" },
      ],
    },
    {
      key: "done",
      label: "Gata",
      tone: "bg-accent/15",
      tickets: [
        { title: "Trimis declarație D100", priority: "medium", assignee: "AP" },
        { title: "Aprobat concediu Mara", priority: "low", assignee: "EM" },
      ],
    },
  ];

  const priorityBar: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-foreground/30",
  };

  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-secondary rounded-4xl p-6 md:p-8 overflow-hidden min-h-96 relative flex flex-col gap-5"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-card-foreground-muted mb-2">
          Ticketing Pro
        </span>
        <h3 className="text-2xl md:text-3xl font-medium text-card-foreground leading-tight mb-2">
          Sistem de ticketing pentru echipa ta
        </h3>
        <p className="text-card-foreground-muted text-sm max-w-md">
          Tickete cu asignare, claim, complete, refuse. Vezi cine ce face și
          ce e blocat — fără status meeting-uri lunare.
        </p>
      </div>

      <div className="flex-1 min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.01]">
        <BrowserWindowMock url="app.contapp.ro/ticketing" title="Ticketing – ContApp" stretch>
          <div className="grid grid-cols-3 gap-2 h-full min-h-0">
            {columns.map((col) => (
              <div
                key={col.key}
                className={`rounded-lg border border-border ${col.tone} flex flex-col min-h-0`}
              >
                <header className="px-2 py-1.5 border-b border-border flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-semibold text-foreground/80">{col.label}</span>
                  <span className="text-[9px] text-muted-foreground">{col.tickets.length}</span>
                </header>
                <div className="flex-1 min-h-0 p-1.5 space-y-1.5">
                  {col.tickets.map((t, i) => (
                    <article
                      key={i}
                      className="rounded-md bg-background border border-border p-2 space-y-1"
                    >
                      <div className="flex items-start gap-1.5">
                        <span className={`w-0.5 h-3 rounded-full ${priorityBar[t.priority]} mt-0.5 shrink-0`} />
                        <p className="text-[10px] font-medium text-foreground leading-snug flex-1">
                          {t.title}
                        </p>
                        <GripVertical className="w-2.5 h-2.5 text-muted-foreground shrink-0 opacity-50" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
                          {t.priority}
                        </span>
                        <span className="w-4 h-4 rounded-full bg-accent/20 text-[8px] font-semibold text-accent flex items-center justify-center">
                          {t.assignee}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </BrowserWindowMock>
      </div>

      <div className="flex items-center gap-2 text-card-foreground-muted transition-transform duration-500 ease-out group-hover:scale-105">
        <KanbanSquare className="size-4" />
        <span className="text-xs font-medium">
          Board, listă sau calendar — vezi cum vrei.
        </span>
      </div>
    </motion.div>
  );
}

function ChatBotCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.1)}
      className="group bg-card-primary rounded-4xl p-6 md:p-8 overflow-hidden min-h-96 flex flex-col gap-5"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-neutral-900/60 mb-2">
          Internal Chat + AI
        </span>
        <h3 className="text-2xl md:text-3xl font-medium text-neutral-900 leading-tight mb-2">
          @bot, fă-mi un ticket
        </h3>
        <p className="text-neutral-700 text-sm max-w-md">
          Mesagerie internă cu directe, grupuri și un bot care derivă tickete
          dintr-un mesaj — direct în Ticketing.
        </p>
      </div>

      <div className="flex-1 min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.01]">
        <BrowserWindowMock url="app.contapp.ro/chat" title="Chat intern – ContApp" stretch>
          <div className="flex flex-col gap-2">
            {/* Conversation header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-[9px] font-semibold text-foreground">MS</span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-foreground">Mara Stan</p>
                <p className="text-[9px] text-muted-foreground">Mesaj direct · online</p>
              </div>
              <span className="text-[9px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-foreground/8 text-muted-foreground">
                <Bot className="w-2.5 h-2.5" /> @bot
              </span>
            </div>
            {/* Messages */}
            <div className="space-y-2">
              <div className="flex gap-1.5 max-w-[85%]">
                <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 text-[8px] font-semibold text-foreground">
                  MS
                </div>
                <div className="rounded-lg bg-foreground/5 px-2.5 py-1.5">
                  <p className="text-[10px] text-foreground leading-snug">
                    @bot fă-mi un ticket pentru verificarea balanței la Tech Web SRL,
                    termen vineri.
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 max-w-[85%] ml-auto flex-row-reverse">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-background" strokeWidth={2} />
                </div>
                <div className="rounded-lg bg-accent/15 border border-accent/30 px-2.5 py-1.5">
                  <p className="text-[10px] text-foreground leading-snug">
                    Am identificat un ticket. Propun:
                  </p>
                  <div className="mt-1.5 rounded-md bg-background border border-border p-1.5">
                    <p className="text-[10px] font-medium text-foreground">
                      Verificare balanță Tech Web SRL
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Vineri
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        medium
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 max-w-[85%] ml-auto flex-row-reverse">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-background" strokeWidth={2} />
                </div>
                <div className="rounded-lg bg-accent/20 border border-accent/40 px-2.5 py-1.5 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                  <p className="text-[10px] text-foreground">
                    Am creat ticketul #314.
                  </p>
                </div>
              </div>
            </div>
            {/* Composer hint */}
            <div className="mt-1 px-2 py-1.5 border border-dashed border-border rounded-lg flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                Scrie un mesaj... sau @bot creează ticket
              </span>
            </div>
          </div>
        </BrowserWindowMock>
      </div>

      <div className="flex items-center gap-2 text-neutral-700 transition-transform duration-500 ease-out group-hover:scale-105">
        <Sparkles className="size-4" />
        <span className="text-xs font-medium">
          Necesită AI Assistant pentru bot.
        </span>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Group 3 — HR + AI Planner
 * ──────────────────────────────────────────────────────────────────────────── */

function HrCard(): ReactNode {
  const leaves: { name: string; type: string; range: string; status: "pending" | "approved" | "rejected"; initials: string }[] = [
    { name: "Mara Stan", type: "Odihnă", range: "12–18 mai", status: "approved", initials: "MS" },
    { name: "Victor Ionescu", type: "Medical", range: "3–4 mai", status: "approved", initials: "VI" },
    { name: "Elena Marin", type: "Sabatic", range: "15–30 iun.", status: "pending", initials: "EM" },
  ];

  const statusStyle: Record<string, string> = {
    approved: "bg-accent/15 text-accent",
    pending: "bg-amber-500/15 text-amber-600",
    rejected: "bg-red-500/15 text-red-600",
  };

  const statusLabel: Record<string, string> = {
    approved: "Aprobat",
    pending: "În așteptare",
    rejected: "Respins",
  };

  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-primary rounded-4xl p-6 md:p-8 overflow-hidden min-h-80 flex flex-col gap-5"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-neutral-900/60 mb-2">
          HR Pro
        </span>
        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 leading-tight mb-2">
          HR pentru echipa ta
        </h3>
        <p className="text-neutral-700 text-sm">
          Pontaj, concedii (odihnă, medical, sabatic, maternal), adeverințe și
          review-uri — toate într-un singur tab.
        </p>
      </div>

      <div className="flex-1 min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <BrowserWindowMock url="app.contapp.ro/hr" title="HR – ContApp" stretch>
          <div className="flex flex-col gap-2">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: Clock, label: "Total ore (luna)", value: "162h" },
                { icon: Sun, label: "În concediu azi", value: "2" },
                { icon: Briefcase, label: "Cereri noi", value: "3" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-2 rounded-lg bg-background border border-border flex items-center gap-1.5"
                >
                  <s.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-[11px] font-semibold text-foreground truncate">
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Leaves list */}
            <div className="rounded-lg border border-border overflow-hidden bg-background">
              <header className="px-2.5 py-1.5 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-semibold text-foreground inline-flex items-center gap-1">
                  <Sun className="w-3 h-3" /> Cereri concediu
                </span>
                <span className="text-[9px] text-muted-foreground">3 active</span>
              </header>
              <ul className="divide-y divide-border">
                {leaves.map((l) => (
                  <li
                    key={l.name}
                    className="px-2.5 py-1.5 flex items-center gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-foreground/8 flex items-center justify-center text-[8px] font-semibold text-foreground shrink-0">
                      {l.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">
                        {l.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {l.type} · {l.range}
                      </p>
                    </div>
                    <span
                      className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusStyle[l.status]}`}
                    >
                      {statusLabel[l.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BrowserWindowMock>
      </div>

      <p className="text-xs text-neutral-700 leading-relaxed transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        Aprobi o cerere și ajunge automat în calendarul echipei. Adeverințele
        de angajat și de venit se generează din câteva click-uri.
      </p>
    </motion.div>
  );
}

function AiPlannerCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.1)}
      className="group bg-card-secondary rounded-4xl p-6 md:p-8 overflow-hidden min-h-80 flex flex-col gap-5"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-card-foreground-muted mb-2">
          <Sparkles className="w-2.5 h-2.5" /> AI Assistant
        </span>
        <h3 className="text-xl md:text-2xl font-medium text-card-foreground leading-tight mb-2">
          Smart Planner cu AI
        </h3>
        <p className="text-card-foreground-muted text-sm">
          AI-ul tău își face singur agenda zilei: combină ticketele, evenimentele
          din calendar și solicitările care expiră.
        </p>
      </div>

      <div className="flex-1 min-h-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <BrowserWindowMock url="app.contapp.ro/planner-smart" title="Planner Smart – ContApp" stretch>
          <div className="flex flex-col gap-2">
            {/* AI banner */}
            <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/10 border border-accent/30">
              <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Plan generat AI
                </p>
                <p className="text-[10px] text-foreground leading-snug">
                  Bună dimineața, Andrei. Astăzi: 1) închide solicitarea
                  Tech Web (expiră), 2) verifică balanța Q1, 3) trimite minim
                  o ofertă până la 16:00.
                </p>
              </div>
            </div>
            {/* Focus list */}
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <header className="px-2.5 py-1.5 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-semibold text-foreground inline-flex items-center gap-1">
                  <Target className="w-3 h-3" /> Focus AI
                </span>
              </header>
              <ul className="divide-y divide-border">
                {[
                  {
                    icon: Send,
                    title: "Solicitare #314 expiră vineri",
                    type: "Contract",
                    tone: "text-amber-600",
                  },
                  {
                    icon: KanbanSquare,
                    title: "Verificare balanță Q1 — Tech Web",
                    type: "Ticket high",
                    tone: "text-red-600",
                  },
                  {
                    icon: AlertTriangle,
                    title: "Update legislativ TVA — necesită review",
                    type: "Legislație",
                    tone: "text-foreground",
                  },
                  {
                    icon: Calendar,
                    title: "Întâlnire cu Mihai Stoica · 14:30",
                    type: "Calendar",
                    tone: "text-foreground",
                  },
                ].map((item, i) => (
                  <li key={i} className="px-2.5 py-1.5 flex items-center gap-2">
                    <item.icon className={`w-3 h-3 shrink-0 ${item.tone}`} />
                    <p className="text-[10px] font-medium text-foreground leading-snug truncate flex-1">
                      {item.title}
                    </p>
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground shrink-0">
                      {item.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BrowserWindowMock>
      </div>

      <p className="text-xs text-card-foreground-muted leading-relaxed transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        AI-ul respectă concediile, deadline-urile și prioritățile — nu propune
        întâlniri când cineva e plecat.
      </p>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Section header (intro into the bento)
 * ──────────────────────────────────────────────────────────────────────────── */

function SectionHeader(): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mb-10 max-w-2xl"
    >
      <span className="inline-block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Modulele platformei
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
        Pachet de bază + extensii la alegere.
      </h2>
      <p className="mt-4 text-base text-muted-foreground leading-relaxed">
        Toate modulele sunt în același workspace. Activezi extensiile de care ai
        nevoie — contracte, ticketing, HR, chat intern, legislație, AI — și
        plătești doar pentru ele.
      </p>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Public component
 * ──────────────────────────────────────────────────────────────────────────── */

export function FeaturesBento(): ReactNode {
  return (
    <section
      id="functionalitati"
      className="w-full px-6 mb-32 bg-background scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeader />

        {/* Group 1 — Contracts Pro hero (existing layout) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4">
          <StepByStepCard />
          <DashboardCard />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TrustedByCard />
            <IntegrationsCard />
          </div>
        </div>

        {/* Group 2 — Ticketing + Internal Chat + AI */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
          <TicketingCard />
          <ChatBotCard />
        </div>

        {/* Group 3 — HR + AI Planner */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <HrCard />
          <AiPlannerCard />
        </div>
      </div>
    </section>
  );
}
