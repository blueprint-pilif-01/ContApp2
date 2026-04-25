import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { FileText, Link as LinkIcon, FileCheck, Users, Bell } from "lucide-react";
import type { ReactNode } from "react";

const steps = [
  {
    icon: FileText,
    title: "Creezi un șablon de contract",
    description:
      "Adaugi variabilele (nume client, dată, valoare) o singură dată. Șablonul rămâne salvat pentru utilizare repetată.",
  },
  {
    icon: Users,
    title: "Adaugi profilul clientului",
    description:
      "Creezi dosarul clientului (PFA/SRL/PF) cu datele de contact și fiscale. Toate contractele lui vor fi legate automat de acest profil.",
  },
  {
    icon: LinkIcon,
    title: "Generezi link de semnare și trimiți",
    description:
      "Cu un click generezi o invitație de semnare personalizată pentru client. Acesta semnează fără cont, direct din browser.",
  },
  {
    icon: FileCheck,
    title: "Primești submission + PDF automat",
    description:
      "Imediat după semnare primești notificare și PDF-ul contractului generat automat. Statusul se actualizează în dashboard.",
  },
  {
    icon: Bell,
    title: "Fii mereu în control",
    description:
      "Setezi date limită pentru declarații, plăți și reînnoiri. ContApp te avertizează din timp, fără să mai urmărești nimic manual.",
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
            Cum funcționează
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/60">
            De la șablon la contract semnat și dosar de client,{" "}
            <span className="font-medium text-foreground">totul în câțiva pași.</span>
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/auth/register"
              className="mt-8 inline-flex items-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Creează cont gratuit
            </Link>
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
