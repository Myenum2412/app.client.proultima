import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

interface BillingStats {
  totalInvoices: {
    value: number | string
    label: string
  }
  pendingPayments: {
    value: number | string
    label: string
  }
  paidThisMonth: {
    value: number | string
    label: string
  }
  overdueInvoices: {
    value: number | string
    label: string
  }
  upcomingPayments: {
    value: number | string
    label: string
  }
}

const fetchBillingStats = async (): Promise<BillingStats> => {
  const response = await fetch('/api/billing/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch billing stats')
  }

  const result: ApiResponse<BillingStats> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch billing stats')
  }

  return result.data
}

export function useBillingStats() {
  return useQuery<BillingStats>({
    queryKey: ['billing-stats'],
    queryFn: fetchBillingStats,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

