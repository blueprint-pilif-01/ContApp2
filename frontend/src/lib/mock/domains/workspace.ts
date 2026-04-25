import { allocateId, getStore, listStore, stores, upsertStore } from "../state";
import { json, notFound, parseId, type MockHandler } from "../shared";
import { getSession } from "../../session";

/**
 * The real backend infers the actor from the JWT. The mock has no JWT
 * runtime, so we read the persisted session — same effect for in-browser dev.
 */
function actorId(): number {
  const s = getSession();
  return s?.principal.kind === "user" ? s.principal.id : 0;
}
function actorName(): string {
  const s = getSession();
  if (s?.principal.kind === "user") {
    return `${s.principal.first_name} ${s.principal.last_name}`.trim() || "Tu";
  }
  return "Tu";
}

function byDateDesc(a: Record<string, unknown>, b: Record<string, unknown>) {
  const av = String(a.date_added ?? a.updated_at ?? a.published_at ?? "");
  const bv = String(b.date_added ?? b.updated_at ?? b.published_at ?? "");
  return bv.localeCompare(av);
}

export const workspaceHandler: MockHandler = ({ path, method, body, query }) => {
  if (path === "/health" && method === "GET") {
    return json({ status: "active", message: "Mock", version: "v2-workspace" });
  }

  // Server-side search for clients — `?q=` matches name/email/phone.
  if (path === "/clients" && method === "GET") {
    const q = (query.get("q") ?? "").trim().toLowerCase();
    let rows = listStore("clients").sort((a, b) => Number(b.id) - Number(a.id));
    if (q) {
      rows = rows.filter((c) =>
        `${c.first_name ?? ""} ${c.last_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`
          .toLowerCase()
          .includes(q)
      );
    }
    return json(rows);
  }

  if (path === "/dashboard/overview" && method === "GET") {
    const invites = listStore("invites");
    const submissions = listStore("submissions");
    const clients = listStore("clients");
    const tasks = listStore("ticketingTasks");
    const users = listStore("users").filter((u) => String(u.status) === "active");

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const twoDaysFromNow = now + 2 * 86400000;
    const sevenDaysAgo = now - 7 * 86400000;

    // ── KPIs ────────────────────────────────────────────────────────────
    const activeClients = clients.filter((c) => String(c.status) === "active");
    const newThisMonth = clients.filter(
      (c) => new Date(String(c.date_added)).getTime() > thirtyDaysAgo
    ).length;
    const activeInvites = invites.filter(
      (i) => i.status !== "signed" && i.status !== "expired" && i.status !== "revoked"
    );
    const expiringInvites = activeInvites.filter((i) => {
      const exp = i.expiration_date ? new Date(String(i.expiration_date)).getTime() : Infinity;
      return exp <= twoDaysFromNow && exp > now;
    });
    const submissionsThisMonth = submissions.filter(
      (s) => new Date(String(s.date_added)).getTime() > thirtyDaysAgo
    ).length;
    const openTasks = tasks.filter((t) => t.status !== "done");
    const overdueTasks = openTasks.filter(
      (t) => t.due_date && new Date(String(t.due_date)).getTime() < now
    );
    const dueTodayTasks = openTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(String(t.due_date));
      const today = new Date();
      return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
    });

    // ── Contract pipeline ───────────────────────────────────────────────
    const pipeline = { draft: 0, sent: 0, viewed: 0, signed: 0, expired: 0 };
    for (const inv of invites) {
      const st = String(inv.status);
      if (st in pipeline) pipeline[st as keyof typeof pipeline] += 1;
    }

    // ── Urgent items ────────────────────────────────────────────────────
    type UrgentItem = {
      id: string;
      type: string;
      title: string;
      detail: string;
      due: string;
      link: string;
    };
    const urgentItems: UrgentItem[] = [];

    for (const inv of expiringInvites) {
      const client = getStore("clients", Number(inv.client_id));
      const clientName = client ? `${client.first_name} ${client.last_name}` : `Client #${inv.client_id}`;
      urgentItems.push({
        id: `exp-inv-${inv.id}`,
        type: "expiring_invite",
        title: `Solicitare #${inv.id} expiră curând`,
        detail: `Client: ${clientName}`,
        due: String(inv.expiration_date),
        link: "/app/contracts/invites",
      });
    }

    for (const t of overdueTasks) {
      urgentItems.push({
        id: `overdue-${t.id}`,
        type: "overdue_task",
        title: String(t.title),
        detail: `Termen depășit · ${String(t.description).slice(0, 60)}`,
        due: String(t.due_date),
        link: "/app/ticketing",
      });
    }

    const blockedTasks = openTasks.filter((t) => t.status === "blocked");
    for (const t of blockedTasks) {
      urgentItems.push({
        id: `blocked-${t.id}`,
        type: "blocked_task",
        title: `Blocat: ${t.title}`,
        detail: String(t.description).slice(0, 60),
        due: String(t.due_date),
        link: "/app/ticketing",
      });
    }

    urgentItems.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

    // ── Recent activity (enriched with actor) ───────────────────────────
    const recentActivity = [
      ...submissions.slice(0, 4).map((s) => {
        const client = getStore("clients", Number(s.client_id));
        const clientName = client ? `${client.first_name} ${client.last_name}` : "Client";
        return {
          id: `submission-${s.id}`,
          label: `${clientName} a semnat contractul #${s.id}`,
          at: String(s.date_added),
          type: "signed",
          actor: clientName,
        };
      }),
      ...tasks
        .filter((t) => t.status === "done")
        .slice(0, 3)
        .map((t) => {
          const assignee = getStore("users", Number(t.assignee_id));
          const name = assignee ? String(assignee.name) : "Echipă";
          return {
            id: `task-done-${t.id}`,
            label: `${name} a finalizat: ${t.title}`,
            at: String(t.updated_at),
            type: "done",
            actor: name,
          };
        }),
      ...tasks
        .filter((t) => t.status === "in_progress")
        .slice(0, 2)
        .map((t) => {
          const assignee = getStore("users", Number(t.assignee_id));
          const name = assignee ? String(assignee.name) : "Echipă";
          return {
            id: `task-progress-${t.id}`,
            label: `${name} lucrează la: ${t.title}`,
            at: String(t.updated_at),
            type: "active",
            actor: name,
          };
        }),
    ]
      .sort(byDateDesc)
      .slice(0, 8);

    // ── Team workload ───────────────────────────────────────────────────
    const teamWorkload = users.slice(0, 5).map((u) => {
      const userTasks = tasks.filter((t) => Number(t.assignee_id) === Number(u.id));
      const open = userTasks.filter((t) => t.status === "todo").length;
      const inProgress = userTasks.filter((t) => t.status === "in_progress").length;
      const doneThisWeek = userTasks.filter(
        (t) =>
          t.status === "done" &&
          new Date(String(t.updated_at)).getTime() > sevenDaysAgo
      ).length;
      return {
        id: Number(u.id),
        name: String(u.name),
        open,
        in_progress: inProgress,
        done_this_week: doneThisWeek,
      };
    });

    // ── Plan usage ──────────────────────────────────────────────────────
    const planUsage = {
      plan: "Pro",
      templates: { used: listStore("templates").length, limit: 10 },
      signings: { used: submissions.length, limit: 100 },
      clients: { used: activeClients.length, limit: 50 },
      storage_mb: { used: 320, limit: 2048 },
    };

    return json({
      kpis: {
        clients: activeClients.length,
        clients_new_this_month: newThisMonth,
        invites_active: activeInvites.length,
        invites_expiring_soon: expiringInvites.length,
        submissions_total: submissions.length,
        submissions_this_month: submissionsThisMonth,
        tasks_open: openTasks.length,
        tasks_overdue: overdueTasks.length,
        tasks_due_today: dueTodayTasks.length,
      },
      contract_pipeline: pipeline,
      urgent_items: urgentItems,
      recent_activity: recentActivity,
      upcoming: listStore("plannerEvents").slice(0, 6).map((ev) => {
        // For hr_leave events, resolve the linked leave to get the date range.
        if (ev.category === "hr_leave" && ev.linked_id) {
          const leave = getStore("hrLeaves", Number(ev.linked_id));
          if (leave && leave.from && leave.to && leave.from !== leave.to) {
            return { ...ev, date_end: String(leave.to) };
          }
        }
        return ev;
      }),
      team_workload: teamWorkload,
      plan_usage: planUsage,
    });
  }

  if (path === "/ticketing/tasks" && method === "GET") {
    const status = query.get("status");
    const assignee = query.get("assignee_id");
    const rows = listStore("ticketingTasks").filter((row) => {
      if (status && String(row.status) !== status) return false;
      if (assignee && String(row.assignee_id) !== assignee) return false;
      return true;
    });
    return json(rows.sort(byDateDesc));
  }
  if (path === "/ticketing/tasks" && method === "POST") {
    const task = upsertStore(
      "ticketingTasks",
      {
        title: body?.title ?? "Task nou",
        description: body?.description ?? "",
        status: body?.status ?? "todo",
        priority: body?.priority ?? "medium",
        owner_id: body?.owner_id ?? 1,
        assignee_id: body?.assignee_id ?? null,
        due_date: body?.due_date ?? new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: body?.source ?? "manual",
      },
      undefined
    );
    return json(task, 201);
  }
  if (path.match(/^\/ticketing\/tasks\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const existing = getStore("ticketingTasks", id);
    if (!existing) return notFound();
    const updated = upsertStore("ticketingTasks", { ...existing, ...(body ?? {}) }, id);
    return json(updated);
  }
  if (path.match(/^\/ticketing\/tasks\/\d+\/(claim|complete|refuse)$/) && method === "POST") {
    const [, , , idRaw, action] = path.split("/");
    const id = parseId(idRaw);
    if (!id) return notFound();
    const task = getStore("ticketingTasks", id);
    if (!task) return notFound();
    const status =
      action === "claim" ? "in_progress" : action === "complete" ? "done" : "todo";
    const assigneeId = action === "refuse" ? null : body?.assignee_id ?? 1;
    const next = upsertStore(
      "ticketingTasks",
      {
        ...task,
        status,
        assignee_id: assigneeId,
        updated_at: new Date().toISOString(),
      },
      id
    );
    return json(next);
  }

  if (path === "/chat/conversations" && method === "GET") {
    return json(listStore("conversations").sort(byDateDesc));
  }
  if (path.match(/^\/chat\/conversations\/\d+\/messages$/) && method === "GET") {
    const id = parseId(path.split("/")[3]);
    if (!id) return notFound();
    const messages = listStore("messages")
      .filter((m) => Number(m.conversation_id) === id)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    return json(messages);
  }
  if (path.match(/^\/chat\/conversations\/\d+\/messages$/) && method === "POST") {
    const conversationId = parseId(path.split("/")[3]);
    if (!conversationId) return notFound();
    const content = String(body?.content ?? "").trim();
    if (!content) return json({ message: "message required" }, 400);
    const msg = upsertStore(
      "messages",
      {
        conversation_id: conversationId,
        sender_id: actorId(),
        sender_name: actorName(),
        content,
        created_at: new Date().toISOString(),
        is_bot: false,
      },
      undefined
    );
    upsertStore(
      "conversations",
      {
        ...(getStore("conversations", conversationId) ?? {}),
        last_message: content,
        unread_count: 0,
        updated_at: new Date().toISOString(),
      },
      conversationId
    );
    return json(msg, 201);
  }
  if (path === "/chat/derive-task" && method === "POST") {
    const sourceText = String(body?.message ?? "");
    const task = upsertStore(
      "ticketingTasks",
      {
        title: sourceText.slice(0, 70) || "Task derivat din chat",
        description: `Creat automat din chat: ${sourceText}`,
        status: "todo",
        priority: "medium",
        owner_id: 1,
        assignee_id: 1,
        due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: "chat_bot",
      },
      undefined
    );
    return json({ task, confirmation: `Am creat taskul #${task.id}.` }, 201);
  }

  if (path === "/settings/users" && method === "GET") return json(listStore("users"));
  if (path === "/settings/users" && method === "POST") {
    return json(
      upsertStore("users", {
        name: body?.name ?? "User nou",
        email: body?.email ?? `user${allocateId()}@contapp.ro`,
        role_id: body?.role_id ?? 2,
        role_ids: body?.role_ids ?? [body?.role_id ?? 2],
        status: body?.status ?? "active",
        date_added: new Date().toISOString(),
      }),
      201
    );
  }
  if (path.match(/^\/settings\/users\/\d+$/) && method === "GET") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const user = getStore("users", id);
    return user ? json(user) : notFound();
  }
  if (path.match(/^\/settings\/users\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id || !getStore("users", id)) return notFound();
    return json(upsertStore("users", body ?? {}, id));
  }
  if (path.match(/^\/settings\/users\/\d+$/) && method === "DELETE") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const ok = stores.users.delete(id);
    if (!ok) return notFound();
    return json({ message: "user deleted" });
  }
  if (path.match(/^\/settings\/users\/\d+\/(invite|reset-password)$/) && method === "POST") {
    const parts = path.split("/");
    const id = parseId(parts[3]);
    const action = parts[4];
    if (!id || !getStore("users", id)) return notFound();
    return json({
      message: action === "invite" ? "Invitatie trimisa." : "Reset password trimis.",
      user_id: id,
      sent_at: new Date().toISOString(),
    });
  }
  if (path === "/settings/roles" && method === "GET") return json(listStore("roles"));
  if (path === "/settings/roles" && method === "POST") {
    return json(
      upsertStore("roles", {
        name: body?.name ?? "Rol nou",
        description: body?.description ?? "",
        permissions: body?.permissions ?? [],
      }),
      201
    );
  }
  if (path.match(/^\/settings\/roles\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id || !getStore("roles", id)) return notFound();
    return json(upsertStore("roles", body ?? {}, id));
  }
  if (path.match(/^\/settings\/roles\/\d+$/) && method === "DELETE") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const ok = stores.roles.delete(id);
    if (!ok) return notFound();
    return json({ message: "role deleted" });
  }

  if (path === "/hr/hours" && method === "GET") return json(listStore("hrHours").sort(byDateDesc));
  if (path === "/hr/hours" && method === "POST")
    return json(upsertStore("hrHours", body ?? {}), 201);
  if (path === "/hr/leaves" && method === "GET") return json(listStore("hrLeaves").sort(byDateDesc));
  if (path === "/hr/leaves" && method === "POST")
    return json(upsertStore("hrLeaves", body ?? {}), 201);
  if (path === "/hr/reviews" && method === "GET")
    return json(listStore("hrReviews").sort(byDateDesc));
  if (path === "/hr/reviews" && method === "POST")
    return json(upsertStore("hrReviews", body ?? {}), 201);
  if (path === "/hr/certificates" && method === "POST")
    return json({ message: "Cererea a fost inregistrata.", request_id: allocateId() }, 201);

  if (path === "/workspace/notes" && method === "GET") return json(listStore("workspaceNotes"));
  if (path === "/workspace/notes" && method === "POST")
    return json(upsertStore("workspaceNotes", body ?? {}), 201);
  if (path.match(/^\/workspace\/notes\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id || !getStore("workspaceNotes", id)) return notFound();
    return json(upsertStore("workspaceNotes", body ?? {}, id));
  }
  if (path === "/notebook/documents" && method === "GET") return json(listStore("notebookDocs"));
  if (path === "/notebook/documents" && method === "POST")
    return json(upsertStore("notebookDocs", body ?? {}), 201);
  if (path.match(/^\/notebook\/documents\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id || !getStore("notebookDocs", id)) return notFound();
    return json(upsertStore("notebookDocs", body ?? {}, id));
  }

  if (path === "/planner/events" && method === "GET") {
    const raw = listStore("plannerEvents");
    // Expand recurring events into virtual instances within ±90 days.
    const now = Date.now();
    const windowStart = now - 90 * 86400000;
    const windowEnd = now + 90 * 86400000;

    const expanded: Record<string, unknown>[] = [];
    for (const ev of raw) {
      expanded.push(ev);

      const recRaw = ev.recurrence;
      if (!recRaw) continue;
      const rec =
        typeof recRaw === "string" ? JSON.parse(recRaw) : recRaw;
      if (!rec || !rec.frequency) continue;

      const freq = String(rec.frequency);
      const interval = Number(rec.interval) || 1;
      const maxCount = Number(rec.count) || 52;
      const endDate = rec.end_date ? new Date(String(rec.end_date)).getTime() : windowEnd;
      const baseDate = new Date(String(ev.date));

      let count = 0;
      let offset = 1;
      while (count < maxCount && offset < 200) {
        const d = new Date(baseDate);
        if (freq === "daily") d.setDate(d.getDate() + interval * offset);
        else if (freq === "weekly") d.setDate(d.getDate() + 7 * interval * offset);
        else if (freq === "monthly") d.setMonth(d.getMonth() + interval * offset);
        else if (freq === "yearly") d.setFullYear(d.getFullYear() + interval * offset);
        else break;

        if (d.getTime() > endDate || d.getTime() > windowEnd) break;
        offset++;
        if (d.getTime() < windowStart) continue;
        count++;
        expanded.push({
          ...ev,
          id: Number(ev.id) * 10000 + offset,
          date: d.toISOString(),
          _recurring_source: ev.id,
        });
      }
    }
    return json(expanded);
  }
  if (path === "/planner/events" && method === "POST") {
    const event = upsertStore("plannerEvents", {
      title: body?.title ?? "Eveniment nou",
      date: body?.date ?? new Date().toISOString(),
      date_end: body?.date_end ?? "",
      duration_minutes: body?.duration_minutes ?? 60,
      category: body?.category ?? "personal",
      linked_id: body?.linked_id,
      recurrence: body?.recurrence ? JSON.stringify(body.recurrence) : null,
    });
    return json(event, 201);
  }
  if (path.match(/^\/planner\/events\/\d+$/) && method === "DELETE") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const ok = stores.plannerEvents.delete(id);
    if (!ok) return notFound();
    return json({ message: "deleted" });
  }
  if (path.match(/^\/planner\/events\/\d+$/) && method === "PUT") {
    const id = parseId(path.split("/").pop());
    if (!id || !getStore("plannerEvents", id)) return notFound();
    return json(upsertStore("plannerEvents", body ?? {}, id));
  }
  if (path === "/planner/smart" && method === "GET") {
    const openTasks = listStore("ticketingTasks").filter((t) => t.status !== "done").slice(0, 3);
    const urgentInvites = listStore("invites").filter((i) => i.status !== "signed").slice(0, 2);
    return json({
      focus: [
        ...openTasks.map((t) => ({ type: "task", title: t.title, id: t.id })),
        ...urgentInvites.map((i) => ({
          type: "invite",
          title: `Invitatie #${i.id} expira curand`,
          id: i.id,
        })),
      ],
      generated_at: new Date().toISOString(),
    });
  }

  if (path === "/legislation/updates" && method === "GET") {
    const topic = query.get("topic");
    const caen = query.get("caen");
    let rows = listStore("legislationNews");
    if (topic) rows = rows.filter((row) => String(row.category) === topic);
    if (caen) rows = rows.filter((row) => String(row.caen_codes).includes(caen));
    return json(rows.sort(byDateDesc));
  }
  if (path === "/legislation/preferences" && method === "GET") {
    return json({
      topics: ["fiscal", "munca", "gdpr"],
      selected_topics: ["fiscal", "munca"],
      caen_codes: ["6920"],
      cadence: "daily",
    });
  }
  if (path === "/legislation/preferences" && method === "PUT") {
    return json({ message: "Preferinte salvate." });
  }
  if (path === "/ai/summarize" && method === "POST") {
    return json({
      summary:
        "Rezumat AI: impact principal pe fiscalitate si raportare, cu modificari operative pe declaratii lunare.",
    });
  }
  if (path === "/ai/topic-digest" && method === "POST") {
    return json({
      digest:
        "Digest AI pe topic: 3 modificari cheie, 2 actiuni recomandate si un checklist pentru implementare.",
    });
  }

  // ── Invite send (notifies client + bumps status to sent) ─────────────────
  const sendInviteMatch = path.match(/^\/contracts\/invites\/(\d+)\/send$/);
  if (sendInviteMatch && method === "POST") {
    const id = parseId(sendInviteMatch[1]);
    if (!id) return notFound();
    const invite = getStore("invites", id);
    if (!invite) return notFound();
    const updated = upsertStore(
      "invites",
      { ...invite, status: "sent", date_modified: new Date().toISOString() },
      id
    );
    const client = getStore("clients", Number(invite.client_id));
    const link = `/public/sign/${invite.public_token}`;
    upsertStore("notifications", {
      user_id: invite.user_id,
      title: "Invitație trimisă",
      body: client
        ? `Solicitarea #${id} a fost trimisă către ${client.first_name} ${client.last_name}.`
        : `Solicitarea #${id} a fost trimisă.`,
      kind: "system",
      link,
      read_at: null,
    });
    return json({
      message: "Invitație trimisă.",
      invite: updated,
      sent_to: client?.email ?? null,
      public_url: link,
    });
  }

  // ── Signatures library (saved signatures the contabil reuses) ────────────
  if (path === "/signatures" && method === "GET") {
    return json(listStore("signatures").sort(byDateDesc));
  }
  if (path === "/signatures" && method === "POST") {
    if (!body?.image || !String(body.image).startsWith("data:image/")) {
      return json({ message: "image (data URL) required" }, 400);
    }
    const sig = upsertStore("signatures", {
      name: String(body.name ?? "Semnătură fără titlu"),
      owner_id: Number(body.owner_id ?? 0),
      image: String(body.image),
    });
    return json(sig, 201);
  }
  if (path.match(/^\/signatures\/\d+$/) && method === "DELETE") {
    const id = parseId(path.split("/").pop());
    if (!id) return notFound();
    const ok = stores.signatures.delete(id);
    return ok ? json({ message: "deleted" }) : notFound();
  }

  // ── Notifications inbox ──────────────────────────────────────────────────
  if (path === "/notifications" && method === "GET") {
    return json(listStore("notifications").sort(byDateDesc));
  }
  if (path === "/notifications/read-all" && method === "POST") {
    const now = new Date().toISOString();
    listStore("notifications").forEach((n) => {
      if (!n.read_at) {
        upsertStore("notifications", { ...n, read_at: now }, Number(n.id));
      }
    });
    return json({ message: "all read" });
  }
  const readNotifMatch = path.match(/^\/notifications\/(\d+)\/read$/);
  if (readNotifMatch && method === "POST") {
    const id = parseId(readNotifMatch[1]);
    if (!id) return notFound();
    const n = getStore("notifications", id);
    if (!n) return notFound();
    const updated = upsertStore(
      "notifications",
      { ...n, read_at: new Date().toISOString() },
      id
    );
    return json(updated);
  }

  // ── Effective permissions for a user (flatten role.permissions) ──────────
  const effectivePermsMatch = path.match(/^\/settings\/permissions\/effective\/(\d+)$/);
  if (effectivePermsMatch && method === "GET") {
    const userId = parseId(effectivePermsMatch[1]);
    if (!userId) return notFound();
    const user = getStore("users", userId);
    if (!user) return notFound();
    const roleIds: number[] = Array.isArray(user.role_ids)
      ? (user.role_ids as number[])
      : user.role_id != null
        ? [Number(user.role_id)]
        : [];
    const set = new Set<string>();
    for (const rid of roleIds) {
      const role = getStore("roles", rid);
      if (!role) continue;
      const perms = (role.permissions as string[] | undefined) ?? [];
      for (const p of perms) set.add(p);
    }
    return json({
      user_id: userId,
      role_ids: roleIds,
      permissions: Array.from(set).sort(),
    });
  }

  // ── Public sign flow (no auth) ───────────────────────────────────────────
  // Resolve a public_token to the invite + template + latest field snapshot.
  const publicSignMatch = path.match(/^\/public\/sign\/([^/]+)$/);
  if (publicSignMatch && method === "GET") {
    const token = decodeURIComponent(publicSignMatch[1]!);
    const invite = listStore("invites").find((i) => i.public_token === token);
    if (!invite) return json({ message: "Token invalid sau expirat." }, 404);
    if (invite.status === "expired" || invite.status === "revoked") {
      return json({ message: `Linkul este ${invite.status}.` }, 410);
    }
    const expiry = invite.expiration_date ? new Date(String(invite.expiration_date)) : null;
    if (expiry && expiry.getTime() < Date.now()) {
      // Auto-expire on read so the pipeline reflects reality.
      upsertStore("invites", { ...invite, status: "expired" }, Number(invite.id));
      return json({ message: "Linkul a expirat." }, 410);
    }

    const template = getStore("templates", Number(invite.template_id));
    const fields = listStore("templateFields")
      .filter((f) => Number(f.template_id) === Number(invite.template_id))
      .sort((a, b) => Number(b.id) - Number(a.id));
    const latestField = fields[0];

    // First-time view → bump status from sent to viewed (don't downgrade other states).
    if (invite.status === "sent" || invite.status === "draft") {
      upsertStore("invites", { ...invite, status: "viewed" }, Number(invite.id));
    }

    return json({
      invite: {
        id: invite.id,
        public_token: invite.public_token,
        status: invite.status === "sent" ? "viewed" : invite.status,
        expiration_date: invite.expiration_date,
        remarks: invite.remarks ?? "",
      },
      template: template
        ? {
            id: template.id,
            name: template.name,
            contract_type: template.contract_type,
          }
        : null,
      // Tiptap JSON snapshot — frontend renders dynamic form from fieldNode atoms.
      content: latestField ? JSON.parse(String(latestField.data)) : null,
      client_hint: invite.client_id ? getStore("clients", Number(invite.client_id)) : null,
    });
  }

  if (publicSignMatch && method === "POST") {
    const token = decodeURIComponent(publicSignMatch[1]!);
    const invite = listStore("invites").find((i) => i.public_token === token);
    if (!invite) return json({ message: "Token invalid sau expirat." }, 404);
    if (invite.status === "expired" || invite.status === "revoked") {
      return json({ message: `Linkul este ${invite.status}.` }, 410);
    }

    const filled = (body?.filled_fields ?? {}) as Record<string, unknown>;
    const signatureImage = body?.signature_image ? String(body.signature_image) : null;
    if (!signatureImage || !signatureImage.startsWith("data:image/")) {
      return json({ message: "Semnătura este obligatorie." }, 400);
    }

    const submission = upsertStore("submissions", {
      invite_id: invite.id,
      user_id: invite.user_id,
      client_id: invite.client_id,
      pdf_file_id: 0,
      remarks: "Semnat electronic prin link public.",
      status: "signed",
      filled_fields: filled,
      signature_image: signatureImage,
      signed_at: new Date().toISOString(),
      expiration_date: invite.expiration_date,
    });

    upsertStore(
      "invites",
      { ...invite, status: "signed", date_modified: new Date().toISOString() },
      Number(invite.id)
    );

    // Notify the contract owner that a submission landed.
    const client = getStore("clients", Number(invite.client_id));
    upsertStore("notifications", {
      user_id: invite.user_id,
      title: "Solicitare contract semnată",
      body: client
        ? `${client.first_name} ${client.last_name} a finalizat contractul #${invite.id}.`
        : `Contractul #${invite.id} a fost semnat.`,
      kind: "submission",
      link: "/app/contracts/submissions",
      read_at: null,
    });

    return json(
      {
        message: "Contract semnat.",
        submission_id: submission.id,
        contract_number: `C-${String(submission.id).padStart(5, "0")}`,
      },
      201
    );
  }

  // Download just the signature PNG for an authenticated owner.
  const sigDownloadMatch = path.match(/^\/contracts\/submissions\/(\d+)\/signature$/);
  if (sigDownloadMatch && method === "GET") {
    const id = parseId(sigDownloadMatch[1]);
    if (!id) return notFound();
    const sub = getStore("submissions", id);
    if (!sub) return notFound();
    const dataUrl = sub.signature_image ? String(sub.signature_image) : "";
    const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) return json({ message: "Semnătura nu este disponibilă." }, 404);
    const [, mime, b64] = match;
    const bin = atob(b64!);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime!,
        "Content-Disposition": `attachment; filename="semnatura-${id}.png"`,
      },
    });
  }

  // Lightweight final-PDF stand-in so the SubmissionsPage download button works.
  const pdfDownloadMatch = path.match(/^\/contracts\/submissions\/(\d+)\/pdf$/);
  if (pdfDownloadMatch && method === "GET") {
    const id = parseId(pdfDownloadMatch[1]);
    if (!id) return notFound();
    const sub = getStore("submissions", id);
    if (!sub) return notFound();
    const placeholder = `Mock PDF for submission #${id}\nFilled fields: ${JSON.stringify(sub.filled_fields ?? {}, null, 2)}\n`;
    return new Response(placeholder, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contract-${id}.pdf"`,
      },
    });
  }

  return null;
};

export function resetWorkspaceSeeds() {
  stores.messages.clear();
  stores.messages.set(910, {
    id: 910,
    conversation_id: 901,
    sender_id: 2,
    sender_name: "Mara Stan",
    content: "Poti verifica draftul de contract?",
    created_at: new Date().toISOString(),
    is_bot: false,
  });
}
