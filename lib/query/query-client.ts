import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/fetch-json";

function getMetaErrorMessage(meta: unknown): string | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const value = (meta as Record<string, unknown>).errorMessage;
  return typeof value === "string" ? value : undefined;
}

function shouldRetry(failureCount: number, error: unknown) {
  // Don't retry after 3 attempts
  if (failureCount >= 3) return false;
  
  // Don't retry client errors (4xx)
  if (error instanceof ApiError) {
    if ([400, 401, 403, 404].includes(error.status)) return false;
  }
  
  // Retry with exponential backoff for server errors
  return true;
}

/**
 * Optimized query client configuration for performance
 * - Intelligent caching with appropriate stale times
 * - Request deduplication (automatic with TanStack Query)
 * - Background revalidation
 * - Optimized retry logic
 */
export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        // Only show toast for queries that don't have silent error handling
        const silent = (query.meta as { silent?: boolean })?.silent;
        if (silent) return;

        const message =
          getMetaErrorMessage(query.meta) ||
          (error instanceof Error ? error.message : "Request failed");
        toast.error(message);
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        const silent = (mutation.meta as { silent?: boolean })?.silent;
        if (silent) return;

        const message =
          getMetaErrorMessage(mutation.meta) ||
          (error instanceof Error ? error.message : "Operation failed");
        toast.error(message);
      },
    }),
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes before considering it stale
        staleTime: 5 * 60_000,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60_000,
        // Retry with exponential backoff
        retry: shouldRetry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
        // Network mode: prefer online, fallback to cache
        networkMode: "online",
      },
      mutations: {
        // Don't retry mutations by default
        retry: 0,
        // Network mode for mutations
        networkMode: "online",
      },
    },
  });
}


