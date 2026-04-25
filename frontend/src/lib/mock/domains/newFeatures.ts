/**
 * Mock handler for new features.
 *
 * ── API SPEC FOR BACKEND DEVELOPER ────────────────────────────────────────
 *
 * GET    /message-templates           → MessageTemplate[]
 * POST   /message-templates           → MessageTemplate   { title, content, category }
 * DELETE /message-templates/:id       → { message }
 *
 * GET    /activity-log                → ActivityEntry[]
 *
 * GET    /reports/overview            → ReportData (single object)
 *
 * GET    /documents                   → DocItem[]
 * POST   /documents/upload            → DocItem   { name, type, mime_type?, size?, folder, client_id? }
 * POST   /documents/folder            → DocItem   { name, parent_folder }
 * DELETE /documents/:id               → { message }
 *
 * GET    /automation-rules            → AutomationRule[]
 * POST   /automation-rules            → AutomationRule { name, trigger, trigger_value, action, applies_to }
 * PUT    /automation-rules/:id        → AutomationRule { enabled?, name?, ... }
 * DELETE /automation-rules/:id        → { message }
 *
 * GET    /portal/:token/overview      → PortalData (public, no auth required)
 * ──────────────────────────────────────────────────────────────────────────
 */

import { allocateId, getStore, listStore, stores, upsertStore } from "../state";
import { json, notFound, type MockHandler } from "../shared";

const now = new Date();
const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
const monthLabel = (off: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() - off, 1);
  return d.toLocaleString("ro-RO", { month: "short" }).replace(".", "");
};

function ensureSeed() {
  if (listStore("messageTemplates").length > 0) return;

  const tpls = [
    { title: "Cerere documente lunare", content: "Bună ziua,\n\nVă rugăm să ne transmiteți documentele contabile aferente lunii curente (facturi, extrase bancare, registrul de casă).\n\nMulțumim,\nEchipa ContApp", category: "documente", usage_count: 23, created_at: ago(30) },
    { title: "Reminder plată factură", content: "Bună ziua,\n\nVă reamintim că factura #{nr} are scadența pe {data}. Vă rugăm să efectuați plata cât mai curând.\n\nCu stimă,\nCabinetul {firma}", category: "facturi", usage_count: 15, created_at: ago(20) },
    { title: "Notificare declarație depusă", content: "Bună ziua,\n\nVă informăm că declarația {tip} a fost depusă cu succes la ANAF în data de {data}.\n\nO zi bună!", category: "declaratii", usage_count: 45, created_at: ago(60) },
    { title: "Confirmare primire documente", content: "Bună ziua,\n\nConfirmăm primirea documentelor transmise. Le vom procesa în cel mai scurt timp.\n\nMulțumim!", category: "general", usage_count: 67, created_at: ago(10) },
    { title: "Programare întâlnire", content: "Bună ziua,\n\nDorim să programăm o întâlnire pentru a discuta situația financiară. Sunteți disponibil pe {data} la ora {ora}?\n\nCu stimă,\n{firma}", category: "general", usage_count: 8, created_at: ago(5) },
  ];
  for (const t of tpls) upsertStore("messageTemplates", { ...t, id: allocateId() });

  const logs = [
    { user_id: 1, user_name: "Andrei Popescu", action: "login", entity_type: "session", entity_id: 0, entity_title: "Autentificare reușită", created_at: ago(0) },
    { user_id: 1, user_name: "Andrei Popescu", action: "create", entity_type: "contract", entity_id: 601, entity_title: "Contract servicii Mihai Stoica", details: "Trimis pentru semnare", created_at: ago(0) },
    { user_id: 2, user_name: "Mara Stan", action: "update", entity_type: "task", entity_id: 301, entity_title: "Verificare balanță Q1", details: "Status: todo → in_progress", created_at: ago(0) },
    { user_id: 1, user_name: "Andrei Popescu", action: "create", entity_type: "client", entity_id: 105, entity_title: "SC Exemplu SRL", created_at: ago(1) },
    { user_id: 3, user_name: "Victor Ionescu", action: "sign", entity_type: "contract", entity_id: 602, entity_title: "Contract consultanță fiscală", details: "Semnat electronic", created_at: ago(1) },
    { user_id: 2, user_name: "Mara Stan", action: "create", entity_type: "document", entity_id: 201, entity_title: "Balanță verificare MAR 2026", created_at: ago(1) },
    { user_id: 1, user_name: "Andrei Popescu", action: "update", entity_type: "client", entity_id: 101, entity_title: "Diana Pop", details: "Adăugat CUI și adresa", created_at: ago(2) },
    { user_id: 1, user_name: "Andrei Popescu", action: "delete", entity_type: "task", entity_id: 310, entity_title: "Task duplicat verificare", created_at: ago(2) },
    { user_id: 3, user_name: "Victor Ionescu", action: "create", entity_type: "hr_leave", entity_id: 50, entity_title: "Concediu medical 24-25 apr", created_at: ago(3) },
    { user_id: 2, user_name: "Mara Stan", action: "login", entity_type: "session", entity_id: 0, entity_title: "Autentificare reușită", created_at: ago(3) },
    { user_id: 1, user_name: "Andrei Popescu", action: "create", entity_type: "contract", entity_id: 603, entity_title: "Contract lunar SC Alfa SRL", created_at: ago(4) },
    { user_id: 2, user_name: "Mara Stan", action: "update", entity_type: "contract", entity_id: 601, entity_title: "Contract servicii Mihai Stoica", details: "Status: draft → sent", created_at: ago(5) },
  ];
  for (const l of logs) upsertStore("activityLog", { ...l, id: allocateId() });

  const docs = [
    { name: "Clienți", type: "folder", folder: "/", client_id: null, client_name: null, uploaded_at: ago(90) },
    { name: "Declarații", type: "folder", folder: "/", client_id: null, client_name: null, uploaded_at: ago(90) },
    { name: "Facturi", type: "folder", folder: "/", client_id: null, client_name: null, uploaded_at: ago(90) },
    { name: "Balanță verificare MAR 2026.pdf", type: "file", mime_type: "application/pdf", size: 245760, folder: "/", client_id: 101, client_name: "Diana Pop", uploaded_by: 1, uploaded_at: ago(5) },
    { name: "Extras bancar BRD 04-2026.pdf", type: "file", mime_type: "application/pdf", size: 189440, folder: "/", client_id: 102, client_name: "Mihai Stoica", uploaded_by: 1, uploaded_at: ago(3) },
    { name: "Factură #1234.pdf", type: "file", mime_type: "application/pdf", size: 67584, folder: "/Facturi/", client_id: 101, client_name: "Diana Pop", uploaded_by: 2, uploaded_at: ago(2) },
    { name: "Contract consultanță.docx", type: "file", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 34816, folder: "/", client_id: 103, client_name: "Victor Ionescu", uploaded_by: 1, uploaded_at: ago(10) },
    { name: "Declarație D100 MAR 2026.xml", type: "file", mime_type: "application/xml", size: 12288, folder: "/Declarații/", client_id: 101, client_name: "Diana Pop", uploaded_by: 1, uploaded_at: ago(1) },
  ];
  for (const d of docs) upsertStore("documents", { ...d, id: allocateId() });

  const rules = [
    { name: "Reminder 5 zile înainte de deadline contract", trigger: "days_before_deadline", trigger_value: 5, action: "send_notification", applies_to: "contracts", enabled: true, last_run: ago(1), created_at: ago(30), affected_count: 3 },
    { name: "Crează task la contract nou", trigger: "on_create", trigger_value: 0, action: "create_task", applies_to: "contracts", enabled: true, last_run: ago(2), created_at: ago(60), affected_count: 0 },
    { name: "Email reminder concediu aproape", trigger: "days_before_deadline", trigger_value: 3, action: "send_email", applies_to: "hr_leaves", enabled: false, created_at: ago(15), affected_count: 1 },
    { name: "Notificare task blocat", trigger: "on_status_change", trigger_value: 0, action: "send_notification", applies_to: "tasks", enabled: true, last_run: ago(0), created_at: ago(45), affected_count: 2 },
  ];
  for (const r of rules) upsertStore("automationRules", { ...r, id: allocateId() });
}

export const newFeaturesHandler: MockHandler = ({ path, method, body }) => {
  ensureSeed();

  // ── Message Templates ───────────────────────────
  if (path === "/message-templates" && method === "GET") {
    return json(listStore("messageTemplates"));
  }
  if (path === "/message-templates" && method === "POST") {
    const item = upsertStore("messageTemplates", { usage_count: 0, created_at: new Date().toISOString(), ...body });
    return json(item, 201);
  }
  const delTpl = path.match(/^\/message-templates\/(\d+)$/);
  if (delTpl && method === "DELETE") {
    stores.messageTemplates.delete(Number(delTpl[1]));
    return json({ message: "deleted" });
  }

  // ── Activity Log ────────────────────────────────
  if (path.startsWith("/activity-log") && method === "GET") {
    const all = listStore("activityLog") as unknown as Array<{ created_at: string }>;
    return json(all.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  // ── Reports ─────────────────────────────────────
  if (path.startsWith("/reports/overview") && method === "GET") {
    const months = Array.from({ length: 6 }, (_, i) => monthLabel(5 - i));
    return json({
      clients_trend: months.map((m, i) => ({ month: m, total: 5 + i * 2, new: 1 + (i % 3) })),
      tasks_trend: months.map((m, i) => ({ month: m, created: 8 + i * 3, completed: 6 + i * 2 + (i % 2) })),
      contracts_trend: months.map((m, i) => ({ month: m, sent: 3 + i, signed: 2 + i, expired: i % 3 === 0 ? 1 : 0 })),
      team_productivity: [
        { user_id: 1, name: "Andrei Popescu", tasks_completed: 24, avg_time_hours: 2.3 },
        { user_id: 2, name: "Mara Stan", tasks_completed: 18, avg_time_hours: 1.8 },
        { user_id: 3, name: "Victor Ionescu", tasks_completed: 12, avg_time_hours: 3.1 },
        { user_id: 4, name: "Elena Marin", tasks_completed: 9, avg_time_hours: 2.7 },
      ],
    });
  }

  // ── Documents ───────────────────────────────────
  if (path === "/documents" && method === "GET") {
    return json(listStore("documents"));
  }
  if ((path === "/documents/upload" || path === "/documents/folder") && method === "POST") {
    const item = upsertStore("documents", { uploaded_at: new Date().toISOString(), ...body });
    return json(item, 201);
  }
  const delDoc = path.match(/^\/documents\/(\d+)$/);
  if (delDoc && method === "DELETE") {
    stores.documents.delete(Number(delDoc[1]));
    return json({ message: "deleted" });
  }

  // ── Automation Rules ────────────────────────────
  if (path === "/automation-rules" && method === "GET") {
    return json(listStore("automationRules"));
  }
  if (path === "/automation-rules" && method === "POST") {
    const item = upsertStore("automationRules", { enabled: true, created_at: new Date().toISOString(), affected_count: 0, ...body });
    return json(item, 201);
  }
  const ruleMatch = path.match(/^\/automation-rules\/(\d+)$/);
  if (ruleMatch && method === "PUT") {
    const id = Number(ruleMatch[1]);
    const existing = getStore("automationRules", id);
    if (!existing) return notFound();
    const updated = upsertStore("automationRules", { ...existing, ...body }, id);
    return json(updated);
  }
  if (ruleMatch && method === "DELETE") {
    stores.automationRules.delete(Number(ruleMatch[1]));
    return json({ message: "deleted" });
  }

  // ── Client Portal ───────────────────────────────
  const portalMatch = path.match(/^\/portal\/([^/]+)\/overview$/);
  if (portalMatch && method === "GET") {
    return json({
      client_name: "SC Exemplu SRL",
      accountant_name: "Andrei Popescu",
      firm_name: "ContApp Cabinet Contabilitate",
      contracts: [
        { id: 601, title: "Contract servicii contabilitate 2026", status: "pending", deadline: ago(-10), sign_url: "#" },
        { id: 602, title: "Contract consultanță fiscală", status: "signed", deadline: ago(5) },
      ],
      documents: [
        { id: 201, name: "Balanță verificare Q1.pdf", size: 245760, uploaded_at: ago(5) },
        { id: 202, name: "Declarație D100.xml", size: 12288, uploaded_at: ago(2) },
      ],
      messages: [
        { id: 1, from: "Andrei Popescu", content: "Bună ziua! Vă rog să ne transmiteți facturile aferente lunii martie.", created_at: ago(3) },
        { id: 2, from: "Andrei Popescu", content: "Declarația D100 a fost depusă cu succes.", created_at: ago(1) },
      ],
    });
  }

  return null;
};
