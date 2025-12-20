import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { Invoice, InvoiceFilters } from '@/lib/types/invoice'

const fetchInvoices = async (filters?: InvoiceFilters): Promise<Invoice[]> => {
  const params = new URLSearchParams()
  
  if (filters?.invoiceId) params.append('invoiceId', filters.invoiceId)
  if (filters?.projectNumber) params.append('projectNumber', filters.projectNumber)
  if (filters?.projectName) params.append('projectName', filters.projectName)
  if (filters?.status) params.append('status', filters.status)
  
  // Range filters
  if (filters?.billedTonnage?.min !== undefined) params.append('billedTonnageMin', filters.billedTonnage.min.toString())
  if (filters?.billedTonnage?.max !== undefined) params.append('billedTonnageMax', filters.billedTonnage.max.toString())
  if (filters?.billedHoursCO?.min !== undefined) params.append('billedHoursCOMin', filters.billedHoursCO.min.toString())
  if (filters?.billedHoursCO?.max !== undefined) params.append('billedHoursCOMax', filters.billedHoursCO.max.toString())
  if (filters?.coPrice?.min !== undefined) params.append('coPriceMin', filters.coPrice.min.toString())
  if (filters?.coPrice?.max !== undefined) params.append('coPriceMax', filters.coPrice.max.toString())
  if (filters?.issueDate?.from) params.append('issueDateFrom', filters.issueDate.from)
  if (filters?.issueDate?.to) params.append('issueDateTo', filters.issueDate.to)

  const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Failed to fetch invoices:', errorData)
    throw new Error(errorData.error || 'Failed to fetch invoices')
  }

  const result: ApiResponse<Invoice[]> = await response.json()
  
  if (!result.success) {
    console.error('API returned error:', result.error)
    // Return empty array instead of throwing to show "No invoices found"
    return []
  }
  
  if (!result.data) {
    console.warn('API returned success but no data')
    return []
  }

  return result.data
}

const fetchInvoice = async (id: string): Promise<Invoice> => {
  const response = await fetch(`/api/invoices/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch invoice')
  }

  const result: ApiResponse<Invoice> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch invoice')
  }

  return result.data
}

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', filters],
    queryFn: () => fetchInvoices(filters),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useInvoice(id: string | null) {
  return useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create invoice')
      }

      const result: ApiResponse = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update invoice')
      }

      const result: ApiResponse = await response.json()
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete invoice')
      }

      const result: ApiResponse = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

