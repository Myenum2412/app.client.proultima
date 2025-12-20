import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

const fetchStatus = async () => {
  const response = await fetch('/api/status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch status')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch status')
  }

  return result.data
}

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

