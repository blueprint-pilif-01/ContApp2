import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useCollectionList<T>(key: string, path: string, query = "") {
  return useQuery<T[]>({
    queryKey: [key, path, query],
    queryFn: () => api.get<T[]>(`${path}${query ? `?${query}` : ""}`),
  });
}

export function useCollectionItem<T>(key: string, path: string, query = "", enabled = true) {
  return useQuery<T>({
    queryKey: [key, path, query],
    queryFn: () => api.get<T>(`${path}${query ? `?${query}` : ""}`),
    enabled,
  });
}

export function useCollectionCreate<TPayload extends object, TResult extends object>(
  key: string,
  path: string
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, TPayload>({
    mutationFn: (payload) => api.post<TResult>(path, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useCollectionUpdate<TPayload extends object, TResult extends object>(
  key: string,
  pathFactory: (id: number) => string
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, { id: number; payload: TPayload }>({
    mutationFn: ({ id, payload }) => api.put<TResult>(pathFactory(id), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useCollectionDelete<TResult extends object>(
  key: string,
  pathFactory: (id: number) => string
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, number>({
    mutationFn: (id) => api.delete<TResult>(pathFactory(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useCollectionAction<TResult extends object>(
  key: string,
  pathFactory: (id: number) => string
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, { id: number; payload?: object }>({
    mutationFn: ({ id, payload }) => api.post<TResult>(pathFactory(id), payload ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
    },
  });
}
