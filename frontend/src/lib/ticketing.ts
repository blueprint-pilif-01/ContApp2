export type TicketPriorityInput = "low" | "normal" | "high" | "urgent";
export type TicketStatusInput = "todo" | "in_progress" | "blocked" | "done" | "archived";

type BadgeVariant = "danger" | "warning" | "neutral";

export function ticketPriorityLabel(priority: string | null | undefined): string {
  switch (priority) {
    case "urgent":
      return "urgent";
    case "high":
      return "high";
    case "low":
      return "low";
    case "normal":
    case "medium":
    default:
      return "medium";
  }
}

export function ticketPriorityVariant(
  priority: string | null | undefined
): BadgeVariant {
  switch (priority) {
    case "urgent":
    case "high":
      return "danger";
    case "low":
      return "neutral";
    case "normal":
    case "medium":
    default:
      return "warning";
  }
}

export function ticketPriorityBar(priority: string | null | undefined): string {
  switch (priority) {
    case "urgent":
      return "bg-red-600";
    case "high":
      return "bg-red-500";
    case "low":
      return "bg-foreground/30";
    case "normal":
    case "medium":
    default:
      return "bg-amber-500";
  }
}

export function ticketStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "todo":
      return "De făcut";
    case "in_progress":
    case "in_work":
      return "În progres";
    case "blocked":
      return "Blocat";
    case "done":
      return "Gata";
    case "archived":
      return "Arhivat";
    default:
      return "Necunoscut";
  }
}
