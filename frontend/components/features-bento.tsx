import { motion, type Transition } from "motion/react";
import { CircleCheck, Star, FileCheck, FileText, Send, Users } from "lucide-react";
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

function StepByStepCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-primary rounded-4xl p-6 md:p-6 overflow-hidden min-h-140 md:row-span-2 flex flex-col"
    >
      <div className="relative z-10 mb-4 transition-transform duration-500 ease-out group-hover:scale-105">
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
              <span className="text-[10px] bg-accent text-black px-2 py-1 rounded font-medium">Salvează</span>
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
        <h3 className="text-2xl md:text-3xl font-medium text-card-foreground leading-tight mb-1">
          Profil Client
        </h3>
        <p className="text-card-foreground-muted text-sm">
          Dosar complet + documente atașate
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
                { label: "Sarcini", value: "2" },
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
        <span className="text-xs font-medium">PFA · SRL · PF cu CUI și date de contact</span>
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
        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 leading-tight mb-2">
          Legislație la zi
        </h3>
        <p className="text-neutral-700 text-sm">
          Notificări automate când apare ceva relevant. Fără să pierzi nimic important.
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

export function FeaturesBento(): ReactNode {
  return (
    <section id="functionalitati" className="w-full px-6 mb-32 bg-background scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4">
          <StepByStepCard />
          <DashboardCard />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TrustedByCard />
            <IntegrationsCard />
          </div>
        </div>
      </div>
    </section>
  );
}
