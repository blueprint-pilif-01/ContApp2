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
  type WorkspacePrincipal,
} from "../lib/session";

export const ME_KEY = ["me"] as const;
export const ADMIN_ME_KEY = ["admin", "me"] as const;

type UserLoginResponse = {
  access_token: string;
  token_type: "Bearer";
  account: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  workspace?: WorkspacePrincipal;
  workspaces?: WorkspacePrincipal[];
};

type AdminLoginResponse = {
  access_token: string;
  token_type: "Bearer";
  admin: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
};

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Log in as a regular user and persist the session. */
export async function loginUser(credentials: LoginCredentials): Promise<UserPrincipal> {
  const res = await api.post<UserLoginResponse>("/auth/user/login", credentials, {
    skipAuth: true,
  });
  const workspace = res.workspace ?? res.workspaces?.[0] ?? null;
  const principal: UserPrincipal = {
    kind: "user",
    id: res.account.id,
    organisation_id: workspace?.organisation_id ?? null,
    membership_id: workspace?.membership_id ?? null,
    workspace_name: workspace?.name ?? "",
    workspaces: res.workspaces ?? [],
    type: "account",
    first_name: res.account.first_name,
    last_name: res.account.last_name,
    email: res.account.email,
    phone: "",
    status: "active",
    role: workspace?.role_label ?? "Member",
    permissions: ["*"],
  };
  const session: Session = { accessToken: res.access_token, principal };
  setSession(session);
  return principal;
}

/** Log in as a platform administrator and persist the session. */
export async function loginAdmin(credentials: LoginCredentials): Promise<AdminPrincipal> {
  const res = await api.post<AdminLoginResponse>("/auth/admin/login", credentials, {
    skipAuth: true,
  });
  const principal: AdminPrincipal = {
    kind: "admin",
    id: res.admin.id,
    first_name: res.admin.first_name,
    last_name: res.admin.last_name,
    email: res.admin.email,
    role: "platform_admin",
    permissions: ["*"],
  };
  const session: Session = { accessToken: res.access_token, principal };
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
