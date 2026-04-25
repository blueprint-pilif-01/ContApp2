/**
 * Client-side auth session store.
 *
 * The backend does not expose `/auth/me`, so we keep the authenticated
 * principal returned by `/user/login` or `/admin/login` in localStorage
 * and expose a tiny pub/sub so React hooks can react to login/logout.
 */

export interface UserPrincipal {
  kind: "user";
  id: number;
  organisation_id: number | null;
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

export interface Session {
  accessToken: string;
  principal: Principal;
}

const STORAGE_KEY = "contapp_session_v1";

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

function readStorage(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.principal?.kind) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(s: Session | null): void {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota / disabled storage
  }
}

let current: Session | null = readStorage();

function emit() {
  for (const l of listeners) l(current);
}

export function getSession(): Session | null {
  return current;
}

export function getAccessToken(): string | null {
  return current?.accessToken ?? null;
}

export function setSession(next: Session | null): void {
  current = next;
  writeStorage(next);
  emit();
}

export function updateAccessToken(token: string): void {
  if (!current) return;
  current = { ...current, accessToken: token };
  writeStorage(current);
  emit();
}

export function clearSession(): void {
  setSession(null);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cross-tab sync: react to another tab logging in / out. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    current = readStorage();
    emit();
  });
}
