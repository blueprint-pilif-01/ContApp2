/**
 * ============================================================================
 * SITE CONFIGURATION - ContApp
 * ============================================================================
 */

export const siteConfig = {
  // Brand
  name: "ContApp",
  tagline: "Workspace-ul echipei tale.",
  description:
    "Clienți, contracte, ticketing, HR, chat intern, legislație și planner AI — într-un singur workspace. Plătești doar ce folosești.",

  // URLs
  url: "https://contapp.ro",
  twitter: "@contapp_ro",

  // Navigation
  nav: {
    cta: {
      text: "Solicită ofertă",
      href: "#pricing",
    },
    signIn: {
      text: "Autentificare",
      href: "/login",
    },
  },
};

export const heroConfig = {
  badge: "Pentru contabili, HR, agenții și SME-uri",
  headline: {
    line1: "Workspace-ul",
    line2: "pentru afacerea ta,",
    accent: "configurat după nevoile tale.",
  },
  subheadline:
    "Pachet de bază gratuit + extensii plătite la alegere: contracte, ticketing, HR, chat intern, legislație, AI. Fără obligații pe modulele de care nu ai nevoie.",
  cta: {
    text: "Solicită ofertă personalizată",
    href: "#pricing",
  },
};

export const blurHeadlineConfig = {
  text:
    "Echipele care folosesc ContApp scapă de haosul în Excel, WhatsApp, mailuri și foldere. Clienții, contractele, ticketele, concediile și legislația sunt într-un singur loc — cu status clar, alerte automate și acces controlat.",
};

export const testimonialsConfig = {
  title: "Construit pentru fluxuri reale de business",
  autoplayInterval: 10000,
};

export const howItWorksConfig = {
  title: "Cum configurezi ContApp",
  description:
    "Pornești cu pachetul de bază gratuit, alegi extensiile de care ai nevoie, scalezi pe măsură ce echipa crește.",
  cta: {
    text: "Configurează acum",
    href: "#pricing",
  },
};

export const pricingConfig = {
  title: "Plătești doar ce folosești",
  description:
    "Pachetul de bază este gratuit. Adaugă doar extensiile de care ai nevoie și plătește în funcție de numărul de angajați. Fără pachete fixe, fără funcții pentru care nu plătești.",
  billingNote: "Facturat lunar · anulezi oricând",
};

export const faqConfig = {
  title: "Întrebări frecvente",
  description: "Nu găsești răspunsul? Scrie-ne la hello@contapp.ro",
  cta: {
    primary: {
      text: "Solicită ofertă",
      href: "#pricing",
    },
    secondary: {
      text: "Contact",
      href: "mailto:hello@contapp.ro",
    },
  },
};

export const footerConfig = {
  cta: {
    headline: "Începe cu pachetul de bază gratuit. Extinde când ai nevoie.",
    placeholder: "Adresa ta de email",
    button: "Solicită ofertă",
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

/**
 * ============================================================================
 * EXTENSION CATALOG (landing-page only — for the pricing builder)
 * ============================================================================
 *
 * Mirrors the runtime registry in `frontend/src/lib/extensions.ts` but
 * adds marketing-friendly metadata (price band, headline copy, audience).
 * Updating one means updating both.
 */

export type LandingExtensionKey =
  | "contracts_pro"
  | "ticketing_pro"
  | "hr_pro"
  | "internal_chat"
  | "legislation_monitor"
  | "ai_assistant"
  | "multi_site_teams";

export interface LandingExtension {
  key: LandingExtensionKey;
  label: string;
  tagline: string;
  description: string;
  /** Monthly price in EUR for the small employee band (1–10). */
  basePriceEur: number;
  /** Adjusted price multiplier per band index (1×, 1.4×, 1.8×, 2.4×, custom). */
  highlights: string[];
  /** Who benefits the most from this extension. */
  audience: string[];
  /** Marketing-tier hint shown in card. */
  hint?: string;
  /** Marked as not yet available — toggle is locked. */
  comingSoon?: boolean;
}

export const LANDING_EXTENSIONS: LandingExtension[] = [
  {
    key: "contracts_pro",
    label: "Contracts Pro",
    tagline: "Șabloane, semnături prin link, dosar client.",
    description:
      "Creezi șabloane de contract cu câmpuri dinamice, trimiți invitații prin link public și primești PDF semnat automat. Include gestionare clienți (persoane + companii) cu dosar digital.",
    basePriceEur: 200,
    highlights: [
      "Editor șabloane cu câmpuri dinamice",
      "Semnare publică prin link, fără cont client",
      "Dosar client + atașare documente",
      "PDF generat automat la semnare",
    ],
    audience: ["Cabinete contabilitate", "Birouri avocatură", "Agenții"],
  },
  {
    key: "ticketing_pro",
    label: "Ticketing Pro",
    tagline: "Sistem Jira-light pentru echipa ta.",
    description:
      "Tickete cu kanban, asignare, claim, complete, refuse. Vizualizare în calendar și legare la clienți. Înlocuiește task-urile personale risipite în chat și note.",
    basePriceEur: 200,
    highlights: [
      "Board kanban + listă + calendar",
      "Asignare, claim, refuse, complete",
      "Legare ticket ↔ client",
      "Status, prioritate, termen",
    ],
    audience: ["Echipe operaționale", "Project managers", "Suport intern"],
  },
  {
    key: "hr_pro",
    label: "HR Pro",
    tagline: "Pontaj, concedii, review-uri, adeverințe.",
    description:
      "Înregistrare ore, cereri de concediu cu aprobare, planificare vacanțe, review-uri și cereri de adeverințe (de angajat sau de venit). Tot ce ai nevoie pentru HR-ul intern.",
    basePriceEur: 200,
    highlights: [
      "Pontaj orar pentru fiecare angajat",
      "Cereri concediu (odihnă / medical / sabatic / maternal)",
      "Review-uri periodice",
      "Adeverințe angajat și de venit",
    ],
    audience: ["Departamente HR", "Office managers", "Manageri de echipă"],
  },
  {
    key: "internal_chat",
    label: "Internal Chat",
    tagline: "Mesagerie de business între colegi.",
    description:
      "Conversații directe, grupuri, istoric și șabloane de mesaje. Include un bot care derivă tickete direct dintr-un mesaj („@bot fă-mi un ticket pentru asta”).",
    basePriceEur: 200,
    highlights: [
      "Mesaje directe + grupuri",
      "Istoric + șabloane de mesaje",
      "Atașamente și formatare bogată",
      "@bot creează tickete din chat (cu AI Assistant)",
    ],
    audience: ["Echipe distribuite", "Toate departamentele"],
  },
  {
    key: "legislation_monitor",
    label: "Legislation Monitor",
    tagline: "Update-uri legislative pe domeniul tău.",
    description:
      "Monitorizează modificări legislative, fiscale și de muncă pe codurile CAEN și topicurile pe care le selectezi. Frecvență configurabilă (instant, daily, weekly).",
    basePriceEur: 200,
    highlights: [
      "Filtrare pe topic + cod CAEN",
      "Frecvență notificări la alegere",
      "Surse oficiale (Monitor Oficial, ANAF, ANPC...)",
      "Sumarizare AI (cu AI Assistant)",
    ],
    audience: ["Cabinete contabilitate", "Departamente juridice", "HR"],
  },
  {
    key: "ai_assistant",
    label: "AI Assistant",
    tagline: "AI peste celelalte module: tickete din chat, sumarizări, planner smart.",
    description:
      "Add-on care activează capabilități AI peste modulele existente: derivare tickete din chat, sumarizare legislație, digest pe topic, smart planner zilnic / săptămânal.",
    basePriceEur: 99,
    highlights: [
      "Derivare tickete din mesaje chat",
      "Sumarizare articole legislație",
      "Digest pe topic peste mai multe articole",
      "Planner Smart (plan zilnic AI)",
    ],
    audience: ["Toate echipele care vor să automatizeze rutina"],
    hint: "Tracking separat de credite AI.",
  },
  {
    key: "multi_site_teams",
    label: "Multi-Site\nTeams",
    tagline: "Pentru afaceri cu mai multe sucursale și locații.",
    description:
      "Echipe, sucursale, locații. Asignare angajaților pe puncte de lucru și permisiuni segregate. Pe roadmap — disponibil pentru pre-orders.",
    basePriceEur: 0,
    highlights: [
      "Echipe + sucursale",
      "Locații cu permisiuni dedicate",
      "Asignare angajați pe puncte de lucru",
    ],
    audience: ["Lanțuri", "Distribuție", "Servicii multi-locație"],
    comingSoon: true,
  },
];

export const BASE_PACKAGE_FEATURES = [
  "Dashboard cu KPI și activitate recentă",
  "Notebook cu documente lungi (rich text)",
  "Notițe personale + partajate cu echipa",
  "Calendar / planner simplu",
  "Documente la nivel de organizație",
  "Useri, roluri și permisiuni",
  "Categorii de angajați (HR-friendly labels)",
  "Setări cont, semnătură salvată, abonament",
];

/**
 * Employee bands. Each band changes the multiplier on every active extension.
 * Below 11 employees the base package is free (multiplier = 1).
 */
export interface EmployeeBand {
  id: string;
  label: string;
  range: string;
  multiplier: number; // applied to every selected extension
  baseFeeEur: number; // additional band fee on top of extensions
  custom?: boolean;
}

export const EMPLOYEE_BANDS: EmployeeBand[] = [
  { id: "1-10", label: "1 – 10", range: "Echipă mică", multiplier: 1, baseFeeEur: 0 },
  { id: "11-20", label: "11 – 20", range: "Echipă în creștere", multiplier: 1.4, baseFeeEur: 50 },
  { id: "21-30", label: "21 – 30", range: "Echipă medie", multiplier: 1.8, baseFeeEur: 100 },
  { id: "31-50", label: "31 – 50", range: "Cabinet mare", multiplier: 2.4, baseFeeEur: 200 },
  { id: "51+", label: "51+", range: "Custom — contactează-ne", multiplier: 0, baseFeeEur: 0, custom: true },
];
