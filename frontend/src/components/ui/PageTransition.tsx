import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";

/**
 * Subtle enter animation per route. We deliberately avoid `AnimatePresence`
 * + `mode="wait"` because React 19 StrictMode double-mounts dev-only and
 * that combination can leave a child stuck mid-exit (page disappears).
 * Using just an enter animation keyed by pathname is reliable.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
