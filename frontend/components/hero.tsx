import { Link } from "react-router-dom";
import { ArrowDownRight, Check } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type ReactNode, type MouseEvent } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

const PARALLAX_INTENSITY = 20;

export function Hero(): ReactNode {
  const sectionRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;

    if (window.innerWidth < 850) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(offsetX * PARALLAX_INTENSITY);
    mouseY.set(offsetY * PARALLAX_INTENSITY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      className="flex flex-col relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0 min-[850px]:inset-2.5 -z-10 rounded-br-4xl rounded-bl-4xl min-[850px]:scale-105 overflow-hidden border border-border/50 min-[850px]:border-border/60 min-[850px]:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_6px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.06)] dark:min-[850px]:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_6px_rgba(0,0,0,0.2),0_16px_32px_rgba(0,0,0,0.15)]"
        style={{ x, y }}
        aria-hidden="true"
      >
        {/* Same gradient as footer CTA */}
        <div className="absolute inset-0 bg-[linear-gradient(160deg,_#f0fdf4_0%,_#dcfce7_25%,_#bbf7d0_50%,_#86efac_75%,_#a8d946_100%)] dark:bg-[linear-gradient(145deg,_#0f1410_0%,_#152015_30%,_#1a2e1a_55%,_#1e3d1e_80%,_#243d10_100%)]" aria-hidden="true" />
        {/* Blobs - same opacities as footer, scaled for larger area */}
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent/45 dark:bg-accent/30 blur-[80px]" aria-hidden="true" />
        <div className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full bg-accent/40 dark:bg-accent/25 blur-[70px]" aria-hidden="true" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-accent/35 dark:bg-accent/22 blur-[60px]" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-accent/30 dark:bg-accent/18 blur-[70px]" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-accent/32 dark:bg-accent/20 blur-[70px]" aria-hidden="true" />
        <div className="absolute top-24 right-1/3 w-72 h-72 rounded-full bg-accent/28 dark:bg-accent/16 blur-[50px]" aria-hidden="true" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-accent/25 dark:bg-accent/15 blur-[55px]" aria-hidden="true" />

        {/* Grid pattern - same as footer */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />
      </motion.div>

      <div className="flex items-start justify-center px-6 pt-64 max-[850px]:pt-32">
        <motion.div
          className="flex flex-col items-center max-[850px]:items-start text-center max-[850px]:text-left max-w-4xl max-[850px]:w-full"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-1.5 pl-4 pr-3 py-1.5 rounded-xl border border-border bg-frame text-foreground text-sm font-medium mb-6"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Contracte, clienți, termene
          </motion.div>

          <h1 className="text-8xl max-[850px]:text-5xl font-medium tracking-tight leading-[1.1] mb-6 text-foreground">
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              Hub-ul de lucru
            </motion.span>
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              pentru <span className="italic font-serif text-accent">contabili.</span>
            </motion.span>
          </h1>

          <motion.p
            className="text-lg text-muted-foreground mb-4 max-w-xl"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Contracte, clienți, facturi, termene și rapoarte. Semnare prin link, alerte automate, export rapid.
          </motion.p>

          <motion.ul
            className="text-sm text-muted-foreground mb-8 space-y-1.5 text-left"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={2.5} /> Generezi contracte și colectezi semnături prin link public.</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={2.5} /> Nu ratezi termene: alerte în aplicație și email.</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 shrink-0" strokeWidth={2.5} /> Ai vizibilitate pe clienți: dosar, documente, istoricul activității.</li>
          </motion.ul>

          <motion.div
            className="flex items-center gap-3 flex-wrap max-[850px]:flex-col max-[850px]:w-full"
            variants={fadeInScale}
            transition={{ duration: 0.8, ease }}
          >
            <Link
              to="/auth/register"
              className="group relative inline-flex items-center max-[850px]:w-full"
            >
              <span className="absolute right-0 inset-y-0 w-[calc(100%-1.5rem)] max-[850px]:w-full rounded-xl bg-accent" />
              <span className="relative z-10 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium whitespace-nowrap max-[850px]:flex-1">Începe gratuit</span>
              <span className="relative -left-px z-10 w-10 h-10 rounded-xl flex items-center justify-center text-black">
                <ArrowDownRight className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </Link>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors max-[850px]:text-center">
              Vezi planurile →
            </a>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground mt-4"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Fără card pentru Free. · Upgrade sau downgrade oricând.
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className="relative px-6 mt-24 max-[850px]:mt-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease }}
      >
        <div className="relative max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden border border-border shadow-2xl/5 mask-[linear-gradient(to_bottom,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]"
          >
            <img
              src="/dashboardmock.png"
              alt="Dashboard preview"
              className="w-full h-auto invert dark:invert-0 dark:contrast-100 contrast-125"
            />
          </div>
        </div>
      </motion.div>

      {/* <motion.div
        className="pt-24 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1, ease }}
      >
        <LogoLoop logos={logos} speed={60} logoHeight={42} gap={124} />
      </motion.div> */}
    </section>
  );
}
