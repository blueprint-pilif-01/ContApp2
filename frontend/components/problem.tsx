import { motion } from "motion/react";
import { ArrowRight, FileText, Smartphone, FolderOpen, Clock, AlertTriangle, Search } from "lucide-react";
import type { ReactNode, ElementType } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

const pains: { icon: ElementType; title: string; desc: string }[] = [
  {
    icon: FileText,
    title: "Contracte și formulare în Word",
    desc: "Copiezi același șablon de fiecare dată, completezi manual, salvezi PDF, trimiți pe email.",
  },
  {
    icon: Smartphone,
    title: "Semnături pe WhatsApp",
    desc: "Clientul fotografiază contractul semnat cu telefonul și ți-l trimite pe WhatsApp sau Messenger.",
  },
  {
    icon: FolderOpen,
    title: "Dosare împrăștiate",
    desc: "Foldere cu nume ca «Contract_FINAL_v3_ok.docx» risipite între Drive, email, calculator și colegi.",
  },
  {
    icon: Clock,
    title: "Cereri de concediu pe email",
    desc: "Cereri pierdute în inbox, aprobări manuale, planificarea vacanțelor făcută într-un Excel partajat.",
  },
  {
    icon: AlertTriangle,
    title: "Legislație descoperită târziu",
    desc: "Afli de modificări fiscale, de muncă sau GDPR de la colegi sau clienți — uneori după ce termenul a trecut.",
  },
  {
    icon: Search,
    title: "Tickete pe post-it-uri și chat",
    desc: "Sarcini pierdute în Slack, WhatsApp sau pe hârtie. Nu vezi cine ce face și ce este urgent.",
  },
];

export function Problem(): ReactNode {
  return (
    <section className="w-full bg-background px-6 py-24">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 max-w-2xl"
        >
          <span className="inline-block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Înainte de ContApp
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-4">
            Sună cunoscut?
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Majoritatea echipelor — contabili, agenții, HR, birouri — lucrează cu un
            mix de Word, email, WhatsApp și foldere haotice. Funcționează — dar
            consumă ore întregi de muncă care s-ar putea face în minute.
          </p>
        </motion.div>

        {/* Pain grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map((pain, i) => {
            const Icon = pain.icon;
            return (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.5, ease, delay: i * 0.07 }}
                className="group flex gap-4 rounded-2xl border border-border bg-frame p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/8 mt-0.5">
                  <Icon className="h-4 w-4 text-foreground/50 group-hover:text-foreground/80 transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{pain.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pain.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Resolution line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl bg-accent/10 border border-accent/20 px-7 py-5"
        >
          <div>
            <p className="text-base font-semibold text-foreground">
              ContApp rezolvă tot asta — dintr-un singur loc.
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Clienți, contracte, tickete, HR, chat intern, legislație. Pachet
              de bază gratuit — adaugi extensiile de care ai nevoie.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              Configurează pachetul
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
