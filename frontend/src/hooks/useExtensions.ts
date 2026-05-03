/**
 * Extension state hook: reads the active extension map for the current
 * organisation and exposes a backend-backed toggle when available.
 *
 * Endpoints:
 *   GET  /organisations/me/extensions      → { extensions: { ...key: bool } }
 *   PUT  /organisations/me/extensions      → { key, enabled }
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  DEFAULT_EXTENSION_STATE,
  type ExtensionKey,
} from "../lib/extensions";
import { SUBSCRIPTION_KEY } from "./useSubscription";

export const EXTENSIONS_KEY = ["organisations", "me", "extensions"] as const;

type ExtensionState = Record<ExtensionKey, boolean>;

interface ExtensionsResponse {
  extensions: Partial<ExtensionState>;
}

function normalize(raw: Partial<ExtensionState>): ExtensionState {
  const next: ExtensionState = { ...DEFAULT_EXTENSION_STATE };
  for (const key of Object.keys(DEFAULT_EXTENSION_STATE) as ExtensionKey[]) {
    if (typeof raw[key] === "boolean") next[key] = raw[key]!;
  }
  return next;
}

/**
 * Returns the current organisation's active extension map plus helpers.
 *
 * `canUse(key)` returns true iff the extension is currently active. Always
 * returns false until the query has resolved at least once (i.e. `isReady`),
 * so call sites can safely render a skeleton while the gate is loading.
 */
export function useExtensions() {
  const qc = useQueryClient();

  const query = useQuery<ExtensionState>({
    queryKey: EXTENSIONS_KEY,
    queryFn: async () => {
      const res = await api.get<ExtensionsResponse>("/organisations/me/extensions");
      return normalize(res?.extensions ?? {});
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation<
    ExtensionState,
    unknown,
    { key: ExtensionKey; enabled: boolean }
  >({
    mutationFn: async ({ key, enabled }) => {
      const res = await api.put<ExtensionsResponse>(
        "/organisations/me/extensions",
        { key, enabled }
      );
      return normalize(res?.extensions ?? {});
    },
    onSuccess: (next) => {
      qc.setQueryData(EXTENSIONS_KEY, next);
      qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
    },
  });

  const state = query.data;
  const isReady = query.isSuccess && !!state;

  const canUse = (key: ExtensionKey): boolean => {
    if (!state) return false;
    return state[key] === true;
  };

  return {
    state,
    isReady,
    isLoading: query.isLoading,
    isError: query.isError,
    canUse,
    toggle: (key: ExtensionKey, enabled: boolean) =>
      toggleMutation.mutateAsync({ key, enabled }),
    isToggling: toggleMutation.isPending,
    refetch: query.refetch,
  };
}
