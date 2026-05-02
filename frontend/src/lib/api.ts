/**
 * Core HTTP client against the Go backend.
 *
 * Features:
 *  - Base URL from `VITE_API_BASE_URL` (empty string = same origin).
 *  - `Authorization: Bearer <access_token>` injected from the session.
 *  - `credentials: "include"` so the HttpOnly refresh cookie travels.
 *  - One retry on 401 via `GET /auth/refresh-token`; logs out on failure.
 *  - Normalized {@link ApiError} so hooks can branch on `status` / `code`.
 */

import {
  clearSession,
  getAccessToken,
  type SessionActor,
  updateAccessToken,
} from "./session";

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e;
}

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "";

/** Joins the base URL with a relative endpoint path. */
function url(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE_URL}${path}`;
}

/** Single in-flight refresh shared across concurrent 401s per actor. */
const refreshInflight: Partial<Record<SessionActor, Promise<string | null>>> = {};

async function refreshAccessToken(actor: SessionActor): Promise<string | null> {
  if (refreshInflight[actor]) return refreshInflight[actor]!;

  refreshInflight[actor] = (async () => {
    try {
      const res = await fetch(url("/auth/refresh-token"), {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", "X-ContApp-Actor": actor },
      });
      if (!res.ok) return null;
      const body = (await res.json().catch(() => null)) as
        | { access_token?: string; refresh_token?: string }
        | null;
      const token = body?.access_token;
      if (!token) return null;
      updateAccessToken(token, actor);
      return token;
    } catch {
      return null;
    } finally {
      delete refreshInflight[actor];
    }
  })();

  return refreshInflight[actor]!;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const ctype = res.headers.get("Content-Type") ?? "";
  if (!ctype.includes("application/json")) {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildError(res: Response, body: unknown): ApiError {
  const rec = (body ?? {}) as Record<string, unknown>;
  const msg =
    (typeof rec.message === "string" && rec.message) ||
    (typeof rec.error === "string" && rec.error) ||
    `Eroare ${res.status}`;
  const err: ApiError = { message: msg, status: res.status };
  if (typeof rec.code === "string") err.code = rec.code;
  return err;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** If true, do not attach Authorization / attempt refresh (for login endpoints). */
  skipAuth?: boolean;
  /** Force the browser session namespace used for this call. Null means public. */
  actor?: SessionActor | null;
}

function inferActor(path: string): SessionActor | null {
  if (path.startsWith("/public/") || path.startsWith("/portal/")) return null;
  if (path.startsWith("/auth/admin")) return "admin";
  if (path.startsWith("/auth/user")) return "user";
  if (path.startsWith("/admin/")) return "admin";
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin")
  ) {
    return "admin";
  }
  return "user";
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, actor: forcedActor, headers, ...rest } = opts;
  const actor = skipAuth ? null : forcedActor === undefined ? inferActor(path) : forcedActor;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: baseHeaders,
  };
  if (isFormData) init.body = body as FormData;
  else if (body !== undefined) init.body = JSON.stringify(body);

  const doFetch = async (): Promise<Response> => {
    const token = actor ? getAccessToken(actor) : null;
    const finalHeaders: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
    return fetch(url(path), { ...init, headers: finalHeaders });
  };

  let res = await doFetch();

  if (res.status === 401 && actor) {
    const refreshed = await refreshAccessToken(actor);
    if (refreshed) {
      res = await doFetch();
    } else {
      clearSession(actor);
      throw buildError(res, await parseBody(res));
    }
  }

  const body2 = await parseBody(res);
  if (!res.ok) throw buildError(res, body2);
  return body2 as T;
}

function makeClient(prefix: string, actor?: SessionActor | null) {
  const p = (path: string) =>
    path.startsWith("/") ? `${prefix}${path}` : `${prefix}/${path}`;
  const withActor = (opts?: Omit<RequestOptions, "body" | "method">) => ({
    ...(actor !== undefined ? { actor } : {}),
    ...(opts ?? {}),
  });
  return {
    get: <T>(path: string, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "GET" }),
    post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "POST", body }),
    put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "PATCH", body }),
    delete: <T>(path: string, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "DELETE" }),
    upload: <T>(path: string, data: FormData, opts?: Omit<RequestOptions, "body" | "method">) =>
      request<T>(p(path), { ...withActor(opts), method: "POST", body: data }),
  };
}

/** Auth / public endpoints (no prefix). */
export const api = {
  ...makeClient(""),
  /** Raw request (skips the actor prefix). */
  request,
};

/**
 * Authenticated calls for a regular user.
 *
 * The backend exposes a single resource surface under the API base
 * (e.g. `/clients`, `/notes`); actor scope is derived from the JWT, not the
 * URL. We keep `userApi` as a separate symbol so call sites stay expressive
 * even though it shares the same prefix as `adminApi`.
 */
export const userApi = makeClient("", "user");

/** Authenticated calls for the platform admin panel — same surface as `userApi`. */
export const adminApi = makeClient("", "admin");

/** Returns the right actor client based on the session. */
export function actorApi(kind: "user" | "admin") {
  return kind === "admin" ? adminApi : userApi;
}
