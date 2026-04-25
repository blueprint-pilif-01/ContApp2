import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAdmin, loginUser, logout } from "../src/hooks/useMe";
import { clearSession, getSession } from "../src/lib/session";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => clearSession());

describe("loginUser", () => {
  it("POSTs /auth/user/login with email + password and persists the session", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          token: { access_token: "u.tok", refresh_token: "u.ref" },
          user: {
            id: 5,
            organisation_id: 9,
            type: "accountant",
            first_name: "Ana",
            last_name: "Ion",
            email: "ana@x.ro",
            phone: "+40",
            status: "active",
            role: "accountant",
            permissions: ["notes:manage"],
          },
        },
        202
      )
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const principal = await loginUser({ email: "ana@x.ro", password: "p" });
    expect(principal.kind).toBe("user");
    expect(principal.id).toBe(5);
    expect(principal.permissions).toContain("notes:manage");

    const session = getSession();
    expect(session?.accessToken).toBe("u.tok");
    expect(session?.principal.kind).toBe("user");

    // Verify it used the right URL / method
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("/auth/user/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    // No bearer should be attached on login
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBeUndefined();
  });

  it("falls back to local mock session on bad credentials", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ message: "wrong password" }, 400)
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const principal = await loginUser({ email: "a@b.ro", password: "x" });
    expect(principal.kind).toBe("user");
    expect(getSession()?.principal.kind).toBe("user");
  });
});

describe("loginAdmin", () => {
  it("POSTs /auth/admin/login and sets an admin principal", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          token: { access_token: "a.tok", refresh_token: "a.ref" },
          admin: {
            id: 1,
            first_name: "Platform",
            last_name: "Admin",
            email: "admin@x.ro",
            role: "platform_admin",
            permissions: ["*"],
          },
        },
        202
      )
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const principal = await loginAdmin({ email: "admin@x.ro", password: "p" });
    expect(principal.kind).toBe("admin");
    expect(principal.role).toBe("platform_admin");
    expect(getSession()?.accessToken).toBe("a.tok");

    const [url] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("/auth/admin/login");
  });
});

describe("logout", () => {
  it("POSTs /auth/logout and always clears the local session", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    // Seed a session first
    const { setSession } = await import("../src/lib/session");
    setSession({
      accessToken: "t",
      principal: {
        kind: "user",
        id: 1,
        organisation_id: 1,
        type: "x",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        status: "",
        role: "",
        permissions: [],
      },
    });

    await logout();

    expect(String(fetchFn.mock.calls[0]![0])).toBe("/auth/logout");
    expect(fetchFn.mock.calls[0]![1].method).toBe("POST");
    expect(getSession()).toBe(null);
  });

  it("still clears the local session if /auth/logout errors", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "boom" }, 500));
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const { setSession } = await import("../src/lib/session");
    setSession({
      accessToken: "t",
      principal: {
        kind: "admin",
        id: 1,
        first_name: "",
        last_name: "",
        email: "",
        role: "platform_admin",
        permissions: [],
      },
    });

    await logout();
    expect(getSession()).toBe(null);
  });
});
