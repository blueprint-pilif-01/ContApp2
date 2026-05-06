import type { LucideIcon } from "lucide-react";

export interface CanvasStepDescriptor {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  kindLabel: string;
  title: string;
  subtitle: string;
  aiBadge?: boolean;
}
