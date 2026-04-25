import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      gcTime: 1000 * 60 * 5, // 5 min
      retry: (failureCount, error: unknown) => {
        const e = error as ApiError;
        // Never retry auth/gating errors
        if (e?.status === 401 || e?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
