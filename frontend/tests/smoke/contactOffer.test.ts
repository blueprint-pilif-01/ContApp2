import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../../src/lib/mock";

describe("smoke: public contact / offer-request endpoint", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    installMockApi();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POST /contact/offer-request creates a request and surfaces it as an admin notification", async () => {
    const beforeNotifs = (await (
      await fetch("http://localhost/admin/notifications")
    ).json()) as Array<unknown>;

    const res = await fetch("http://localhost/contact/offer-request", {
      method: "POST",
      body: JSON.stringify({
        company_name: "Atlas Trading SRL",
        contact_name: "Ion Popescu",
        email: "ion@atlas.ro",
        phone: "+40 721 234 567",
        employee_band: "11-20",
        extensions: ["contracts_pro", "ticketing_pro"],
        message: "Vrem o demo pentru echipa noastră.",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ticket_id: string; message: string };
    expect(body.ticket_id).toMatch(/^OFER-\d+$/);
    expect(body.message).toBeTruthy();

    const afterNotifs = (await (
      await fetch("http://localhost/admin/notifications")
    ).json()) as Array<{ kind: string; title: string }>;
    expect(afterNotifs.length).toBeGreaterThan(beforeNotifs.length);
    const first = afterNotifs[0];
    expect(first?.kind).toBe("offer_request");
    expect(first?.title).toContain("Atlas Trading SRL");
  });

  it("POST /contact/offer-request rejects when company_name or email are missing", async () => {
    const res = await fetch("http://localhost/contact/offer-request", {
      method: "POST",
      body: JSON.stringify({ company_name: "X" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /admin/contact-requests returns the inbox sorted by newest", async () => {
    await fetch("http://localhost/contact/offer-request", {
      method: "POST",
      body: JSON.stringify({
        company_name: "First Co",
        email: "a@first.ro",
        employee_band: "1-10",
        extensions: [],
      }),
    });
    await fetch("http://localhost/contact/offer-request", {
      method: "POST",
      body: JSON.stringify({
        company_name: "Second Co",
        email: "b@second.ro",
        employee_band: "21-30",
        extensions: ["hr_pro", "internal_chat"],
      }),
    });
    const res = await fetch("http://localhost/admin/contact-requests");
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{
      company_name: string;
      employee_band: string;
      extensions: string[];
    }>;
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0]?.company_name).toBe("Second Co");
    expect(list[0]?.extensions).toEqual(["hr_pro", "internal_chat"]);
  });
});
