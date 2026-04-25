import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface NotificationDTO {
  id: number;
  user_id: number;
  title: string;
  body: string;
  kind: "submission" | "task" | "legislation" | "system";
  link?: string | null;
  read_at: string | null;
  date_added: string;
}

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery<NotificationDTO[]>({
    queryKey: [...NOTIFICATIONS_KEY, "list"],
    queryFn: () => api.get<NotificationDTO[]>("/notifications"),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, unknown, void>({
    mutationFn: () =>
      api.post<{ message: string }>("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, unknown, number>({
    mutationFn: (id) =>
      api.post<{ message: string }>(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
