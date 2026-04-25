import { useSyncExternalStore } from "react";
import { api, isApiError } from "../lib/api";
import {
  clearSession,
  getSession,
  setSession,
  subscribe,
  type AdminPrincipal,
  type Principal,
  type Session,
  type UserPrincipal,
} from "../lib/session";

export const ME_KEY = ["me"] as const;
export const ADMIN_ME_KEY = ["admin", "me"] as const;

type UserLoginResponse = {
  token: { access_token: string; refresh_token: string };
  user: Omit<UserPrincipal, "kind">;
};

type AdminLoginResponse = {
  token: { access_token: string; refresh_token: string };
  admin: Omit<AdminPrincipal, "kind">;
};

const FALLBACK_TOKEN = "mock.access.token";

const FALLBACK_USER: UserPrincipal = {
  kind: "user",
  id: 1,
  organisation_id: 1,
  type: "accountant",
  first_name: "Demo",
  last_name: "User",
  email: "demo@contapp.ro",
  phone: "",
  status: "active",
  role: "accountant",
  permissions: ["*"],
};

const FALLBACK_ADMIN: AdminPrincipal = {
  kind: "admin",
  id: 1,
  first_name: "Platform",
  last_name: "Admin",
  email: "admin@contapp.ro",
  role: "platform_admin",
  permissions: ["*"],
};

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Log in as a regular user and persist the session. */
export async function loginUser(credentials: LoginCredentials): Promise<UserPrincipal> {
  let principal: UserPrincipal = FALLBACK_USER;
  let accessToken = FALLBACK_TOKEN;
  try {
    const res = await api.post<UserLoginResponse>("/auth/user/login", credentials, {
      skipAuth: true,
    });
    principal = { kind: "user", ...res.user };
    accessToken = res.token.access_token;
  } catch {
    // Clean-slate mode: allow local login even if API is unavailable.
  }
  const session: Session = { accessToken, principal };
  setSession(session);
  return principal;
}

/** Retained for compatibility while admin UI is removed. */
export async function loginAdmin(credentials: LoginCredentials): Promise<AdminPrincipal> {
  let principal: AdminPrincipal = FALLBACK_ADMIN;
  let accessToken = FALLBACK_TOKEN;
  try {
    const res = await api.post<AdminLoginResponse>("/auth/admin/login", credentials, {
      skipAuth: true,
    });
    principal = { kind: "admin", ...res.admin };
    accessToken = res.token.access_token;
  } catch {
    // Clean-slate mode: allow local login even if API is unavailable.
  }
  const session: Session = { accessToken, principal };
  setSession(session);
  return principal;
}

/** End the session — fires `/auth/logout` best-effort and clears local state. */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (e) {
    // Non-fatal: 401 here just means the token already expired server-side.
    if (!(isApiError(e) && e.status === 401)) {
      // swallow – we clear locally regardless
    }
  } finally {
    clearSession();
  }
}

function getSnapshot(): Principal | null {
  return getSession()?.principal ?? null;
}

/** Subscribe to the current principal, regardless of kind. */
export function usePrincipal(): Principal | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Returns the authenticated user, or null if the session is for an admin / empty. */
export function useMe(): { data: UserPrincipal | null; isLoading: false; isError: boolean } {
  const p = usePrincipal();
  const data = p?.kind === "user" ? p : null;
  return { data, isLoading: false, isError: !data };
}

/** Retained for compatibility while admin UI is removed. */
export function useAdminMe(): {
  data: AdminPrincipal | null;
  isLoading: false;
  isError: boolean;
} {
  const p = usePrincipal();
  const data = p?.kind === "admin" ? p : null;
  return { data, isLoading: false, isError: !data };
}

/** Returns true if the session principal has the given permission. */
export function hasPermission(permission: string): boolean {
  return getSession()?.principal.permissions.includes(permission) ?? false;
}
