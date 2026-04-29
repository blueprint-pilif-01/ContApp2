import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import type { ReactNode } from "react";

const footerLinks = {
  produs: [
    { label: "Funcționalități", href: "#functionalitati" },
    { label: "Prețuri", href: "#pricing" },
    { label: "Cum funcționează", href: "#cum-functioneaza" },
    { label: "Securitate", href: "#securitate" },
  ],
  companie: [
    { label: "Solicită ofertă", href: "#contact" },
    { label: "FAQ", href: "#faq" },
    { label: "Termeni de utilizare", href: "#" },
    { label: "Politica de confidențialitate", href: "#" },
    { label: "Contact", href: "mailto:hello@contapp.ro" },
  ],
  social: [
    { label: "LinkedIn", href: "#" },
    { label: "X (Twitter)", href: "#" },
  ],
};

export function Footer(): ReactNode {
  const navigate = useNavigate();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contact = document.getElementById("contact");
    if (contact) {
      contact.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/#contact");
    }
  };

  return (
    <footer className="relative pt-38 mt-24 mx-2.5 max-[850px]:mx-0">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-5xl px-4">
        <div className="relative w-full rounded-[1.5rem] overflow-hidden border border-border/80 bg-frame/95 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.08),0_24px_48px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3),0_12px_24px_rgba(0,0,0,0.2)]">
          {/* Blob background - strong green gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(145deg,_#f0fdf4_0%,_#dcfce7_25%,_#bbf7d0_50%,_#86efac_75%,_#a8d946_100%)] dark:bg-[linear-gradient(145deg,_#0f1410_0%,_#152015_30%,_#1a2e1a_55%,_#1e3d1e_80%,_#243d10_100%)]" aria-hidden="true" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/45 dark:bg-accent/30 blur-[80px]" aria-hidden="true" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-accent/40 dark:bg-accent/25 blur-[70px]" aria-hidden="true" />
          <div className="absolute -bottom-16 right-1/4 w-72 h-72 rounded-full bg-accent/35 dark:bg-accent/22 blur-[60px]" aria-hidden="true" />
          <div className="absolute top-1/3 right-1/3 w-56 h-56 rounded-full bg-accent/30 dark:bg-accent/18 blur-[50px]" aria-hidden="true" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-accent/25 dark:bg-accent/15 blur-[45px]" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center text-center px-10 py-20 max-[850px]:px-6 max-[850px]:py-14">
            <h2 className="text-5xl max-[850px]:text-3xl text-foreground font-semibold tracking-tight max-w-2xl mb-3 max-[850px]:mb-4 leading-[1.15]">
              Începe cu pachetul de bază. Activezi extensii când vrei.
            </h2>
            <p className="text-muted-foreground text-base mb-10 max-[850px]:mb-8 max-[850px]:text-sm">
              Pachet de bază gratuit. Extensii la alegere. Plătești în funcție
              de numărul de angajați.
            </p>

            <form onSubmit={handleFormSubmit} className="flex items-center w-full max-w-md bg-frame/90 dark:bg-frame/80 border border-border/60 rounded-xl p-1.5 shadow-sm max-[850px]:flex-col max-[850px]:p-3 max-[850px]:gap-3 max-[850px]:max-w-none">
              <div className="flex items-center flex-1 w-full min-w-0">
                <Mail className="w-4 h-4 text-muted-foreground ml-3 flex-none max-[850px]:ml-2 shrink-0" aria-hidden="true" />
                <input
                  name="footer-email"
                  type="email"
                  placeholder="Adresa ta de email"
                  aria-label="Adresă de email"
                  className="flex-1 min-w-0 px-2 py-2.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-foreground hover:bg-foreground/90 text-background rounded-lg text-sm font-semibold transition-colors whitespace-nowrap max-[850px]:w-full max-[850px]:py-3 shrink-0"
              >
                Solicită ofertă
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-accent rounded-tr-[3rem] rounded-tl-[3rem] pt-96 pb-16 max-[850px]:pt-72">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-start justify-between gap-12 max-[850px]:flex-col max-[850px]:gap-10">
            <Link to="/" className="flex items-center gap-2" aria-label="ContApp acasă">
              <img src="/contapplogo.png" alt="ContApp" className="h-12 w-auto brightness-0" />
            </Link>

            <nav className="flex gap-16 max-[850px]:gap-10 max-[850px]:flex-wrap" aria-label="Footer navigare">
              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Produs</h3>
                <ul className="space-y-2">
                  {footerLinks.produs.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-900 hover:text-neutral-900/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Companie</h3>
                <ul className="space-y-2">
                  {footerLinks.companie.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-900 hover:text-neutral-900/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Social</h3>
                <ul className="space-y-2">
                  {footerLinks.social.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-900 hover:text-neutral-900/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-16 pt-6 border-t border-neutral-900/10">
            <p className="text-sm text-neutral-900/50 text-center">
              © {new Date().getFullYear()} ContApp. Toate drepturile rezervate. · hello@contapp.ro
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
