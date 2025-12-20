/**
 * Optimized Dashboard Hooks
 * Enhanced with proper error handling and loading states
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/services/api-client'
import { queryKeys } from '@/lib/config/query-config'

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  pendingProjects: number
  totalInvoices: number
  totalRevenue: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return apiClient.get<DashboardStats>('/dashboard/stats')
}

/**
 * Query hook for fetching dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

