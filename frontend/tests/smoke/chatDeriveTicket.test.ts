import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../../src/lib/mock";

describe("smoke: chat derive-ticket", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    installMockApi();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POST /chat/derive-ticket creates a new ticket and returns it", async () => {
    const res = await fetch("http://localhost/chat/derive-ticket", {
      method: "POST",
      body: JSON.stringify({ message: "Verifică contractul cu Alfa SRL." }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ticket: { id: number; title: string; status: string };
      confirmation: string;
    };
    expect(body.ticket).toBeTruthy();
    expect(typeof body.ticket.id).toBe("number");
    expect(body.ticket.status).toBe("todo");
    expect(body.confirmation).toMatch(/ticket/i);

    // The new ticket should be visible via the renamed list endpoint.
    const list = (await (
      await fetch("http://localhost/ticketing/tickets")
    ).json()) as Array<{ id: number }>;
    expect(list.some((t) => t.id === body.ticket.id)).toBe(true);
  });

  it("legacy /chat/derive-task is no longer mocked (falls through)", async () => {
    let mockedOk = false;
    try {
      const res = await fetch("http://localhost/chat/derive-task", {
        method: "POST",
        body: JSON.stringify({ message: "x" }),
      });
      mockedOk = res.ok;
    } catch {
      mockedOk = false;
    }
    expect(mockedOk).toBe(false);
  });
});
