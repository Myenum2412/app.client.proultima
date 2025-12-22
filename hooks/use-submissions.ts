import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { Submission } from '@/components/submissions-table'

interface UseSubmissionsOptions {
  status?: string
  initialData?: Submission[]
}

const fetchSubmissions = async (options?: UseSubmissionsOptions) => {
  const params = new URLSearchParams()
  if (options?.status) {
    params.append('status', options.status)
  }

  const url = `/api/submissions${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch submissions')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch submissions')
  }

  return result.data
}

export function useSubmissions(options?: UseSubmissionsOptions) {
  return useQuery({
    queryKey: ['submissions', options?.status],
    queryFn: () => fetchSubmissions(options),
    initialData: options?.initialData,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

