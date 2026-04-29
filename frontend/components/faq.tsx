import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

const faqs = [
  {
    question: "Cum funcționează prețurile pe extensii?",
    answer:
      "Pachetul de bază este gratuit (dashboard, notebook, planner, documente, useri, roluri, categorii angajați) — pentru maxim 10 angajați. Adaugi doar extensiile de care ai nevoie (Contracts Pro, Ticketing Pro, HR Pro, Internal Chat, Legislation Monitor, AI Assistant) și plătești în funcție de banda de angajați. Nu cumperi pachete fixe cu funcții pe care nu le folosești.",
  },
  {
    question: "Pentru cine este ContApp?",
    answer:
      "Pentru orice echipă mică sau medie care vrea un workspace unitar: contabili, birouri de avocatură, agenții de servicii, HR-uri interne, consultanți, distribuitori, lanțuri mici. Configurezi extensiile în funcție de domeniul tău — un cabinet contabil va activa Contracts Pro + Legislation Monitor, un departament HR va activa HR Pro + Internal Chat, o agenție va activa Ticketing Pro + Internal Chat etc.",
  },
  {
    question: "Pot începe gratuit fără card bancar?",
    answer:
      "Da. Pachetul de bază nu necesită card. Primești dashboard, notebook, notițe personale și partajate, planner simplu, documente, useri + roluri și categorii de angajați. Plătești doar când activezi prima extensie.",
  },
  {
    question: "Cum funcționează semnarea contractelor?",
    answer:
      "Cu extensia Contracts Pro activă: generezi un link public de semnare și îl trimiți pe email, WhatsApp sau orice canal. Clientul tău (persoană fizică sau companie) deschide link-ul, completează câmpurile dinamice și semnează direct din browser — fără cont, fără aplicație. Primești PDF semnat automat în dosarul clientului.",
  },
  {
    question: "Cum funcționează benzile de angajați?",
    answer:
      "Există 5 benzi: 1–10 (banda de bază, fără cost suplimentar), 11–20, 21–30, 31–50 și 51+ (custom). Fiecare bandă aplică un multiplicator pe prețul fiecărei extensii și o taxă de capacitate suplimentară. Banda 51+ este personalizată — te contactăm cu o ofertă dedicată.",
  },
  {
    question: "Pot activa/dezactiva extensii oricând?",
    answer:
      "Da. Din panoul de admin al organizației poți activa sau dezactiva orice extensie. Modificările intră în vigoare imediat și sunt facturate pro-rata. Dezactivarea unei extensii nu șterge datele — rămân disponibile dacă reactivezi extensia mai târziu.",
  },
  {
    question: "Ce este AI Assistant și cum se facturează?",
    answer:
      "AI Assistant este un add-on care activează capabilități AI peste celelalte module: derivare tickete din chat, sumarizare legislație, digest pe topic, smart planner zilnic. Se facturează separat (credite AI) — uzajul este urmărit independent de extensiile principale, ca să poți controla costurile.",
  },
  {
    question: "Cine este platform admin? Eu pot administra organizația mea?",
    answer:
      "Sunt două nivele. Platform admin (super-admin) administrează platforma ContApp global — vede toate organizațiile. Tu (organisation admin / business owner) administrezi doar organizația ta: useri, roluri, categorii angajați, abonament, extensii. Nu vezi datele altor organizații.",
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease, delay: index * 0.05 }}
      onClick={onToggle}
      className="cursor-pointer rounded-2xl bg-frame p-5 shadow-sm sm:p-6 flex flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isOpen}
    >
      {/* Înălțime minimă comună ca rândurile cu titluri pe 1 vs 2 linii să pară echilibrate */}
      <div className="flex w-full items-start justify-between gap-3 sm:gap-4 text-left min-h-[5.75rem] sm:min-h-[6.25rem] lg:min-h-[7rem]">
        <span className="text-base font-medium text-foreground sm:text-lg flex-1 min-w-0 pr-2 leading-snug">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease }}
          className="shrink-0 pt-0.5"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ(): ReactNode {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full px-6 py-20 sm:py-28">
      <span id="securitate" className="block scroll-mt-24" aria-hidden="true" />
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 sm:mb-14 max-w-3xl"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Întrebări frecvente
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl scroll-mt-24" id="faq">
            Răspunsuri la întrebările frecvente
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Nu găsești răspunsul? Scrie-ne la{" "}
            <a href="mailto:hello@contapp.ro" className="underline hover:text-foreground transition-colors">
              hello@contapp.ro
            </a>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth/register"
                className="inline-flex items-center rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Creează cont
              </Link>
            </motion.div>
            <motion.a
              href="mailto:hello@contapp.ro"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-xl border border-border bg-frame px-6 py-2.5 text-sm font-semibold text-foreground transition-colors"
            >
              Contact
            </motion.a>
          </div>
        </motion.div>

        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:items-start"
          role="list"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
