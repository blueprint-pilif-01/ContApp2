import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { createResource } from "../src/hooks/createResource";
import { clearSession, setSession } from "../src/lib/session";

interface Widget {
  id: number;
  name: string;
}
interface WidgetCreate {
  name: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Provider = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { Provider, qc };
}

const Widgets = createResource<Widget, WidgetCreate>({
  path: "widgets",
  keyPrefix: "widgets",
});

function seedUser() {
  setSession({
    accessToken: "u.tok",
    principal: {
      kind: "user",
      id: 5,
      organisation_id: 1,
      membership_id: 1,
      workspace_name: "Demo",
      workspaces: [],
      type: "accountant",
      first_name: "A",
      last_name: "B",
      email: "a@b.ro",
      phone: "",
      status: "active",
      role: "accountant",
      permissions: [],
    },
  });
}

function seedAdmin() {
  setSession({
    accessToken: "a.tok",
    principal: {
      kind: "admin",
      id: 1,
      first_name: "P",
      last_name: "A",
      email: "p@a.ro",
      role: "platform_admin",
      permissions: ["*"],
    },
  });
}

beforeEach(() => {
  clearSession();
});

describe("createResource — useById", () => {
  it("is disabled when id is undefined", async () => {
    seedUser();
    const fetchFn = vi.fn();
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useById(undefined), {
      wrapper: Provider,
    });

    // Query must not have been fired
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches /widgets/:id for a user session", async () => {
    seedUser();
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 3, name: "alpha" }));
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useById(3), {
      wrapper: Provider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 3, name: "alpha" });
    expect(String(fetchFn.mock.calls[0]![0])).toBe("/widgets/3");
  });

  it("fetches /widgets/:id for an admin session (no actor prefix)", async () => {
    seedAdmin();
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 7, name: "beta" }));
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useById(7), {
      wrapper: Provider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(String(fetchFn.mock.calls[0]![0])).toBe("/widgets/7");
  });
});

describe("createResource — useCreate", () => {
  it("extracts id from { data: { id } } wrapper and exposes raw", async () => {
    seedUser();
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: false, message: "Widget created", data: { id: 99 } },
        201
      )
    );
    globalThis.fetch = fetchFn as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useCreate(), {
      wrapper: Provider,
    });

    let res;
    await act(async () => {
      res = await result.current.mutateAsync({ name: "gamma" });
    });
    expect(res!.id).toBe(99);

    // URL + method + body
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("/widgets");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "gamma" });
  });

  it("extracts id from a top-level { id } response", async () => {
    seedUser();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 10, name: "x" }, 201)) as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useCreate(), {
      wrapper: Provider,
    });

    let res;
    await act(async () => {
      res = await result.current.mutateAsync({ name: "x" });
    });
    expect(res!.id).toBe(10);
  });

  it("leaves id undefined when neither shape is returned", async () => {
    seedUser();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: false, message: "ok" }, 201)) as unknown as typeof fetch;

    const { Provider } = wrapper();
    const { result } = renderHook(() => Widgets.useCreate(), {
      wrapper: Provider,
    });

    let res;
    await act(async () => {
      res = await result.current.mutateAsync({ name: "x" });
    });
    expect(res!.id).toBeUndefined();
  });
});

describe("createResource — useDelete", () => {
  it("calls DELETE /widgets/:id and invalidates the cache", async () => {
    seedUser();
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ error: false, message: "Widget deleted" })
    ) as unknown as typeof fetch;

    const { Provider, qc } = wrapper();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => Widgets.useDelete(), {
      wrapper: Provider,
    });

    await act(async () => {
      await result.current.mutateAsync(42);
    });

    const call = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    expect(String(call[0])).toBe("/widgets/42");
    expect(call[1].method).toBe("DELETE");
    expect(spy).toHaveBeenCalled();
  });
});
