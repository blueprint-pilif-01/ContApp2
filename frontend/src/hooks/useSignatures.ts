import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * The contabil's saved-signature library, used to:
 *  - sign templates on behalf of the firm,
 *  - pre-render in PDFs as the accountant block.
 *
 * Distinct from the per-submission `signature_image` captured on the public
 * sign page (that one is the *client's* one-off signature, stored inline on
 * the submission row).
 */

export interface SignatureDTO {
  id: number;
  name: string;
  owner_id: number;
  /** data:image/png;base64,... */
  image: string;
  date_added: string;
}

export interface SignatureCreateRequest {
  name: string;
  file_id?: number;
  owner_id: number;
  image?: string;
}

export const SIGNATURES_KEY = ["signatures"] as const;
const SIGNATURES_STORAGE_KEY = "contapp_local_signatures";
const SINGLE_SIGNATURE_STORAGE_KEY = "contapp_local_signature";

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readSignatures(): SignatureDTO[] {
  const rows = readJson<SignatureDTO[]>(SIGNATURES_STORAGE_KEY, []);
  if (rows.length > 0) return rows;

  const single = readJson<
    | {
        name?: string;
        owner_id?: number;
        image?: string;
        updated_at?: string;
      }
    | null
  >(SINGLE_SIGNATURE_STORAGE_KEY, null);

  if (!single?.image) return [];
  return [
    {
      id: 1,
      name: single.name ?? "Semnătura mea",
      owner_id: single.owner_id ?? 0,
      image: single.image,
      date_added: single.updated_at ?? new Date().toISOString(),
    },
  ];
}

function writeSignatures(rows: SignatureDTO[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SIGNATURES_STORAGE_KEY, JSON.stringify(rows));
}

function nextId(rows: SignatureDTO[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function useSignaturesList() {
  return useQuery<SignatureDTO[]>({
    queryKey: [...SIGNATURES_KEY, "list"],
    queryFn: async () => readSignatures(),
  });
}

export function useCreateSignature() {
  const qc = useQueryClient();
  return useMutation<SignatureDTO, unknown, SignatureCreateRequest>({
    mutationFn: async (payload) => {
      const rows = readSignatures();
      const signature: SignatureDTO = {
        id: nextId(rows),
        name: payload.name,
        owner_id: payload.owner_id,
        image: payload.image ?? "",
        date_added: new Date().toISOString(),
      };
      writeSignatures([...rows, signature]);
      return signature;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SIGNATURES_KEY }),
  });
}

export function useDeleteSignature() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, unknown, number>({
    mutationFn: async (id) => {
      writeSignatures(readSignatures().filter((row) => row.id !== id));
      return { message: "deleted" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SIGNATURES_KEY }),
  });
}
