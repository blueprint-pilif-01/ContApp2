import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { SectionCard } from "../../../components/ui/SectionCard";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { useCollectionList } from "../../../hooks/useCollection";
import { api, isApiError } from "../../../lib/api";
import { fmtRelative } from "../../../lib/utils";

interface AdminNotification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  kind: string;
  date_added: string;
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const toast = useToast();
  const list = useCollectionList<AdminNotification>(
    "admin-notifications",
    "/admin/notifications"
  );

  const broadcast = useMutation({
    mutationFn: (payload: { title: string; body: string }) =>
      api.post<{ message: string }>("/admin/notifications/broadcast", payload),
    onSuccess: (res) => {
      toast.success(res.message);
      setTitle("");
      setBody("");
      list.refetch();
    },
    onError: (e) =>
      toast.error(isApiError(e) ? e.message : "Broadcast eșuat."),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificări platformă"
        description="Trimite notificări cross-organizație și vezi ultimele alerte."
      />

      <SectionCard icon={Send} title="Broadcast nou">
        <div className="space-y-3">
          <Input
            label="Titlu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Mentenanță planificată duminică..."
          />
          <Textarea
            label="Mesaj"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Detalii pentru toți userii platformei."
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => broadcast.mutate({ title, body })}
              loading={broadcast.isPending}
              disabled={!title.trim() || !body.trim()}
            >
              <Send className="w-3.5 h-3.5" /> Trimite
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Bell} title="Ultimele notificări">
        {list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <SkeletonList rows={4} />
        ) : (list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nicio notificare emisă.
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {list.data!.map((n) => (
              <li key={n.id} className="px-2 py-2.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {fmtRelative(n.date_added)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
