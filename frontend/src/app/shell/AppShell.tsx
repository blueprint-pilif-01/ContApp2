import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CommandPalette } from "./CommandPalette";
import { BreadcrumbLabelProvider } from "../../components/ui/BreadcrumbContext";
import { PageTransition } from "../../components/ui/PageTransition";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";
import { ShortcutsOverlay } from "../../components/ui/ShortcutsOverlay";

export function AppShell() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useGlobalShortcuts(() => setShowShortcuts((v) => !v));

  useEffect(() => {
    document.documentElement.classList.add("app-font-large");
    return () => document.documentElement.classList.remove("app-font-large");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const clearOnWide = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", clearOnWide);
    return () => mq.removeEventListener("change", clearOnWide);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    if (window.matchMedia("(min-width: 1024px)").matches) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onEscape);
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <BreadcrumbLabelProvider>
      <div className="min-h-screen bg-background flex relative">
        <CommandPalette />
        <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />

        <button
          type="button"
          tabIndex={sidebarOpen ? 0 : -1}
          aria-hidden={!sidebarOpen}
          className={`fixed inset-0 z-[38] bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label="Închide meniul"
          onClick={closeSidebar}
        />

        <Sidebar mobileOpen={sidebarOpen} onMobileClose={closeSidebar} />

        <div className="flex flex-1 min-h-screen flex-col lg:ml-64">
          <ImpersonationBanner />
          <Topbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 xl:max-w-[1400px] 2xl:max-w-[1600px]">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbLabelProvider>
  );
}
