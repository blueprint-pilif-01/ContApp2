import { adminHandler } from "./domains/admin";
import { authHandler } from "./domains/auth";
import { billingHandler } from "./domains/billing";
import { resourceHandler } from "./domains/resources";
import { workspaceHandler } from "./domains/workspace";
import { newFeaturesHandler } from "./domains/newFeatures";
import { withLatency, type MockBody, type MockCtx, type MockHandler } from "./shared";

const handlers: MockHandler[] = [
  authHandler,
  adminHandler,
  billingHandler,
  workspaceHandler,
  newFeaturesHandler,
  resourceHandler,
];

function normalizePath(pathname: string): string {
  // Strip any "/api" or "/api/v<n>" prefix that the BASE_URL might inject.
  const path = pathname.replace(/^\/api(\/v\d+)?(?=\/|$)/, "") || "/";
  return path.replace(/\/+$/, "") || "/";
}

function parseBody(init?: RequestInit): MockBody | undefined {
  if (!init?.body || typeof init.body !== "string") return undefined;
  try {
    return JSON.parse(init.body) as MockBody;
  } catch {
    return undefined;
  }
}

export function installMockApi() {
  const original = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

    let parsed: URL;
    try {
      parsed = new URL(rawUrl, window.location.origin);
    } catch {
      return original(input, init);
    }

    const ctx: MockCtx = {
      path: normalizePath(parsed.pathname),
      method: ((init?.method ?? "GET") as string).toUpperCase(),
      body: parseBody(init),
      query: parsed.searchParams,
    };

    for (const handle of handlers) {
      const res = handle(ctx);
      if (res) {
        if (import.meta.env.DEV) {
          console.debug(
            `%c[mock] ${ctx.method} ${ctx.path} → ${res.status}`,
            "color:#a8d946;font-weight:600;"
          );
        }
        return withLatency(res.clone());
      }
    }

    if (import.meta.env.DEV) {
      console.warn(`[mock] passthrough ${ctx.method} ${ctx.path}`);
    }
    return original(input, init);
  };

  console.info(
    "%c[Mock API] installed%c → workspace modular",
    "background:#a8d946;color:#000;padding:2px 6px;border-radius:4px;font-weight:700;",
    "color:inherit;"
  );
}
