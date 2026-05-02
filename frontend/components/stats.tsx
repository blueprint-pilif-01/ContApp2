import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ConnectedDots } from "./connected-dots";

const ease = [0.23, 1, 0.32, 1] as const;

const comparisons = [
  {
    label: "Contract nou pentru un client (persoană sau firmă) — de la șablon până la semnătură primită",
    before: { label: "~45 min", pct: 100 },
    after:  { label: "4 min",   pct: 9   },
  },
  {
    label: "Vezi cine din echipă lucrează la ce și ce e blocat (în loc de status meeting-uri)",
    before: { label: "~30 min", pct: 100 },
    after:  { label: "5 sec",   pct: 1   },
  },
  {
    label: "Aprobi o cerere de concediu și o pui automat în calendarul echipei",
    before: { label: "~15 min", pct: 100 },
    after:  { label: "10 sec",  pct: 1   },
  },
  {
    label: "Afli când apare o modificare legislativă importantă pentru afacerea ta",
    before: { label: "zile întregi", pct: 100 },
    after:  { label: "instant",  pct: 2 },
  },
];

function Bar({
  pct,
  accent,
  label,
  delay,
}: {
  pct: number;
  accent: boolean;
  label: string;
  delay: number;
}): ReactNode {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-7 rounded-full bg-foreground/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease, delay }}
          className={`h-full rounded-full ${accent ? "bg-accent" : "bg-foreground/20"}`}
        />
      </div>
      <span className={`text-sm font-semibold w-24 shrink-0 text-right ${accent ? "text-accent" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

export function Stats(): ReactNode {
  return (
    <section className="w-full bg-background px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="relative overflow-hidden rounded-3xl bg-frame border border-border px-8 py-12 sm:px-14 sm:py-14"
        >
          {/* Ambient network — full-bleed background layer */}
          <div
            className="pointer-events-none absolute inset-0 text-accent/14 dark:text-accent/20 max-[850px]:hidden"
            aria-hidden="true"
          >
            <ConnectedDots variant="scatter" />
          </div>

          {/* Header */}
          <div className="relative mb-10">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Eficiență</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground leading-snug">
              Cât timp economisești<br className="hidden sm:block" /> cu ContApp?
            </h2>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-foreground/20" />
              <span className="text-xs text-muted-foreground">Înainte</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Cu ContApp</span>
            </div>
          </div>

          {/* Comparison rows */}
          <div className="flex flex-col gap-7">
            {comparisons.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                className="flex flex-col gap-2"
              >
                <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
                <Bar pct={c.before.pct} accent={false} label={c.before.label} delay={0.2 + i * 0.1} />
                <Bar pct={c.after.pct}  accent={true}  label={c.after.label}  delay={0.35 + i * 0.1} />
              </motion.div>
            ))}
          </div>

          {/* Bottom callout */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 pt-8 border-t border-border flex flex-wrap items-center gap-8"
          >
            {[
              { value: "−80%", label: "timp pe administrare lunară" },
              { value: "0",    label: "Excel-uri partajate cu echipa" },
              { value: "∞",    label: "documente, tickete, mesaje stocate" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-accent">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
