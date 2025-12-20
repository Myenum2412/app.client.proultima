/**
 * Optimized Invoice Hooks
 * Enhanced with optimistic updates, proper error handling, and loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/services/api-client'
import { queryKeys } from '@/lib/config/query-config'
import { Invoice, InvoiceFilters } from '@/lib/types/invoice'
import { toast } from 'sonner'

// Fetch invoices with filters
const fetchInvoices = async (filters?: InvoiceFilters): Promise<Invoice[]> => {
  const params: Record<string, string> = {}
  
  if (filters?.invoiceId) params.invoiceId = filters.invoiceId
  if (filters?.projectNumber) params.projectNumber = filters.projectNumber
  if (filters?.projectName) params.projectName = filters.projectName
  if (filters?.status) params.status = filters.status
  
  // Range filters
  if (filters?.billedTonnage?.min !== undefined) {
    params.billedTonnageMin = filters.billedTonnage.min.toString()
  }
  if (filters?.billedTonnage?.max !== undefined) {
    params.billedTonnageMax = filters.billedTonnage.max.toString()
  }
  if (filters?.billedHoursCO?.min !== undefined) {
    params.billedHoursCOMin = filters.billedHoursCO.min.toString()
  }
  if (filters?.billedHoursCO?.max !== undefined) {
    params.billedHoursCOMax = filters.billedHoursCO.max.toString()
  }
  if (filters?.coPrice?.min !== undefined) {
    params.coPriceMin = filters.coPrice.min.toString()
  }
  if (filters?.coPrice?.max !== undefined) {
    params.coPriceMax = filters.coPrice.max.toString()
  }
  if (filters?.issueDate?.from) params.issueDateFrom = filters.issueDate.from
  if (filters?.issueDate?.to) params.issueDateTo = filters.issueDate.to

  return apiClient.get<Invoice[]>('/invoices', params)
}

// Fetch single invoice
const fetchInvoice = async (id: string): Promise<Invoice> => {
  return apiClient.get<Invoice>(`/invoices/${id}`)
}

/**
 * Query hook for fetching invoices with filters
 */
export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: queryKeys.invoices.list(filters as Record<string, unknown>),
    queryFn: () => fetchInvoices(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Query hook for fetching a single invoice
 */
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id!),
    queryFn: () => fetchInvoice(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Mutation hook for creating an invoice with optimistic updates
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiClient.post<Invoice>('/invoices', invoice)
    },
    onMutate: async (newInvoice) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.lists() })

      // Snapshot previous value
      const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices.lists())

      // Optimistically update
      const optimisticInvoice: Invoice = {
        ...newInvoice,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Invoice[]>(
        queryKeys.invoices.lists(),
        (old = []) => [...old, optimisticInvoice]
      )

      return { previousInvoices }
    },
    onError: (error, _newInvoice, context) => {
      // Rollback on error
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices.lists(), context.previousInvoices)
      }
      toast.error('Failed to create invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
    onSuccess: () => {
      toast.success('Invoice created successfully')
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() })
    },
  })
}

/**
 * Mutation hook for updating an invoice with optimistic updates
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      return apiClient.put<Invoice>(`/invoices/${id}`, updates)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.detail(id) })
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.lists() })

      const previousInvoice = queryClient.getQueryData<Invoice>(queryKeys.invoices.detail(id))
      const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices.lists())

      // Optimistically update
      if (previousInvoice) {
        const optimisticInvoice = { ...previousInvoice, ...updates }
        queryClient.setQueryData(queryKeys.invoices.detail(id), optimisticInvoice)
      }

      // Update in list
      queryClient.setQueryData<Invoice[]>(
        queryKeys.invoices.lists(),
        (old = []) =>
          old.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
      )

      return { previousInvoice, previousInvoices }
    },
    onError: (error, { id }, context) => {
      if (context?.previousInvoice) {
        queryClient.setQueryData(queryKeys.invoices.detail(id), context.previousInvoice)
      }
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices.lists(), context.previousInvoices)
      }
      toast.error('Failed to update invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() })
    },
  })
}

/**
 * Mutation hook for deleting an invoice with optimistic updates
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<void>(`/invoices/${id}`)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.lists() })

      const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices.lists())

      // Optimistically remove
      queryClient.setQueryData<Invoice[]>(
        queryKeys.invoices.lists(),
        (old = []) => old.filter((inv) => inv.id !== id)
      )

      return { previousInvoices }
    },
    onError: (error, _id, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices.lists(), context.previousInvoices)
      }
      toast.error('Failed to delete invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
    onSuccess: () => {
      toast.success('Invoice deleted successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() })
    },
  })
}

