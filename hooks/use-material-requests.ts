import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { MaterialRequest } from '@/components/material-requests-table'

interface MaterialRequestsFilters {
  status?: string
  priority?: string
}

const fetchMaterialRequests = async (filters?: MaterialRequestsFilters) => {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.priority) params.append('priority', filters.priority)

  const response = await fetch(`/api/material/requests?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch material requests')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch material requests')
  }

  return result.data as MaterialRequest[]
}

const createMaterialRequest = async (data: Partial<MaterialRequest>) => {
  const response = await fetch('/api/material/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create material request')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create material request')
  }

  return result.data as MaterialRequest
}

const updateMaterialRequest = async (id: string, data: Partial<MaterialRequest>) => {
  const response = await fetch('/api/material/requests', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to update material request')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update material request')
  }

  return result.data as MaterialRequest
}

export function useMaterialRequests(filters?: MaterialRequestsFilters) {
  return useQuery({
    queryKey: ['material-requests', filters],
    queryFn: () => fetchMaterialRequests(filters),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateMaterialRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMaterialRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] })
    },
  })
}

export function useUpdateMaterialRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaterialRequest> }) =>
      updateMaterialRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] })
    },
  })
}
