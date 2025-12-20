/**
 * TanStack Query Configuration
 * Centralized configuration for optimal caching, refetching, and error handling
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

export const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 1 minute
    staleTime: 60 * 1000,
    // Cache data for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect immediately
    refetchOnReconnect: true,
    // Retry failed requests
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          return false
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
  },
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  })
}

// Query keys factory for type-safe query keys
export const queryKeys = {
  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
  },
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  // Billing
  billing: {
    all: ['billing'] as const,
    stats: () => [...queryKeys.billing.all, 'stats'] as const,
  },
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  // Files
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
  },
  // Submissions
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.submissions.lists(), filters] as const,
  },
  // Materials
  materials: {
    all: ['materials'] as const,
    lists: () => [...queryKeys.materials.all, 'list'] as const,
  },
  // Evaluations
  evaluations: {
    all: ['evaluations'] as const,
    lists: () => [...queryKeys.evaluations.all, 'list'] as const,
  },
  // Status
  status: {
    all: ['status'] as const,
    current: () => [...queryKeys.status.all, 'current'] as const,
  },
  // Search
  search: {
    all: ['search'] as const,
    query: (query: string) => [...queryKeys.search.all, query] as const,
  },
} as const

