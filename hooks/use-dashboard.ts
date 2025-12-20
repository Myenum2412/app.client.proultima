import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

interface DashboardStats {
  totalActiveProjects: {
    value: number
    label: string
  }
  detailingInProcess: {
    value: number
    label: string
  }
  releasedJobs: {
    value: number
    label: string
  }
  revisionInProcess: {
    value: number
    label: string
  }
  yetToBeDetailed: {
    value: number
    label: string
  }
  jobAvailability: {
    label: string
  }
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch('/api/dashboard/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }

  const result: ApiResponse<DashboardStats> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch dashboard stats')
  }

  return result.data
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

