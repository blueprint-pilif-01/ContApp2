import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { FileText, Link as LinkIcon, FileCheck, Users, Bell } from "lucide-react";
import type { ReactNode } from "react";

const steps = [
  {
    icon: Users,
    title: "Îți creezi organizația și inviti echipa",
    description:
      "Pornești cu pachetul de bază gratuit. Adaugi colegi, le asignezi roluri (organisation admin, manager, employee, viewer) și categorii.",
  },
  {
    icon: LinkIcon,
    title: "Activezi extensiile de care ai nevoie",
    description:
      "Din pagina de prețuri sau din admin alegi exact ce module vrei: contracte, ticketing, HR, chat, legislație, AI. Plătești doar pentru ce activezi.",
  },
  {
    icon: FileText,
    title: "Configurezi modulele activate",
    description:
      "Creezi șabloane de contract, definești ticketele inițiale, înregistrezi pontajul. ContApp se mulează pe procesul tău existent.",
  },
  {
    icon: FileCheck,
    title: "Echipa lucrează dintr-un singur loc",
    description:
      "Clienți, contracte semnate, tickete, concedii, chat intern și update-uri legislative — toate într-un workspace cu acces controlat.",
  },
  {
    icon: Bell,
    title: "Scalezi și ajustezi când vrei",
    description:
      "Crește banda de angajați când recrutezi. Activezi noi extensii când ai nevoie. Dezactivezi pe cele neutilizate. Datele rămân.",
  },
];

function StepItem({
  step,
  isLast,
}: {
  step: (typeof steps)[0];
  isLast: boolean;
}): ReactNode {
  const Icon = step.icon;

  return (
    <div className={`relative flex gap-5 ${isLast ? "" : "pb-44"}`}>
      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent" aria-hidden="true">
        <Icon className="h-5 w-5 text-black" strokeWidth={2} />
      </div>

      <div className="pt-1">
        <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
          {step.title}
        </h3>
        <p className="mt-2 max-w-sm text-base leading-relaxed text-foreground/60">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorks(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.3", "end 0.7"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-background"
    >
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-48 lg:h-fit lg:self-start">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl scroll-mt-24" id="cum-functioneaza">
            Cum configurezi
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/60">
            Pornești cu pachetul de bază, alegi extensiile,{" "}
            <span className="font-medium text-foreground">scalezi când vrei.</span>
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <a
              href="#pricing"
              className="mt-8 inline-flex items-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Configurează pachetul
            </a>
          </motion.div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-6 h-[calc(100%-7rem)] w-0.5 -translate-x-1/2 bg-foreground/10" aria-hidden="true">
            <motion.div
              style={{ height: lineHeight, willChange: "height" }}
              className="w-full bg-accent"
            />
          </div>

          <ol className="relative list-none p-0 m-0">
            {steps.map((step, index) => (
              <li key={step.title}>
                <StepItem
                  step={step}
                  isLast={index === steps.length - 1}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
