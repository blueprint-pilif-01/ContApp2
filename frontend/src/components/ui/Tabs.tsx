import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 border-b border-border",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
            active === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent/20 text-accent text-[10px] font-semibold flex items-center justify-center">
              {tab.badge}
            </span>
          )}
          {/* Active indicator */}
          {active === tab.id && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Tab panel helper ──────────────────────────────────────────────────────────

interface TabPanelProps {
  id: string;
  active: string;
  children: ReactNode;
}

export function TabPanel({ id, active, children }: TabPanelProps) {
  if (id !== active) return null;
  return <div>{children}</div>;
}
