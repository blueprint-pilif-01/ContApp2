import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

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
  owner_id: number;
  image: string;
}

export const SIGNATURES_KEY = ["signatures"] as const;

export function useSignaturesList() {
  return useQuery<SignatureDTO[]>({
    queryKey: [...SIGNATURES_KEY, "list"],
    queryFn: () => api.get<SignatureDTO[]>("/signatures"),
  });
}

export function useCreateSignature() {
  const qc = useQueryClient();
  return useMutation<SignatureDTO, unknown, SignatureCreateRequest>({
    mutationFn: (payload) => api.post<SignatureDTO>("/signatures", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SIGNATURES_KEY }),
  });
}

export function useDeleteSignature() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, unknown, number>({
    mutationFn: (id) => api.delete<{ message: string }>(`/signatures/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: SIGNATURES_KEY }),
  });
}
