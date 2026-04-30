/**
 * Billing / extensions / subscription / public offer-request mock surface.
 *
 * Endpoints owned here:
 *   GET   /organisations/me/extensions      → { extensions: { ...key: bool } }
 *   PUT   /organisations/me/extensions      → { key, enabled } persists toggle
 *   GET   /organisations/me/subscription    → plan + usage + limits
 *   POST  /contact/offer-request            → public landing form (no auth)
 *   GET   /admin/contact-requests           → admin inbox of offer requests
 *
 * Toggle state is persisted in `localStorage` (key:
 * `contapp_mock_extensions`) so dev sessions feel real across reloads.
 */

import {
  DEFAULT_EXTENSION_STATE,
  EXTENSION_KEYS,
  type ExtensionKey,
} from "../../extensions";
import { json, type MockHandler } from "../shared";
import { listStore, upsertStore } from "../state";

const STORAGE_KEY = "contapp_mock_extensions";

type ExtensionState = Record<ExtensionKey, boolean>;

function readState(): ExtensionState {
  if (typeof window === "undefined") return { ...DEFAULT_EXTENSION_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXTENSION_STATE };
    const parsed = JSON.parse(raw) as Partial<ExtensionState>;
    const next = { ...DEFAULT_EXTENSION_STATE };
    for (const key of EXTENSION_KEYS) {
      if (typeof parsed[key] === "boolean") next[key] = parsed[key]!;
    }
    return next;
  } catch {
    return { ...DEFAULT_EXTENSION_STATE };
  }
}

function writeState(state: ExtensionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

function isExtensionKey(value: unknown): value is ExtensionKey {
  return typeof value === "string" && (EXTENSION_KEYS as readonly string[]).includes(value);
}

export const billingHandler: MockHandler = ({ path, method, body }) => {
  if (path === "/organisations/me/extensions" && method === "GET") {
    return json({ extensions: readState() });
  }

  if (path === "/organisations/me/extensions" && method === "PUT") {
    const key = body?.key;
    const enabled = body?.enabled;
    if (!isExtensionKey(key) || typeof enabled !== "boolean") {
      return json({ message: "Invalid payload: { key, enabled } required." }, 400);
    }
    const state = readState();
    state[key] = enabled;
    writeState(state);
    return json({ extensions: state });
  }

  if (path === "/organisations/me/subscription" && method === "GET") {
    const extensions = readState();
    const templatesCount = listStore("templates").length;
    const submissionsCount = listStore("submissions").length;
    const clientsCount = listStore("clients").length;

    return json({
      id: "mock-subscription-1",
      plan: "Business",
      status: "active",
      period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancel_at_period_end: false,
      extensions,
      limits: {
        templates: 30,
        signings_per_month: 300,
        clients: null,
        storage_mb: 5120,
      },
      usage: {
        templates: templatesCount,
        signings_this_month: submissionsCount,
        clients: clientsCount,
        storage_mb: 320,
      },
    });
  }

  // ── Public offer request (landing page form, no auth) ────────────────
  if (path === "/contact/offer-request" && method === "POST") {
    const companyName = String(body?.company_name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    if (!companyName || !email) {
      return json(
        { message: "Numele firmei și email-ul sunt obligatorii." },
        400
      );
    }
    const created = upsertStore("contactRequests", {
      company_name: companyName,
      contact_name: String(body?.contact_name ?? ""),
      email,
      phone: String(body?.phone ?? ""),
      employee_band: String(body?.employee_band ?? ""),
      extensions: Array.isArray(body?.extensions) ? body.extensions : [],
      message: String(body?.message ?? ""),
      status: "new",
      created_at: new Date().toISOString(),
    });
    // Surface in admin notifications inbox so platform admins see it.
    upsertStore("notifications", {
      user_id: 0,
      title: `Nouă cerere ofertă: ${companyName}`,
      body: `${email} — banda ${body?.employee_band ?? "—"} · ${
        Array.isArray(body?.extensions) ? body.extensions.length : 0
      } extensii.`,
      kind: "offer_request",
      link: "/admin/notifications",
      read_at: null,
    });
    return json(
      {
        message: "Cererea ta a fost înregistrată. Te contactăm în curând.",
        ticket_id: `OFER-${String(created.id).padStart(5, "0")}`,
      },
      201
    );
  }

  if (path === "/admin/contact-requests" && method === "GET") {
    return json(
      listStore("contactRequests").sort((a, b) => Number(b.id) - Number(a.id))
    );
  }

  return null;
};
