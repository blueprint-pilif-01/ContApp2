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
          access_token: "u.tok",
          token_type: "Bearer",
          account: {
            id: 5,
            first_name: "Ana",
            last_name: "Ion",
            email: "ana@x.ro",
          },
          workspace: {
            membership_id: 15,
            organisation_id: 9,
            name: "Ana Workspace",
            role_label: "Owner",
          },
          workspaces: [
            {
              membership_id: 15,
              organisation_id: 9,
              name: "Ana Workspace",
              role_label: "Owner",
            },
          ],
        },
        200
      )
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const principal = await loginUser({ email: "ana@x.ro", password: "p" });
    expect(principal.kind).toBe("user");
    expect(principal.id).toBe(5);
    expect(principal.organisation_id).toBe(9);
    expect(principal.membership_id).toBe(15);
    expect(principal.workspace_name).toBe("Ana Workspace");
    expect(principal.role).toBe("Owner");

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

  it("does not create a local session on bad credentials", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ error: "invalid credentials" }, 401)
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    await expect(loginUser({ email: "a@b.ro", password: "x" })).rejects.toThrow(
      "invalid credentials"
    );
    expect(getSession()).toBe(null);
  });
});

describe("loginAdmin", () => {
  it("POSTs /auth/admin/login and sets an admin principal", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          access_token: "a.tok",
          token_type: "Bearer",
          admin: {
            id: 1,
            first_name: "Platform",
            last_name: "Admin",
            email: "admin@x.ro",
          },
        },
        200
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
        membership_id: 1,
        workspace_name: "Demo",
        workspaces: [],
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
