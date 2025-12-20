import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

const fetchMaterials = async () => {
  const response = await fetch('/api/material', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch materials')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch materials')
  }

  return result.data
}

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

