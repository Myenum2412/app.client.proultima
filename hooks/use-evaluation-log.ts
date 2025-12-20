import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

const fetchEvaluations = async () => {
  const response = await fetch('/api/evaluation-log', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch evaluations')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch evaluations')
  }

  return result.data
}

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: fetchEvaluations,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

