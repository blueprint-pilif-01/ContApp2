import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePrincipal } from "./useMe";
import { canManageWorkspaceSettings } from "../lib/access";

/**
 * Global keyboard shortcuts for the app.
 *
 * Single-key:
 *   ?          → toggle shortcuts overlay
 *
 * Two-key sequences (press G, then a letter):
 *   G → D     → Dashboard
 *   G → C     → Clients
 *   G → T     → Ticketing
 *   G → K     → Calendar
 *   G → R     → Reports
 *   G → N     → Notebook
 *   G → H     → HR
 *   G → S     → Settings
 *   G → L     → Legislation
 *   G → A     → Activity Log
 */
export function useGlobalShortcuts(onToggleHelp?: () => void) {
  const navigate = useNavigate();
  const principal = usePrincipal("user");
  const canManageSettings = canManageWorkspaceSettings(principal);
  const pendingG = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInput) return;

      // ? → toggle shortcuts help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }

      // Two-key: G → <key>
      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(timeout.current);
        const key = e.key.toLowerCase();
        const href = {
          d: "/app/dashboard",
          c: "/app/clients",
          t: "/app/ticketing",
          k: "/app/calendar",
          r: "/app/reports",
          n: "/app/notebook",
          h: "/app/hr",
          s: "/app/settings",
          l: "/app/legislation",
          f: "/app/documents",
          ...(canManageSettings ? { a: "/app/settings/activity-log" } : {}),
        }[key];
        if (href) {
          e.preventDefault();
          navigate(href);
        }
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        pendingG.current = true;
        timeout.current = setTimeout(() => {
          pendingG.current = false;
        }, 800);
        return;
      }
    },
    [canManageSettings, navigate, onToggleHelp]
  );

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      clearTimeout(timeout.current);
    };
  }, [handler]);
}

/** Shortcuts data for the help overlay */
export const SHORTCUTS = [
  { keys: ["G", "D"], label: "Dashboard" },
  { keys: ["G", "C"], label: "Clienți" },
  { keys: ["G", "T"], label: "Ticketing" },
  { keys: ["G", "K"], label: "Calendar" },
  { keys: ["G", "R"], label: "Rapoarte" },
  { keys: ["G", "N"], label: "Notebook" },
  { keys: ["G", "H"], label: "HR" },
  { keys: ["G", "F"], label: "Documente" },
  { keys: ["G", "S"], label: "Setări" },
  { keys: ["G", "L"], label: "Legislație" },
  { keys: ["G", "A"], label: "Activity Log" },
  { keys: ["?"], label: "Acest overlay" },
  { keys: ["⌘", "K"], label: "Command Palette" },
];
