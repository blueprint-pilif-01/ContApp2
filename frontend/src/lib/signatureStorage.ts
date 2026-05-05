export interface StoredSignature {
  name: string;
  owner_id: number;
  image: string;
  updated_at: string;
}

export const SINGLE_SIGNATURE_STORAGE_KEY = "contapp_local_signature";
const LEGACY_SIGNATURES_STORAGE_KEY = "contapp_local_signatures";

export function readStoredSignature(): StoredSignature | null {
  if (typeof window === "undefined") return null;
  const current = readJson<StoredSignature>(SINGLE_SIGNATURE_STORAGE_KEY);
  if (current?.image) return current;

  const rows = readJson<Array<StoredSignature & { image_url?: string }>>(LEGACY_SIGNATURES_STORAGE_KEY);
  const first = Array.isArray(rows) ? rows.find((row) => row.image || row.image_url) : null;
  if (!first) return null;
  return {
    name: first.name || "Semnatura mea",
    owner_id: first.owner_id ?? 0,
    image: first.image || first.image_url || "",
    updated_at: first.updated_at || new Date().toISOString(),
  };
}

export function saveStoredSignature(signature: StoredSignature): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SINGLE_SIGNATURE_STORAGE_KEY, JSON.stringify(signature));
}

export function clearStoredSignature(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SINGLE_SIGNATURE_STORAGE_KEY);
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
