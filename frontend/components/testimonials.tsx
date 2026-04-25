import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, type ReactNode } from "react";

const testimonials = [
  {
    quote:
      "Un cabinet bine organizat nu mai pierde timp căutând contracte sau urmărind termene manual. Totul trebuie să fie în același loc, accesibil instant.",
    name: "Principiu de eficiență",
    title: "Flux de cabinet · Contracte & Termene",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    color: "#a8d946",
    company: "Contracte",
  },
  {
    quote:
      "Semnarea digitală nu înseamnă mai puțin legal — înseamnă mai puțin timp pierdut cu printare, scanare și urmăriri pe email pentru fiecare client.",
    name: "Principiu de digitalizare",
    title: "Flux de cabinet · Semnături Digitale",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    color: "#a8d946",
    company: "Semnături",
  },
  {
    quote:
      "Când știi exact câți clienți ai, ce termene au și ce contracte sunt în așteptare, poți planifica luna fără surprize. Asta e controlul real.",
    name: "Principiu de vizibilitate",
    title: "Flux de cabinet · Clienți & Calendar",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    color: "#a8d946",
    company: "Clienți",
  },
  {
    quote:
      "Raportul lunar nu ar trebui să dureze ore. Export CSV cu un click, filtrat pe client sau perioadă — asta înseamnă timp câștigat pentru munca reală.",
    name: "Principiu de raportare",
    title: "Flux de cabinet · Rapoarte & Export",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    color: "#a8d946",
    company: "Rapoarte",
  },
];

const companies = [
  { name: "Contracte", logo: "/mock-logos/commandr.svg" },
  { name: "Semnături", logo: "/mock-logos/interlock.svg" },
  { name: "Clienți", logo: "/mock-logos/focalpoint.svg" },
  { name: "Rapoarte", logo: "/mock-logos/acmecorp.svg" },
];

export function Testimonials(): ReactNode {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full bg-frame border-t border-b border-accent/15 px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16 text-4xl leading-tight font-medium text-neutral-900 sm:text-5xl lg:mb-20 lg:text-6xl dark:text-neutral-50"
        >
          Construit pentru fluxuri reale de cabinet
        </motion.h2>

        <div className="mb-16 grid gap-8 lg:mb-20 lg:grid-cols-2 lg:gap-12">
          <div className="flex items-center justify-start gap-4 lg:gap-6" role="tablist" aria-label="Testimonials">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: activeIndex === index ? 1.1 : 0.9,
                  opacity: activeIndex === index ? 1 : 0.6,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
                role="tab"
                aria-selected={activeIndex === index}
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full transition-colors duration-500 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
                  style={{
                    backgroundColor:
                      activeIndex === index ? testimonial.color : undefined,
                  }}
                >
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-8 w-8 rounded-full object-cover grayscale sm:h-12 sm:w-12 lg:h-16 lg:w-16"
                  />
                </div>

                {activeIndex === index && (
                  <svg
                    className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      opacity="0.2"
                    />
                    <motion.circle
                      key={`progress-${activeIndex}`}
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 10, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col justify-center" role="tabpanel" aria-live="polite">
            <AnimatePresence mode="wait">
              {testimonials[activeIndex] && (
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <blockquote className="mb-6 text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">
                    &ldquo;{testimonials[activeIndex].quote}&rdquo;
                  </blockquote>
                  <div className="text-base font-medium text-neutral-900 sm:text-lg dark:text-neutral-100">
                    {testimonials[activeIndex].name},{" "}
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {testimonials[activeIndex].title}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 lg:gap-8">
          {companies.map((company, index) => {
            const isActive = testimonials[activeIndex]?.company === company.name;
            return (
              <motion.div
                key={company.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                className="flex items-center"
              >
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className={`h-8 w-auto object-contain brightness-0 transition-all duration-300 sm:h-10 dark:invert ${
                    isActive
                      ? "opacity-100 dark:opacity-100"
                      : "opacity-30 hover:opacity-60 dark:opacity-20 dark:hover:opacity-50"
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
