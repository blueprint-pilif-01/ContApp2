import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";

const freePlan = {
  features: ["3 șabloane", "5 solicitări / lună", "Semnătură digitală", "PDF automat", "Carnețel de notițe și to-do list digital"],
};

const mainPlans = [
  {
    name: "Starter",
    price: 29,
    description: "Pentru contabili care gestionează primii clienți și contracte.",
    features: [
      "10 șabloane de contract",
      "30 solicitări de semnare / lună",
      "50 clienți (PFA/SRL/PF)",
      "Dosar digital per client",
      "Note & sarcini",
      "Tot ce include Free",
    ],
    cta: "Alege Starter",
    popular: false,
  },
  {
    name: "Pro",
    price: 69,
    description: "Pentru cabinete cu volum mediu și gestionare completă a clienților.",
    features: [
      "Șabloane nelimitate",
      "100 solicitări de semnare / lună",
      "200 clienți",
      "Dosar client + upload documente",
      "Semnătură salvată contabil",
      "Tot ce include Starter",
    ],
    cta: "Alege Pro",
    popular: true,
  },
  {
    name: "Business",
    price: 149,
    description: "Pentru cabinete mari cu monitorizare legislativă și volum ridicat.",
    features: [
      "Șabloane nelimitate",
      "500 solicitări de semnare / lună",
      "Clienți nelimitați",
      "Monitorizare legislativă activă",
      "Notificări instant + digest email",
      "Tot ce include Pro",
    ],
    cta: "Alege Business",
    popular: false,
  },
];

const enterpriseFeatures = [
  "Volume personalizate",
  "SLA dedicat",
  "Onboarding asistat",
  "Integrări API custom",
  "Account manager dedicat",
  "Factură fiscală + suport prioritar",
];

const ease = [0.23, 1, 0.32, 1] as const;

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof mainPlans)[0];
  index: number;
}): ReactNode {
  const isPopular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease, delay: index * 0.08 }}
      className={`relative flex flex-col ${isPopular ? "pt-3.5" : ""}`}
    >
      {isPopular && (
        <div className="absolute -inset-px rounded-[1.15em] bg-accent" aria-hidden="true" />
      )}
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <span className="inline-block rounded-full bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">
            Cel mai ales
          </span>
        </div>
      )}

      <div
        className={`relative flex flex-1 flex-col rounded-2xl bg-frame p-6 sm:p-7 ${
          isPopular ? "" : "border border-border"
        }`}
      >

        <div>
          <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">{plan.description}</p>
        </div>

        <div className="mt-5 flex items-end gap-1.5">
          <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price} lei</span>
          <span className="mb-1 text-sm text-muted-foreground">/lună</span>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/auth/register"
            className={`mt-5 w-full rounded-xl py-3 text-sm font-semibold transition-colors text-center block ${
              isPopular
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {plan.cta}
          </Link>
        </motion.div>

        <div className="mt-6 pt-6 border-t border-border/60">
          <ul className="space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-foreground mt-0.5" strokeWidth={2.5} />
                <span className="text-sm text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing(): ReactNode {
  return (
    <section id="pricing" className="w-full bg-background px-6 py-20 sm:py-28 scroll-mt-24">
      <div className="mx-auto max-w-5xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 sm:mb-12"
        >
          <span className="text-sm font-medium text-muted-foreground">Prețuri</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Planuri cu limite clare
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Upgrade doar când ai nevoie de volum sau funcții avansate. Fără angajamente pe termen lung.
          </p>
        </motion.div>

        {/* Free strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mb-5 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-frame px-7 py-6 max-[640px]:flex-col"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-foreground">Planul Free</h3>
              <span className="text-sm text-muted-foreground">— 0 lei, fără card, fără angajament</span>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
              {freePlan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-sm text-foreground/70">
                  <Check className="w-3.5 h-3.5 shrink-0 text-foreground/40" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/auth/register"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-background border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              Începe gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* 3 paid plans */}
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {mainPlans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        {/* Enterprise band */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease, delay: 0.2 }}
          className="mt-5 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-frame px-7 py-6 max-[640px]:flex-col"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-foreground">Enterprise</h3>
              <span className="text-sm text-muted-foreground">— Soluție personalizată pentru firme mari</span>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
              {enterpriseFeatures.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-sm text-foreground/70">
                  <Check className="w-3.5 h-3.5 shrink-0 text-foreground/40" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <motion.a
            href="mailto:hello@contapp.ro"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors whitespace-nowrap"
          >
            Contactează-ne
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          Toate planurile plătite sunt procesate prin Stripe. Poți anula oricând din Billing Portal.
        </motion.p>
      </div>
    </section>
  );
}
