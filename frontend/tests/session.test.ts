import { describe, it, expect, beforeEach } from "vitest";
import {
  clearSession,
  getAccessToken,
  getSession,
  setSession,
  subscribe,
  updateAccessToken,
  type Session,
} from "../src/lib/session";

const session: Session = {
  accessToken: "tok.a",
  principal: {
    kind: "user",
    id: 1,
    organisation_id: 7,
    membership_id: 11,
    workspace_name: "Test Workspace",
    workspaces: [],
    type: "accountant",
    first_name: "Andrei",
    last_name: "Popescu",
    email: "a@b.ro",
    phone: "",
    status: "active",
    role: "accountant",
    permissions: ["clients:read"],
  },
};

const adminSession: Session = {
  accessToken: "tok.admin",
  principal: {
    kind: "admin",
    id: 2,
    first_name: "Platform",
    last_name: "Admin",
    email: "admin@b.ro",
    role: "platform_admin",
    permissions: ["admin:read"],
  },
};

describe("session store", () => {
  beforeEach(() => {
    clearSession();
  });

  it("returns null when nothing is stored", () => {
    expect(getSession()).toBe(null);
    expect(getAccessToken()).toBe(null);
  });

  it("persists and reads back a session", () => {
    setSession(session);
    expect(getAccessToken()).toBe("tok.a");
    expect(getSession()?.principal.email).toBe("a@b.ro");
  });

  it("writes to localStorage so refreshes survive", () => {
    setSession(session);
    const raw = window.localStorage.getItem("contapp_user_session");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.accessToken).toBe("tok.a");
    expect(parsed.principal.kind).toBe("user");
  });

  it("keeps user and admin sessions isolated", () => {
    setSession(session, "user");
    setSession(adminSession, "admin");
    expect(getSession("user")?.accessToken).toBe("tok.a");
    expect(getSession("admin")?.accessToken).toBe("tok.admin");

    clearSession("admin");
    expect(getSession("user")?.accessToken).toBe("tok.a");
    expect(getSession("admin")).toBe(null);
  });

  it("clearSession wipes memory and storage", () => {
    setSession(session);
    clearSession();
    expect(getSession()).toBe(null);
    expect(window.localStorage.getItem("contapp_user_session")).toBe(null);
    expect(window.localStorage.getItem("contapp_admin_session")).toBe(null);
  });

  it("updateAccessToken rotates only the token", () => {
    setSession(session);
    updateAccessToken("tok.b");
    expect(getAccessToken()).toBe("tok.b");
    expect(getSession()?.principal.id).toBe(1);
  });

  it("updateAccessToken is a no-op when no session exists", () => {
    clearSession();
    updateAccessToken("tok.c");
    expect(getSession()).toBe(null);
  });

  it("notifies subscribers on setSession / clearSession", () => {
    const events: Array<Session | null> = [];
    const unsub = subscribe((s) => events.push(s));
    setSession(session);
    clearSession();
    unsub();
    // one emit per write; both should have fired
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.accessToken).toBe("tok.a");
    expect(events.at(-1)).toBe(null);
  });

  it("subscribe returns a disposer that stops further emits", () => {
    const events: Array<Session | null> = [];
    const unsub = subscribe((s) => events.push(s));
    unsub();
    setSession(session);
    expect(events).toHaveLength(0);
  });
});
