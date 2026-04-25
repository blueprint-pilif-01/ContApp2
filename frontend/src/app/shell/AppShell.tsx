import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CommandPalette } from "./CommandPalette";
import { BreadcrumbLabelProvider } from "../../components/ui/BreadcrumbContext";
import { PageTransition } from "../../components/ui/PageTransition";
import { useFeatureSeed } from "../../hooks/useFeatureSeed";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";
import { ShortcutsOverlay } from "../../components/ui/ShortcutsOverlay";

export function AppShell() {
  useFeatureSeed("workspace", "seed-v1");
  const [showShortcuts, setShowShortcuts] = useState(false);
  useGlobalShortcuts(() => setShowShortcuts((v) => !v));

  useEffect(() => {
    document.documentElement.classList.add("app-font-large");
    return () => document.documentElement.classList.remove("app-font-large");
  }, []);

  return (
    <BreadcrumbLabelProvider>
      <div className="min-h-screen bg-background flex">
        <CommandPalette />
        <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <ImpersonationBanner />
          <Topbar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full px-6 py-6">
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
