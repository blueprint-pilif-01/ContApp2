import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bell, Menu, Moon, Sun, CheckCheck, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Breadcrumbs, APP_SEGMENTS } from "../../components/ui/Breadcrumbs";
import { MockHealthPill } from "./MockHealthPill";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { cn, fmtRelative } from "../../lib/utils";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export interface TopbarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({
  sidebarOpen = false,
  onToggleSidebar,
}: TopbarProps = {}) {
  const mounted = useIsMounted();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inbox = notifications.data ?? [];
  const unread = inbox.filter((n) => !n.read_at).length;

  return (
    <header className="h-14 bg-frame border-b border-border flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-frame/80">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={() => onToggleSidebar()}
            className={cn(
              "lg:hidden shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl",
              "text-foreground hover:bg-foreground/6 active:scale-[0.96] motion-reduce:active:scale-100 transition-[transform,background-color,color]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/18",
            )}
            aria-expanded={sidebarOpen}
            aria-controls="contapp-sidebar"
            aria-label={sidebarOpen ? "Închide meniul" : "Deschide meniul"}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" strokeWidth={1.85} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.85} />
            )}
          </button>
        ) : null}
        <Breadcrumbs
          basePath="/app"
          rootLabel="Dashboard"
          segments={APP_SEGMENTS}
        />
      </div>

      <div className="flex items-center gap-2">
        <MockHealthPill />
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label={isDark ? "Comută la mod deschis" : "Comută la mod întunecat"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Notificări"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[color:var(--accent)] ring-2 ring-frame" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 w-96 bg-frame border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Notificări
                  </h3>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[color:var(--accent)] text-foreground">
                      {unread}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={unread === 0 || markAllRead.isPending}
                  className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> marchează citite
                </button>
              </div>
              <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                {notifications.isLoading && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">Se încarcă notificările...</li>
                )}
                {notifications.isError && (
                  <li className="px-4 py-6 text-sm text-red-500">Notificările nu au putut fi încărcate.</li>
                )}
                {!notifications.isLoading && !notifications.isError && inbox.length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                    <Bell className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    Nu ai notificări.
                  </li>
                )}
                {inbox.map((n) => {
                  const kindColor = n.kind === "contract" ? "text-blue-400" : n.kind === "task" ? "text-amber-400" : n.kind === "hr" ? "text-green-400" : "text-muted-foreground";
                  return (
                    <li key={n.id} className={`px-4 py-3 flex gap-3 hover:bg-foreground/3 transition-colors ${!n.read_at ? "bg-foreground/2" : ""}`}>
                      <span
                        className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!n.read_at ? "bg-[color:var(--accent)]" : "bg-foreground/20"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.read_at) {
                              markOneRead.mutate(n.id);
                            }
                            if (n.link) {
                              window.location.assign(n.link);
                            }
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-semibold tracking-wider ${kindColor}`}>{n.kind}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">
                            {fmtRelative(n.date_added)}
                          </p>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
