import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../../src/lib/mock";

describe("smoke: admin panel mock surface", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    installMockApi();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET /admin/dashboard returns KPIs and recent rows", async () => {
    const res = await fetch("http://localhost/admin/dashboard");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      kpis: { organisations: number; users: number; events_today: number };
      recent_organisations: unknown[];
      recent_events: unknown[];
      jobs_status: { running: number };
    };
    expect(typeof body.kpis.organisations).toBe("number");
    expect(typeof body.kpis.users).toBe("number");
    expect(Array.isArray(body.recent_organisations)).toBe(true);
    expect(Array.isArray(body.recent_events)).toBe(true);
    expect(typeof body.jobs_status.running).toBe("number");
  });

  it("GET /admin/organisations supports ?status= filter", async () => {
    const all = (await (
      await fetch("http://localhost/admin/organisations")
    ).json()) as Array<{ id: number; status: string }>;
    expect(all.length).toBeGreaterThan(0);

    const suspended = (await (
      await fetch("http://localhost/admin/organisations?status=suspended")
    ).json()) as Array<{ status: string }>;
    expect(suspended.every((o) => o.status === "suspended")).toBe(true);
  });

  it("POST /admin/organisations/:id/suspend flips status and emits an audit event", async () => {
    const beforeAudit = (await (
      await fetch("http://localhost/admin/audit")
    ).json()) as Array<unknown>;

    const res = await fetch("http://localhost/admin/organisations/1/suspend", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as { id: number; status: string };
    expect(updated.id).toBe(1);
    expect(updated.status).toBe("suspended");

    const afterAudit = (await (
      await fetch("http://localhost/admin/audit")
    ).json()) as Array<{ action: string }>;
    expect(afterAudit.length).toBeGreaterThan(beforeAudit.length);
    expect(afterAudit.some((e) => e.action === "organisation.suspended")).toBe(true);

    // Restore so subsequent tests aren't affected.
    await fetch("http://localhost/admin/organisations/1/restore", {
      method: "POST",
    });
  });

  it("PUT /admin/organisations/:id/extensions toggles per-org extension flags", async () => {
    const res = await fetch(
      "http://localhost/admin/organisations/1/extensions",
      {
        method: "PUT",
        body: JSON.stringify({ key: "ai_assistant", enabled: false }),
      }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      extensions: Record<string, boolean>;
    };
    expect(body.extensions.ai_assistant).toBe(false);

    const reread = (await (
      await fetch("http://localhost/admin/organisations/1/extensions")
    ).json()) as { extensions: Record<string, boolean> };
    expect(reread.extensions.ai_assistant).toBe(false);
  });

  it("POST /admin/jobs/:name/trigger appends a successful run", async () => {
    const before = (await (
      await fetch("http://localhost/admin/jobs")
    ).json()) as Array<unknown>;
    const res = await fetch(
      "http://localhost/admin/jobs/legislation_import/trigger",
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      run: { job_name: string; status: string };
    };
    expect(body.run.job_name).toBe("legislation_import");
    expect(body.run.status).toBe("succeeded");

    const after = (await (
      await fetch("http://localhost/admin/jobs")
    ).json()) as Array<unknown>;
    expect(after.length).toBeGreaterThan(before.length);
  });

  it("POST /admin/notifications/broadcast acks the broadcast", async () => {
    const res = await fetch("http://localhost/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify({ title: "Mentenanță", body: "Sâmbătă 03:00" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; title: string };
    expect(body.title).toBe("Mentenanță");
  });
});
