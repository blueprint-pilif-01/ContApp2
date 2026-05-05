/**
 * Client-side auth session store.
 *
 * We keep the principal returned by the backend login endpoints in localStorage
 * and expose a tiny pub/sub so React hooks can react to login/logout.
 */

export interface WorkspacePrincipal {
  membership_id: number;
  organisation_id: number;
  name: string;
  role_label: string;
  permissions?: string[];
}

export interface UserPrincipal {
  kind: "user";
  id: number;
  organisation_id: number | null;
  membership_id: number | null;
  workspace_name: string;
  workspaces: WorkspacePrincipal[];
  type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  permissions: string[];
}

export interface AdminPrincipal {
  kind: "admin";
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permissions: string[];
}

export type Principal = UserPrincipal | AdminPrincipal;
export type SessionActor = Principal["kind"];

export interface Session {
  accessToken: string;
  principal: Principal;
}

const LEGACY_STORAGE_KEY = "contapp_session_v1";
const STORAGE_KEYS: Record<SessionActor, string> = {
  user: "contapp_user_session",
  admin: "contapp_admin_session",
};

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

function inferActorFromLocation(): SessionActor {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin")
  ) {
    return "admin";
  }
  return "user";
}

function readStorage(actor: SessionActor): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[actor]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || parsed?.principal?.kind !== actor) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readLegacyStorage(actor: SessionActor): Session | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || parsed?.principal?.kind !== actor) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(actor: SessionActor, s: Session | null): void {
  try {
    if (s) localStorage.setItem(STORAGE_KEYS[actor], JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEYS[actor]);
  } catch {
    // ignore quota / disabled storage
  }
}

let current: Record<SessionActor, Session | null> = {
  user: readStorage("user") ?? readLegacyStorage("user"),
  admin: readStorage("admin") ?? readLegacyStorage("admin"),
};

function emit() {
  for (const l of listeners) l(getSession());
}

export function getSession(actor: SessionActor = inferActorFromLocation()): Session | null {
  return current[actor];
}

export function getAccessToken(actor: SessionActor = inferActorFromLocation()): string | null {
  return current[actor]?.accessToken ?? null;
}

export function setSession(
  next: Session | null,
  actor: SessionActor | undefined = next?.principal.kind
): void {
  const target = actor ?? inferActorFromLocation();
  current = { ...current, [target]: next };
  writeStorage(target, next);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore disabled storage
  }
  emit();
}

export function updateAccessToken(
  token: string,
  actor: SessionActor = inferActorFromLocation()
): void {
  const existing = current[actor];
  if (!existing) return;
  current = {
    ...current,
    [actor]: { ...existing, accessToken: token },
  };
  writeStorage(actor, current[actor]);
  emit();
}

export function clearSession(actor?: SessionActor): void {
  if (actor) {
    setSession(null, actor);
    return;
  }
  current = { user: null, admin: null };
  writeStorage("user", null);
  writeStorage("admin", null);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore disabled storage
  }
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cross-tab sync: react to another tab logging in / out. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (
      e.key !== STORAGE_KEYS.user &&
      e.key !== STORAGE_KEYS.admin &&
      e.key !== LEGACY_STORAGE_KEY
    ) {
      return;
    }
    current = {
      user: readStorage("user") ?? readLegacyStorage("user"),
      admin: readStorage("admin") ?? readLegacyStorage("admin"),
    };
    emit();
  });
}
