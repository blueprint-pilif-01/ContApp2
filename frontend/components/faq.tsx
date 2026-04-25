import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

const faqs = [
  {
    question: "Pot începe gratuit fără card bancar?",
    answer:
      "Da. Planul Free nu necesită card. Poți crea șabloane, trimite invitații de semnare și primi PDF-uri fără nicio plată. Upgrade-ul se face doar când ai nevoie de volum mai mare sau funcții avansate (clienți, rapoarte, alerte).",
  },
  {
    question: "Cum funcționează semnarea? Are nevoie clientul de cont?",
    answer:
      "Nu. Generezi un link public de semnare și îl trimiți pe email, WhatsApp sau orice alt canal. Clientul tău deschide link-ul, completează câmpurile și semnează direct din browser — fără cont, fără aplicație. Primești notificare și PDF automat imediat după.",
  },
  {
    question: "Ce se întâmplă când ating limita planului?",
    answer:
      "Vei vedea în dashboard consumul curent față de limita planului (ex: 4/5 semnări). Când atingi limita, funcțiile afectate sunt blocate cu mesaj explicit de upgrade. Nu ești debitat automat. Poți face upgrade oricând din Settings → Abonament.",
  },
  {
    question: "Pot schimba planul? Există penalități?",
    answer:
      "Poți face upgrade sau downgrade oricând, fără penalități. Schimbările se aplică imediat pentru upgrade și la sfârșitul perioadei curente pentru downgrade. Plățile sunt gestionate prin Stripe — poți modifica sau anula din Billing Portal fără să contactezi suportul.",
  },
  {
    question: "Exporturile CSV sunt incluse? În ce plan?",
    answer:
      "Exportul CSV este disponibil din planul Starter. Poți filtra pe perioadă, client sau status și exporta instant. Planul Free nu include rapoarte sau export.",
  },
  {
    question: "Ce include Pro față de Starter? Ce sunt \"dosarele de client\"?",
    answer:
      "Pro adaugă dosare per client: poți atașa documente (contracte, acte, situații) la profilul clientului. De asemenea, poți atașa documente direct la contracte. Starter include clienți și date de contact, dar fără stocare de documente. Pro include și limite mai mari (200 clienți, 100 semnări/lună).",
  },
  {
    question: "Pentru câți clienți e potrivit ContApp?",
    answer:
      "Free: fără gestionare clienți. Starter: până la 50 clienți. Pro: până la 200. Business: nelimitat. Dacă ai un cabinet mic (10-30 clienți), Starter acoperă tot fluxul. Pro e recomandat dacă ai dosare complexe sau peste 50 de clienți activi.",
  },
  {
    question: "Există plan anual? Sunt reduceri?",
    answer:
      "Da, planurile anuale vor fi disponibile cu reducere față de plata lunară. Detaliile exacte vor fi anunțate la lansare. Dacă ești interesat de acces early cu discount, înscrie-te la waitlist.",
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
      className="cursor-pointer rounded-2xl bg-frame p-5 shadow-sm sm:p-6"
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
      <div className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-base font-medium text-foreground sm:text-lg">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease }}
          className="shrink-0"
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full px-6 py-20 sm:py-28">
      <span id="securitate" className="block scroll-mt-24" aria-hidden="true" />
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 sm:mb-16"
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

        <div className="flex flex-col gap-3" role="list">
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
