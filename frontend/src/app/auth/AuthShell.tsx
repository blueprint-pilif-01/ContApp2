import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,_#f0fdf4_0%,_#dcfce7_25%,_#bbf7d0_50%,_#86efac_75%,_#a8d946_100%)] dark:bg-[linear-gradient(145deg,_#0f1410_0%,_#152015_30%,_#1a2e1a_55%,_#1e3d1e_80%,_#243d10_100%)]" />
        <div className="absolute -top-24 -right-24 w-[24rem] h-[24rem] rounded-full bg-accent/45 dark:bg-accent/30 blur-[70px]" />
        <div className="absolute top-1/2 -left-20 w-[20rem] h-[20rem] rounded-full bg-accent/40 dark:bg-accent/25 blur-[60px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[18rem] h-[18rem] rounded-full bg-accent/35 dark:bg-accent/22 blur-[50px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[22rem] h-[22rem] rounded-full bg-accent/30 dark:bg-accent/18 blur-[60px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-accent/28 dark:bg-accent/16 blur-[45px]" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8 group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          aria-label="ContApp · pagina principală"
        >
          <img
            src="/egeslogolighty.png"
            alt=""
            className="h-16 max-[390px]:h-14 w-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] group-active:scale-[0.985] dark:hidden"
          />
          <img
            src="/egeslogodark.png"
            alt=""
            className="hidden h-16 max-[390px]:h-14 w-auto transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] group-active:scale-[0.985] dark:block"
          />
        </Link>
        {children}
        <p className="text-center text-xs text-muted-foreground/90 mt-6">
          © {new Date().getFullYear()} ContApp. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  );
}
