import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, userApi, adminApi, isApiError, type ApiError } from "../src/lib/api";
import { clearSession, setSession } from "../src/lib/session";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(): FetchMock {
  const fn = vi.fn();
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  clearSession();
});

describe("api client — headers & body", () => {
  it("sends Accept and Content-Type for JSON POST", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ ok: true }));

    await api.post("/user/login", { email: "a", password: "b" }, { skipAuth: true });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("/user/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    const h = init.headers as Record<string, string>;
    expect(h.Accept).toBe("application/json");
    expect(h["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "a", password: "b" }));
  });

  it("skips Authorization when skipAuth is true", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({}));

    setSession({
      accessToken: "tok.a",
      principal: {
        kind: "user",
        id: 1,
        organisation_id: null,
        membership_id: null,
        workspace_name: "",
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

    await api.post("/user/login", { a: 1 }, { skipAuth: true });
    const [, init] = fetchFn.mock.calls[0]!;
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBeUndefined();
  });

  it("attaches Bearer token when a session exists", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: 1 }));

    setSession({
      accessToken: "tok.xyz",
      principal: {
        kind: "user",
        id: 1,
        organisation_id: null,
        membership_id: null,
        workspace_name: "",
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

    await userApi.get("/clients/1");

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("/clients/1");
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer tok.xyz");
  });

  it("does not set Content-Type for FormData uploads", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: 9 }, 201));

    const fd = new FormData();
    fd.append("file", new Blob(["x"]), "x.txt");
    await userApi.upload("/files", fd);

    const [, init] = fetchFn.mock.calls[0]!;
    const h = init.headers as Record<string, string>;
    expect(h["Content-Type"]).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("returns null for 204 No Content", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(new Response(null, { status: 204 }));
    const result = await api.post("/auth/logout");
    expect(result).toBeNull();
  });

  it("adminApi routes share the API root (no actor prefix)", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: 1 }));
    await adminApi.delete("/users/7");
    expect(String(fetchFn.mock.calls[0]![0])).toBe("/users/7");
    expect(fetchFn.mock.calls[0]![1].method).toBe("DELETE");
  });
});

describe("api client — errors", () => {
  it("throws normalized ApiError with message+status+code", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(
      jsonResponse({ message: "bad", code: "BAD_INPUT" }, 400)
    );

    let caught: unknown;
    try {
      await api.post("/user/login", { a: 1 }, { skipAuth: true });
    } catch (e) {
      caught = e;
    }
    expect(isApiError(caught)).toBe(true);
    const err = caught as ApiError;
    expect(err.status).toBe(400);
    expect(err.message).toBe("bad");
    expect(err.code).toBe("BAD_INPUT");
  });

  it("falls back to 'Eroare {status}' when no message field", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({}, 500));
    await expect(
      api.post("/user/login", {}, { skipAuth: true })
    ).rejects.toMatchObject({ status: 500, message: "Eroare 500" });
  });
});

describe("api client — 401 refresh flow", () => {
  function makePrincipal() {
    return {
      kind: "user" as const,
      id: 42,
      organisation_id: 1,
      membership_id: 1,
      workspace_name: "Demo",
      workspaces: [],
      type: "accountant",
      first_name: "T",
      last_name: "U",
      email: "t@u.ro",
      phone: "",
      status: "active",
      role: "accountant",
      permissions: [],
    };
  }

  it("retries once after a successful /auth/refresh-token", async () => {
    setSession({ accessToken: "old.token", principal: makePrincipal() });

    const fetchFn = mockFetch();
    let call = 0;
    fetchFn.mockImplementation(async (url: string) => {
      call += 1;
      if (call === 1) {
        expect(url).toBe("/clients/1");
        return jsonResponse({ message: "expired" }, 401);
      }
      if (call === 2) {
        expect(url).toBe("/auth/refresh-token");
        return jsonResponse({ access_token: "new.token", refresh_token: "r" });
      }
      if (call === 3) {
        expect(url).toBe("/clients/1");
        return jsonResponse({ id: 1, first_name: "X" });
      }
      throw new Error("unexpected extra call #" + call);
    });

    const result = await userApi.get<{ id: number }>("/clients/1");
    expect(result.id).toBe(1);
    expect(fetchFn).toHaveBeenCalledTimes(3);

    // The retried request must carry the NEW bearer token.
    const retryInit = fetchFn.mock.calls[2]![1];
    expect(
      (retryInit.headers as Record<string, string>).Authorization
    ).toBe("Bearer new.token");
  });

  it("clears the session and rethrows when refresh fails", async () => {
    setSession({ accessToken: "old.token", principal: makePrincipal() });

    const fetchFn = mockFetch();
    fetchFn.mockImplementation(async (url: string) => {
      if (url === "/auth/refresh-token") return jsonResponse({}, 401);
      return jsonResponse({ message: "nope" }, 401);
    });

    await expect(userApi.get("/clients/1")).rejects.toMatchObject({
      status: 401,
    });

    // session should be cleared
    const { getSession } = await import("../src/lib/session");
    expect(getSession()).toBe(null);
  });

  it("does not attempt refresh when skipAuth=true (login endpoints)", async () => {
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(
      jsonResponse({ message: "wrong password" }, 401)
    );

    await expect(
      api.post("/user/login", { email: "a", password: "b" }, { skipAuth: true })
    ).rejects.toMatchObject({ status: 401 });

    // Only ONE call — no refresh attempted
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
