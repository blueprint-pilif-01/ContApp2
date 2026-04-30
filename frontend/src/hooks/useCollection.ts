import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

function unwrapList<T>(value: T[] | Record<string, unknown>): T[] {
  if (Array.isArray(value)) return value;
  const data = value.data;
  if (Array.isArray(data)) return data as T[];
  for (const item of Object.values(value)) {
    if (Array.isArray(item)) return item as T[];
  }
  return [];
}

function unwrapItem<T>(value: T | { data: T }): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    (value as { data?: unknown }).data !== undefined
  ) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export function useCollectionList<T>(key: string, path: string, query = "") {
  return useQuery<T[]>({
    queryKey: [key, path, query],
    queryFn: async () =>
      unwrapList<T>(await api.get<T[] | Record<string, unknown>>(`${path}${query ? `?${query}` : ""}`)),
  });
}

export function useCollectionItem<T>(key: string, path: string, query = "", enabled = true) {
  return useQuery<T>({
    queryKey: [key, path, query],
    queryFn: async () =>
      unwrapItem(await api.get<T | { data: T }>(`${path}${query ? `?${query}` : ""}`)),
    enabled,
  });
}

export function useCollectionCreate<TPayload extends object, TResult extends object>(
  key: string,
  path: string
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, TPayload>({
    mutationFn: async (payload) =>
      unwrapItem(await api.post<TResult | { data: TResult }>(path, payload)),
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
    mutationFn: async ({ id, payload }) =>
      unwrapItem(await api.put<TResult | { data: TResult }>(pathFactory(id), payload)),
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
    mutationFn: async (id) =>
      unwrapItem(await api.delete<TResult | { data: TResult }>(pathFactory(id))),
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
    mutationFn: async ({ id, payload }) =>
      unwrapItem(await api.post<TResult | { data: TResult }>(pathFactory(id), payload ?? {})),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
    },
  });
}
