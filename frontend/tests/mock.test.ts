import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../src/lib/mock";

describe("mock API installer", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("intercepts POST /user/login and returns a user principal", async () => {
    installMockApi();
    const res = await fetch("http://localhost/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.ro", password: "x" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      access_token: string;
      account: { email: string };
    };
    expect(body.access_token).toBeTruthy();
    expect(body.account.email).toBe("andrei@contapp.ro");
  });

  it("intercepts POST /admin/login and returns an admin principal", async () => {
    installMockApi();
    const res = await fetch("http://localhost/admin/login", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as {
      admin: { email: string };
    };
    expect(body.admin.email).toBe("admin@contapp.ro");
  });

  it("roundtrips a create/read/delete on /user/clients", async () => {
    installMockApi();
    const create = await fetch("http://localhost/user/clients", {
      method: "POST",
      body: JSON.stringify({ first_name: "A", last_name: "B" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      id: number;
    };
    const id = created.id;
    expect(typeof id).toBe("number");

    const read = await fetch(`http://localhost/user/clients/${id}`);
    expect(read.status).toBe(200);
    const record = (await read.json()) as { first_name: string };
    expect(record.first_name).toBe("A");

    const del = await fetch(`http://localhost/user/clients/${id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    const readAgain = await fetch(`http://localhost/user/clients/${id}`);
    expect(readAgain.status).toBe(404);
  });

  it("passes unknown URLs through to the original fetch", async () => {
    let passedThrough = false;
    const passThrough = (() => {
      passedThrough = true;
      return Promise.resolve(new Response("ok", { status: 200 }));
    }) as unknown as typeof fetch;
    globalThis.fetch = passThrough;

    installMockApi();
    await fetch("http://localhost/some/other/path");
    expect(passedThrough).toBe(true);
  });
});
