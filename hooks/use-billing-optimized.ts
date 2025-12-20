/**
 * Optimized Billing Hooks
 * Enhanced with proper error handling and loading states
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/services/api-client'
import { queryKeys } from '@/lib/config/query-config'

export interface BillingStats {
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingRevenue: number
  averageInvoiceAmount: number
}

const fetchBillingStats = async (): Promise<BillingStats> => {
  return apiClient.get<BillingStats>('/billing/stats')
}

/**
 * Query hook for fetching billing statistics
 */
export function useBillingStats() {
  return useQuery({
    queryKey: queryKeys.billing.stats(),
    queryFn: fetchBillingStats,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

