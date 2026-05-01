/**
 * Generic resource-hook factory matching the standardized backend shape:
 *
 *   POST   /{path}       → create   → returns the created DTO with 201
 *   GET    /{path}/{id}  → read     → returns the DTO
 *   PUT    /{path}/{id}  → update   → returns the updated DTO
 *   DELETE /{path}/{id}  → delete   → returns { message }
 *
 * No actor segment in the URL — the JWT identifies the actor.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../lib/api";

export interface ResourceHooks<TRead, TCreate, TUpdate = TCreate> {
  key: readonly [string];
  useById: (id: number | undefined) => UseQueryResult<TRead, unknown>;
  useCreate: () => ReturnType<typeof useMutation<TRead, unknown, TCreate>>;
  useUpdate: (
    id: number
  ) => ReturnType<typeof useMutation<TRead, unknown, TUpdate>>;
  useDelete: () => ReturnType<typeof useMutation<{ message: string }, unknown, number>>;
}

export interface CreateResourceOpts {
  /** Resource path segment (e.g. "clients", "contracts/templates"). */
  path: string;
  /** React Query key prefix. */
  keyPrefix: string;
}

function unwrapResource<T>(value: T | { data: T }): T {
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

export function createResource<TRead, TCreate, TUpdate = TCreate>(
  opts: CreateResourceOpts
): ResourceHooks<TRead, TCreate, TUpdate> {
  const key = [opts.keyPrefix] as const;

  const useById = (id: number | undefined) =>
    useQuery<TRead>({
      queryKey: [...key, id],
      queryFn: () => api.get<TRead>(`/${opts.path}/${id}`),
      enabled: typeof id === "number" && id > 0,
    });

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation<TRead, unknown, TCreate>({
      mutationFn: async (payload) =>
        unwrapResource(await api.post<TRead | { data: TRead }>(`/${opts.path}`, payload)),
      onSuccess: (created) => {
        qc.invalidateQueries({ queryKey: key });
        const id = (created as { id?: number } | null)?.id;
        if (id) qc.invalidateQueries({ queryKey: [...key, id] });
      },
    });
  };

  const useUpdate = (id: number) => {
    const qc = useQueryClient();
    return useMutation<TRead, unknown, TUpdate>({
      mutationFn: async (payload) =>
        unwrapResource(await api.put<TRead | { data: TRead }>(`/${opts.path}/${id}`, payload)),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: key });
        qc.invalidateQueries({ queryKey: [...key, id] });
      },
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation<{ message: string }, unknown, number>({
      mutationFn: (id) =>
        api.delete<{ message: string }>(`/${opts.path}/${id}`),
      onSuccess: (_res, id) => {
        qc.invalidateQueries({ queryKey: key });
        qc.invalidateQueries({ queryKey: [...key, id] });
      },
    });
  };

  return { key, useById, useCreate, useUpdate, useDelete };
}
