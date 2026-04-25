/**
 * ============================================================================
 * SITE CONFIGURATION - ContApp
 * ============================================================================
 */

export const siteConfig = {
  // Brand
  name: "ContApp",
  tagline: "Hub-ul de lucru pentru contabili.",
  description: "Contracte, clienți, facturi, termene și rapoarte. Semnare prin link, alerte automate, export rapid.",

  // URLs
  url: "https://contapp.ro",
  twitter: "@contapp_ro",

  // Navigation
  nav: {
    cta: {
      text: "Începe gratuit",
      href: "#",
    },
    signIn: {
      text: "Autentificare",
      href: "#",
    },
  },
};

export const heroConfig = {
  badge: "Contracte, clienți, termene",
  headline: {
    line1: "Tot ce face",
    line2: "un contabil zilnic,",
    accent: "într-o singură aplicație.",
  },
  subheadline: "Contracte și semnături, clienți, facturi, cheltuieli, termene fiscale și rapoarte. Control pe limite, alerte, exporturi. Upgrade când ai nevoie.",
  cta: {
    text: "Începe gratuit",
    href: "#",
  },
};

export const blurHeadlineConfig = {
  text: "Contabilii care folosesc ContApp elimină împrăștierea în fișiere, WhatsApp, mailuri și foldere. Contractele, clienții, termenele și rapoartele sunt într-un singur loc — cu status clar, alerte automate și export rapid.",
};

export const testimonialsConfig = {
  title: "Construit pentru fluxuri reale de cabinet",
  autoplayInterval: 10000,
};

export const howItWorksConfig = {
  title: "Cum funcționează",
  description: "De la șablon la contract semnat și dosar de client, totul în câțiva pași.",
  cta: {
    text: "Creează cont gratuit",
    href: "#",
  },
};

export const pricingConfig = {
  title: "Planuri cu limite clare",
  description: "Upgrade doar când ai nevoie de volum sau funcții avansate. Fără angajamente pe termen lung.",
  billingNote: "Facturat anual",
};

export const faqConfig = {
  title: "Răspunsuri la întrebările frecvente",
  description: "Nu găsești răspunsul? Scrie-ne la hello@contapp.ro",
  cta: {
    primary: {
      text: "Creează cont",
      href: "#",
    },
    secondary: {
      text: "Contact",
      href: "mailto:hello@contapp.ro",
    },
  },
};

export const footerConfig = {
  cta: {
    headline: "Începe cu Free și fă upgrade când ai nevoie.",
    placeholder: "Adresa ta de email",
    button: "Creează cont",
  },
  copyright: `© ${new Date().getFullYear()} ContApp. Toate drepturile rezervate.`,
};

/**
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 */

export const features = {
  smoothScroll: true,
  testimonialAutoplay: true,
  parallaxHero: true,
  blurInHeadline: true,
};

/**
 * ============================================================================
 * THEME CONFIGURATION
 * ============================================================================
 */

export const themeConfig = {
  defaultTheme: "system" as "light" | "dark" | "system",
  enableSystemTheme: true,
};
