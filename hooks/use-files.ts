import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

const fetchFiles = async () => {
  const response = await fetch('/api/files', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch files')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch files')
  }

  return result.data
}

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

