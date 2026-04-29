import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockApi } from "../../src/lib/mock";
import {
  DEFAULT_EXTENSION_STATE,
  EXTENSION_KEYS,
} from "../../src/lib/extensions";

describe("smoke: organisation extensions", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    installMockApi();
    window.localStorage.removeItem("contapp_mock_extensions");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET /organisations/me/extensions returns the default permissive map", async () => {
    const res = await fetch("http://localhost/organisations/me/extensions");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { extensions: Record<string, boolean> };
    for (const key of EXTENSION_KEYS) {
      expect(body.extensions[key]).toBe(DEFAULT_EXTENSION_STATE[key]);
    }
  });

  it("PUT /organisations/me/extensions toggles a single extension and persists it", async () => {
    const off = await fetch("http://localhost/organisations/me/extensions", {
      method: "PUT",
      body: JSON.stringify({ key: "contracts_pro", enabled: false }),
    });
    expect(off.status).toBe(200);
    const body1 = (await off.json()) as { extensions: Record<string, boolean> };
    expect(body1.extensions.contracts_pro).toBe(false);
    expect(body1.extensions.ticketing_pro).toBe(true);

    const reread = (await (
      await fetch("http://localhost/organisations/me/extensions")
    ).json()) as { extensions: Record<string, boolean> };
    expect(reread.extensions.contracts_pro).toBe(false);
  });

  it("PUT /organisations/me/extensions rejects invalid keys", async () => {
    const res = await fetch("http://localhost/organisations/me/extensions", {
      method: "PUT",
      body: JSON.stringify({ key: "totally_fake", enabled: true }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /organisations/me/subscription includes the toggle state", async () => {
    await fetch("http://localhost/organisations/me/extensions", {
      method: "PUT",
      body: JSON.stringify({ key: "ai_assistant", enabled: false }),
    });
    const res = await fetch("http://localhost/organisations/me/subscription");
    expect(res.status).toBe(200);
    const sub = (await res.json()) as {
      plan: string;
      extensions: Record<string, boolean>;
      limits: Record<string, number | null>;
      usage: Record<string, number>;
    };
    expect(sub.plan).toBeTruthy();
    expect(sub.extensions.ai_assistant).toBe(false);
    expect(sub.extensions.contracts_pro).toBe(true);
    expect(typeof sub.usage.templates).toBe("number");
  });
});
