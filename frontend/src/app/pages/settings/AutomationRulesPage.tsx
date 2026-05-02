import { useState } from "react";
import { Zap, Plus, Trash2, Play, Pause, Eye } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Drawer } from "../../../components/ui/Drawer";
import { useCollectionList, useCollectionCreate } from "../../../hooks/useCollection";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { queryClient } from "../../../lib/queryClient";
import { fmtDate, cn } from "../../../lib/utils";

type AutomationRule = {
  id: number;
  name: string;
  trigger: "days_before_deadline" | "on_status_change" | "on_create";
  trigger_value: number;
  action: "create_task" | "send_notification" | "send_email";
  applies_to: "contracts" | "tasks" | "hr_leaves";
  enabled: boolean;
  last_run?: string;
  created_at: string;
  affected_count?: number;
};

const triggerLabels: Record<string, string> = {
  days_before_deadline: "Zile înainte de deadline",
  on_status_change: "La schimbare status",
  on_create: "La creare",
};

const actionLabels: Record<string, string> = {
  create_task: "Crează ticket",
  send_notification: "Trimite notificare",
  send_email: "Trimite email",
};

const entityLabels: Record<string, string> = {
  contracts: "Contracte",
  tasks: "Tickete",
  hr_leaves: "Concedii HR",
};

export default function AutomationRulesPage() {
  const rules = useCollectionList<AutomationRule>("automation-rules", "/automation-rules");
  const create = useCollectionCreate<object, AutomationRule>("automation-rules", "/automation-rules");
  const toggle = useMutation({
    mutationFn: (r: AutomationRule) =>
      api.put(`/automation-rules/${r.id}`, { enabled: !r.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/automation-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<AutomationRule["trigger"]>("days_before_deadline");
  const [newTriggerValue, setNewTriggerValue] = useState(5);
  const [newAction, setNewAction] = useState<AutomationRule["action"]>("send_notification");
  const [newAppliesTo, setNewAppliesTo] = useState<AutomationRule["applies_to"]>("contracts");

  const items = rules.data ?? [];
  const activeCount = items.filter((r) => r.enabled).length;

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate({
      name: newName.trim(),
      trigger: newTrigger,
      trigger_value: newTriggerValue,
      action: newAction,
      applies_to: newAppliesTo,
      enabled: true,
    });
    setCreateOpen(false);
    setNewName("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automatizări"
        description="Reguli automate pentru deadline-uri, remindere și notificări."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Regulă nouă
          </Button>
        }
      />

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="font-semibold">{items.length}</span> reguli totale
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-green-500 font-medium">{activeCount} active</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{items.length - activeCount} inactive</span>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {items.map((rule) => (
          <article
            key={rule.id}
            className={cn(
              "rounded-2xl border bg-frame p-4 transition-all",
              rule.enabled ? "border-border" : "border-border opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={cn("w-4 h-4", rule.enabled ? "text-amber-500" : "text-muted-foreground")} />
                  <h3 className="text-sm font-semibold">{rule.name}</h3>
                  <Badge variant={rule.enabled ? "success" : "neutral"}>
                    {rule.enabled ? "Activ" : "Inactiv"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Când:</strong> {triggerLabels[rule.trigger]}{" "}
                  {rule.trigger === "days_before_deadline" && `(${rule.trigger_value} zile)`}{" "}
                  · <strong>Acțiune:</strong> {actionLabels[rule.action]}{" "}
                  · <strong>Pe:</strong> {entityLabels[rule.applies_to]}
                </p>
                {rule.last_run && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Ultima rulare: {fmtDate(rule.last_run)}
                  </p>
                )}
                {rule.affected_count !== undefined && (
                  <p className="text-[10px] text-muted-foreground">
                    <Eye className="w-3 h-3 inline mr-0.5" />
                    Afectează {rule.affected_count} elemente
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggle.mutate(rule)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    rule.enabled ? "hover:bg-amber-500/10 text-amber-500" : "hover:bg-green-500/10 text-green-500"
                  )}
                  title={rule.enabled ? "Dezactivează" : "Activează"}
                >
                  {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove.mutate(rule.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nicio regulă de automatizare.</p>
            <p className="text-xs mt-1">Creează prima regulă pentru a primi remindere automate.</p>
          </div>
        )}
      </div>

      {/* Create Drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Regulă nouă"
        description="Configurează un trigger și o acțiune automată."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Anulează</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="w-4 h-4" /> Crează
            </Button>
          </div>
        }
      >
        <Input label="Nume regulă" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Reminder 5 zile înainte de deadline" />

        <div>
          <p className="text-sm font-medium mb-1.5">Trigger</p>
          <select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value as AutomationRule["trigger"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="days_before_deadline">Zile înainte de deadline</option>
            <option value="on_status_change">La schimbare status</option>
            <option value="on_create">La creare element</option>
          </select>
        </div>

        {newTrigger === "days_before_deadline" && (
          <Input label="Câte zile înainte" type="number" value={String(newTriggerValue)} onChange={(e) => setNewTriggerValue(Number(e.target.value) || 1)} />
        )}

        <div>
          <p className="text-sm font-medium mb-1.5">Acțiune</p>
          <select value={newAction} onChange={(e) => setNewAction(e.target.value as AutomationRule["action"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="send_notification">Trimite notificare</option>
            <option value="create_task">Crează ticket automat</option>
            <option value="send_email">Trimite email</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium mb-1.5">Se aplică pe</p>
          <select value={newAppliesTo} onChange={(e) => setNewAppliesTo(e.target.value as AutomationRule["applies_to"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="contracts">Contracte</option>
            <option value="tasks">Tickete</option>
            <option value="hr_leaves">Concedii HR</option>
          </select>
        </div>
      </Drawer>
    </div>
  );
}
