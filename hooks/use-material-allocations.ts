import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { MaterialAllocation } from '@/components/material-allocations-table'

interface MaterialAllocationsFilters {
  status?: string
  project?: string
}

const fetchMaterialAllocations = async (filters?: MaterialAllocationsFilters) => {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.project) params.append('project', filters.project)

  const response = await fetch(`/api/material/allocations?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch material allocations')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch material allocations')
  }

  return result.data as MaterialAllocation[]
}

const createMaterialAllocation = async (data: Partial<MaterialAllocation>) => {
  const response = await fetch('/api/material/allocations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create material allocation')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create material allocation')
  }

  return result.data as MaterialAllocation
}

const updateMaterialAllocation = async (id: string, data: Partial<MaterialAllocation>) => {
  const response = await fetch('/api/material/allocations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to update material allocation')
  }

  const result: ApiResponse = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update material allocation')
  }

  return result.data as MaterialAllocation
}

export function useMaterialAllocations(filters?: MaterialAllocationsFilters) {
  return useQuery({
    queryKey: ['material-allocations', filters],
    queryFn: () => fetchMaterialAllocations(filters),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateMaterialAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMaterialAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-allocations'] })
    },
  })
}

export function useUpdateMaterialAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaterialAllocation> }) =>
      updateMaterialAllocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-allocations'] })
    },
  })
}
