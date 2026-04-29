/**
 * Platform admin mock surface — implements the `/admin/*` routes consumed by
 * the React admin panel. All state lives in the shared mock store; no real
 * persistence beyond the page lifecycle.
 *
 * Endpoints:
 *   GET    /admin/dashboard
 *   GET    /admin/organisations
 *   POST   /admin/organisations
 *   GET    /admin/organisations/:id
 *   PUT    /admin/organisations/:id
 *   DELETE /admin/organisations/:id
 *   POST   /admin/organisations/:id/suspend
 *   POST   /admin/organisations/:id/restore
 *   GET    /admin/users
 *   POST   /admin/users
 *   PUT    /admin/users/:id
 *   DELETE /admin/users/:id
 *   POST   /admin/users/:id/impersonate
 *   GET    /admin/organisations/:id/extensions
 *   PUT    /admin/organisations/:id/extensions
 *   GET    /admin/billing
 *   GET    /admin/billing/events
 *   GET    /admin/files
 *   GET    /admin/contracts
 *   GET    /admin/notifications
 *   POST   /admin/notifications/broadcast
 *   GET    /admin/jobs
 *   POST   /admin/jobs/:name/trigger
 *   GET    /admin/audit
 *   GET    /admin/subscription-plans
 *   POST   /admin/subscription-plans
 *   PUT    /admin/subscription-plans/:id
 *   DELETE /admin/subscription-plans/:id
 */

import { EXTENSION_KEYS, type ExtensionKey } from "../../extensions";
import { deleteStore, getStore, listStore, upsertStore } from "../state";
import { json, notFound, parseId, type MockHandler } from "../shared";

function nowIso() {
  return new Date().toISOString();
}

function organisationExtensions(orgId: number): Record<ExtensionKey, boolean> {
  const row = getStore("organisationExtensions", orgId);
  const result = {} as Record<ExtensionKey, boolean>;
  for (const key of EXTENSION_KEYS) {
    result[key] = row ? Boolean(row[key]) : false;
  }
  return result;
}

export const adminHandler: MockHandler = ({ path, method, body, query }) => {
  if (!path.startsWith("/admin")) return null;

  // ── Dashboard ──────────────────────────────────────────────────────────
  if (path === "/admin/dashboard" && method === "GET") {
    const orgs = listStore("organisations");
    const users = listStore("users");
    const jobs = listStore("jobRuns");
    const events = listStore("auditEvents");
    return json({
      kpis: {
        organisations: orgs.length,
        active_organisations: orgs.filter((o) => o.status === "active").length,
        suspended_organisations: orgs.filter((o) => o.status === "suspended").length,
        users: users.length,
        jobs_running: jobs.filter((j) => j.status === "running").length,
        events_today: events.length,
      },
      recent_organisations: orgs.slice(-3).reverse(),
      recent_events: events.slice(-5).reverse(),
      jobs_status: {
        running: jobs.filter((j) => j.status === "running").length,
        succeeded: jobs.filter((j) => j.status === "succeeded").length,
        failed: jobs.filter((j) => j.status === "failed").length,
      },
    });
  }

  // ── Organisations ──────────────────────────────────────────────────────
  if (path === "/admin/organisations" && method === "GET") {
    const status = query.get("status");
    const q = query.get("q")?.trim().toLowerCase();
    let rows = listStore("organisations").slice();
    if (status) rows = rows.filter((row) => row.status === status);
    if (q)
      rows = rows.filter((row) =>
        `${row.name} ${row.slug} ${row.contact_email}`
          .toLowerCase()
          .includes(q)
      );
    return json(rows);
  }
  if (path === "/admin/organisations" && method === "POST") {
    const name = String(body?.name ?? "").trim();
    if (!name) return json({ message: "Numele este obligatoriu." }, 400);
    const slug =
      String(body?.slug ?? "").trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const created = upsertStore("organisations", {
      name,
      slug,
      status: String(body?.status ?? "active"),
      plan: String(body?.plan ?? "Free"),
      employees: Number(body?.employees ?? 0),
      contact_email: String(body?.contact_email ?? ""),
      country: String(body?.country ?? "RO"),
      cui: body?.cui != null ? Number(body.cui) : null,
      address: String(body?.address ?? ""),
      created_at: nowIso(),
    });
    // Provision default extensions row (everything off — Stripe upgrades flip).
    upsertStore(
      "organisationExtensions",
      {
        organisation_id: created.id,
        contracts_pro: false,
        ticketing_pro: false,
        hr_pro: false,
        internal_chat: false,
        legislation_monitor: false,
        ai_assistant: false,
        multi_site_teams: false,
      },
      Number(created.id)
    );
    upsertStore("auditEvents", {
      organisation_id: created.id,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "organisation.created",
      entity_type: "organisation",
      entity_id: created.id,
      details: `name=${name}`,
      created_at: nowIso(),
    });
    return json(created, 201);
  }

  const orgIdMatch = path.match(/^\/admin\/organisations\/(\d+)$/);
  if (orgIdMatch && method === "GET") {
    const id = parseId(orgIdMatch[1]);
    if (!id) return notFound();
    const org = getStore("organisations", id);
    if (!org) return notFound("Organisation not found");
    return json({
      ...org,
      extensions: organisationExtensions(id),
    });
  }
  if (orgIdMatch && method === "PUT") {
    const id = parseId(orgIdMatch[1]);
    if (!id) return notFound();
    const existing = getStore("organisations", id);
    if (!existing) return notFound();
    const updated = upsertStore("organisations", { ...existing, ...(body ?? {}) }, id);
    upsertStore("auditEvents", {
      organisation_id: id,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "organisation.updated",
      entity_type: "organisation",
      entity_id: id,
      created_at: nowIso(),
    });
    return json(updated);
  }
  if (orgIdMatch && method === "DELETE") {
    const id = parseId(orgIdMatch[1]);
    if (!id) return notFound();
    const ok = deleteStore("organisations", id);
    if (!ok) return notFound();
    deleteStore("organisationExtensions", id);
    upsertStore("auditEvents", {
      organisation_id: id,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "organisation.deleted",
      entity_type: "organisation",
      entity_id: id,
      created_at: nowIso(),
    });
    return json({ message: "Organisation deleted." });
  }

  const orgActionMatch = path.match(/^\/admin\/organisations\/(\d+)\/(suspend|restore)$/);
  if (orgActionMatch && method === "POST") {
    const id = parseId(orgActionMatch[1]);
    const action = orgActionMatch[2];
    if (!id) return notFound();
    const existing = getStore("organisations", id);
    if (!existing) return notFound();
    const next = upsertStore(
      "organisations",
      { ...existing, status: action === "suspend" ? "suspended" : "active" },
      id
    );
    upsertStore("auditEvents", {
      organisation_id: id,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: action === "suspend" ? "organisation.suspended" : "organisation.restored",
      entity_type: "organisation",
      entity_id: id,
      created_at: nowIso(),
    });
    return json(next);
  }

  const orgExtMatch = path.match(/^\/admin\/organisations\/(\d+)\/extensions$/);
  if (orgExtMatch && method === "GET") {
    const id = parseId(orgExtMatch[1]);
    if (!id) return notFound();
    return json({ extensions: organisationExtensions(id) });
  }
  if (orgExtMatch && method === "PUT") {
    const id = parseId(orgExtMatch[1]);
    if (!id) return notFound();
    const key = body?.key;
    const enabled = body?.enabled;
    if (typeof key !== "string" || !(EXTENSION_KEYS as readonly string[]).includes(key)) {
      return json({ message: "Invalid extension key" }, 400);
    }
    if (typeof enabled !== "boolean") {
      return json({ message: "enabled boolean required" }, 400);
    }
    const existing = getStore("organisationExtensions", id);
    const next = upsertStore(
      "organisationExtensions",
      {
        ...(existing ?? { organisation_id: id }),
        [key]: enabled,
      },
      id
    );
    upsertStore("auditEvents", {
      organisation_id: id,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "extension.toggled",
      entity_type: "organisation",
      entity_id: id,
      details: `${key}: ${!enabled} → ${enabled}`,
      created_at: nowIso(),
    });
    return json({ extensions: organisationExtensions(id), record: next });
  }

  // ── Users ──────────────────────────────────────────────────────────────
  if (path === "/admin/users" && method === "GET") {
    const orgId = query.get("organisation_id");
    const q = query.get("q")?.trim().toLowerCase();
    let rows = listStore("users").slice();
    if (orgId) {
      const oid = Number.parseInt(orgId, 10);
      rows = rows.filter((u) => Number(u.organisation_id ?? 1) === oid);
    }
    if (q)
      rows = rows.filter((u) =>
        `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q)
      );
    return json(rows);
  }
  if (path === "/admin/users" && method === "POST") {
    const firstName = String(body?.first_name ?? "").trim();
    const lastName = String(body?.last_name ?? "").trim();
    const fallbackName = String(body?.name ?? "").trim();
    const fullName =
      firstName || lastName ? `${firstName} ${lastName}`.trim() : fallbackName;
    if (!fullName) return json({ message: "Numele este obligatoriu." }, 400);
    const email = String(body?.email ?? "").trim();
    if (!email) return json({ message: "Email obligatoriu." }, 400);
    const created = upsertStore("users", {
      name: fullName,
      first_name: firstName || fallbackName,
      last_name: lastName || "",
      email,
      phone: String(body?.phone ?? ""),
      type: String(body?.type ?? "accountant"),
      status: String(body?.status ?? "active"),
      role_id: Number(body?.role_id ?? 2),
      role_ids: body?.role_ids ?? [Number(body?.role_id ?? 2)],
      organisation_id: Number(body?.organisation_id ?? 1),
      title: String(body?.title ?? ""),
      date_added: nowIso(),
    });
    upsertStore("auditEvents", {
      organisation_id: Number(body?.organisation_id ?? 1),
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "user.created",
      entity_type: "user",
      entity_id: created.id,
      details: `email=${email}`,
      created_at: nowIso(),
    });
    return json(created, 201);
  }

  const adminUserIdMatch = path.match(/^\/admin\/users\/(\d+)$/);
  if (adminUserIdMatch && method === "GET") {
    const id = parseId(adminUserIdMatch[1]);
    if (!id) return notFound();
    const user = getStore("users", id);
    return user ? json(user) : notFound();
  }
  if (adminUserIdMatch && method === "PUT") {
    const id = parseId(adminUserIdMatch[1]);
    if (!id) return notFound();
    const existing = getStore("users", id);
    if (!existing) return notFound();
    return json(upsertStore("users", { ...existing, ...(body ?? {}) }, id));
  }
  if (adminUserIdMatch && method === "DELETE") {
    const id = parseId(adminUserIdMatch[1]);
    if (!id) return notFound();
    const ok = deleteStore("users", id);
    if (!ok) return notFound();
    upsertStore("auditEvents", {
      organisation_id: 0,
      actor_kind: "admin",
      actor_id: 99,
      actor_name: "Platform Admin",
      action: "user.deleted",
      entity_type: "user",
      entity_id: id,
      created_at: nowIso(),
    });
    return json({ message: "User deleted." });
  }

  const impersonateMatch = path.match(/^\/admin\/users\/(\d+)\/impersonate$/);
  if (impersonateMatch && method === "POST") {
    const id = parseId(impersonateMatch[1]);
    if (!id) return notFound();
    const user = getStore("users", id);
    if (!user) return notFound();
    return json({
      message: "Impersonation token issued.",
      user_id: id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }

  // ── Subscription plans ────────────────────────────────────────────────
  if (path === "/admin/subscription-plans" && method === "GET") {
    return json(
      listStore("subscriptionPlans").sort((a, b) => Number(a.id) - Number(b.id))
    );
  }
  if (path === "/admin/subscription-plans" && method === "POST") {
    const name = String(body?.name ?? "").trim();
    if (!name) return json({ message: "Numele planului este obligatoriu." }, 400);
    const created = upsertStore("subscriptionPlans", {
      slug: String(body?.slug ?? name.toLowerCase().replace(/\s+/g, "-")),
      name,
      price: Number(body?.price ?? 0),
      currency: String(body?.currency ?? "RON"),
      stripe_price_id: body?.stripe_price_id ?? null,
      limits: body?.limits ?? {},
      features: Array.isArray(body?.features) ? body.features : [],
      created_at: nowIso(),
    });
    return json(created, 201);
  }

  const planIdMatch = path.match(/^\/admin\/subscription-plans\/(\d+)$/);
  if (planIdMatch && method === "PUT") {
    const id = parseId(planIdMatch[1]);
    if (!id) return notFound();
    const existing = getStore("subscriptionPlans", id);
    if (!existing) return notFound();
    return json(
      upsertStore("subscriptionPlans", { ...existing, ...(body ?? {}) }, id)
    );
  }
  if (planIdMatch && method === "DELETE") {
    const id = parseId(planIdMatch[1]);
    if (!id) return notFound();
    const ok = deleteStore("subscriptionPlans", id);
    return ok ? json({ message: "Plan șters." }) : notFound();
  }

  // ── Billing ────────────────────────────────────────────────────────────
  if (path === "/admin/billing" && method === "GET") {
    const orgs = listStore("organisations");
    return json({
      mrr_eur: orgs.reduce((acc, o) => acc + (o.plan === "Business" ? 200 : o.plan === "Pro" ? 100 : 50), 0),
      active_subscriptions: orgs.filter((o) => o.status === "active").length,
      trialing: orgs.filter((o) => o.status === "trialing").length,
      past_due: 0,
      organisations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        plan: o.plan,
        status: o.status,
        renewal_at: new Date(Date.now() + 25 * 86400000).toISOString(),
      })),
    });
  }
  if (path === "/admin/billing/events" && method === "GET") {
    return json([
      { id: "evt_001", type: "invoice.paid", organisation_id: 1, amount_eur: 200, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "evt_002", type: "checkout.session.completed", organisation_id: 3, amount_eur: 0, created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: "evt_003", type: "invoice.payment_failed", organisation_id: 4, amount_eur: 150, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    ]);
  }

  // ── Files ──────────────────────────────────────────────────────────────
  if (path === "/admin/files" && method === "GET") {
    const orgs = listStore("organisations");
    return json({
      total_storage_mb: 1840,
      orphans: 12,
      per_organisation: orgs.map((o) => ({
        organisation_id: o.id,
        name: o.name,
        used_mb: 80 + (o.id * 60) % 720,
        files: 14 + (o.id * 7) % 50,
      })),
    });
  }

  // ── Contracts overview ────────────────────────────────────────────────
  if (path === "/admin/contracts" && method === "GET") {
    const templates = listStore("templates");
    const invites = listStore("invites");
    const submissions = listStore("submissions");
    return json({
      templates_total: templates.length,
      invites_active: invites.filter((i) => i.status !== "signed" && i.status !== "expired").length,
      invites_signed: invites.filter((i) => i.status === "signed").length,
      submissions_total: submissions.length,
      latest_submissions: submissions.slice(-5).reverse(),
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────
  if (path === "/admin/notifications" && method === "GET") {
    return json(listStore("notifications").slice(-10).reverse());
  }
  if (path === "/admin/notifications/broadcast" && method === "POST") {
    const title = String(body?.title ?? "Anunț platform admin");
    const text = String(body?.body ?? "");
    upsertStore("notifications", {
      user_id: 0,
      title,
      body: text,
      kind: "broadcast",
      link: "/app/dashboard",
      read_at: null,
    });
    return json({ message: "Broadcast trimis.", title });
  }

  // ── Jobs ──────────────────────────────────────────────────────────────
  if (path === "/admin/jobs" && method === "GET") {
    return json(listStore("jobRuns").sort((a, b) => Number(b.id) - Number(a.id)));
  }
  const jobTriggerMatch = path.match(/^\/admin\/jobs\/([^/]+)\/trigger$/);
  if (jobTriggerMatch && method === "POST") {
    const name = jobTriggerMatch[1];
    const run = upsertStore("jobRuns", {
      job_name: name,
      status: "succeeded",
      started_at: nowIso(),
      finished_at: nowIso(),
      duration_ms: 320,
      affected: 1,
    });
    return json({ message: `Job ${name} declanșat.`, run });
  }

  // ── Audit ─────────────────────────────────────────────────────────────
  if (path === "/admin/audit" && method === "GET") {
    const orgId = query.get("organisation_id");
    const action = query.get("action");
    let rows = listStore("auditEvents").slice();
    if (orgId) rows = rows.filter((r) => String(r.organisation_id) === orgId);
    if (action) rows = rows.filter((r) => String(r.action) === action);
    rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return json(rows);
  }

  return null;
};
