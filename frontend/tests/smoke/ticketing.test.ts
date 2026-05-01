import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../../src/lib/mock";

describe("smoke: ticketing endpoints (renamed to /ticketing/tickets)", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    installMockApi();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET /ticketing/tickets returns the seeded ticket list", async () => {
    const res = await fetch("http://localhost/ticketing/tickets");
    expect(res.status).toBe(200);
    const tickets = (await res.json()) as Array<{
      id: number;
      title: string;
      status: string;
    }>;
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]).toHaveProperty("title");
    expect(tickets[0]).toHaveProperty("status");
  });

  it("GET /ticketing/tickets supports ?status= and ?client_id= filters", async () => {
    const all = (await (
      await fetch("http://localhost/ticketing/tickets")
    ).json()) as Array<Record<string, unknown>>;

    const todo = (await (
      await fetch("http://localhost/ticketing/tickets?status=todo")
    ).json()) as Array<{ status: string }>;
    expect(todo.every((t) => t.status === "todo")).toBe(true);

    // Create a ticket bound to client 999 and confirm the filter works.
    await fetch("http://localhost/ticketing/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: "Per-client ticket",
        description: "",
        priority: "low",
        client_id: 999,
      }),
    });

    const filtered = (await (
      await fetch("http://localhost/ticketing/tickets?client_id=999")
    ).json()) as Array<{ client_id: number }>;
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.client_id === 999)).toBe(true);
    expect(filtered.length).toBeLessThan(all.length);
  });

  it("POST /ticketing/tickets creates a ticket and lifecycle endpoints flip status", async () => {
    const create = await fetch("http://localhost/ticketing/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: "Smoke ticket",
        description: "Smoke test body",
        priority: "high",
      }),
    });
    expect(create.status).toBe(201);
    const ticket = (await create.json()) as {
      id: number;
      title: string;
      status: string;
    };
    expect(ticket.title).toBe("Smoke ticket");
    expect(ticket.status).toBe("todo");

    const claim = await fetch(
      `http://localhost/ticketing/tickets/${ticket.id}/claim`,
      {
        method: "POST",
        body: JSON.stringify({ assignee_id: 1 }),
      }
    );
    const claimed = (await claim.json()) as { status: string };
    expect(claimed.status).toBe("in_progress");

    const complete = await fetch(
      `http://localhost/ticketing/tickets/${ticket.id}/complete`,
      { method: "POST" }
    );
    const done = (await complete.json()) as { status: string };
    expect(done.status).toBe("done");

    const refuse = await fetch(
      `http://localhost/ticketing/tickets/${ticket.id}/refuse`,
      { method: "POST" }
    );
    const refused = (await refuse.json()) as {
      status: string;
      assignee_id: number | null;
    };
    expect(refused.status).toBe("todo");
    expect(refused.assignee_id).toBe(null);
  });

  it("PUT /ticketing/tickets/:id updates fields", async () => {
    const create = await fetch("http://localhost/ticketing/tickets", {
      method: "POST",
      body: JSON.stringify({ title: "Edit me" }),
    });
    const t = (await create.json()) as { id: number };

    const update = await fetch(`http://localhost/ticketing/tickets/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ priority: "low" }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as { priority: string };
    expect(updated.priority).toBe("low");
  });

  it("legacy /ticketing/tasks is no longer mocked (falls through)", async () => {
    // The mock now ignores this path. In jsdom there's no server on :80, so
    // the passthrough fetch rejects. Either way, the legacy route is dead.
    let mockedOk = false;
    try {
      const res = await fetch("http://localhost/ticketing/tasks");
      mockedOk = res.ok;
    } catch {
      mockedOk = false;
    }
    expect(mockedOk).toBe(false);
  });
});
