import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

interface SearchResult {
  type: 'project' | 'file' | 'invoice' | 'submission'
  id: string
  title: string
  description?: string
  url: string
}

const fetchSearchResults = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return []
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to search')
  }

  const result: ApiResponse<SearchResult[]> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to search')
  }

  return result.data
}

export function useSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

