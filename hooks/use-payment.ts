/**
 * Payment Hooks
 * Handles Razorpay payment operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/services/api-client'
import { queryKeys } from '@/lib/config/query-config'
import { 
  RazorpayOrderRequest, 
  RazorpayOrderResponse,
  RazorpayVerifyRequest,
  PaymentVerificationResponse 
} from '@/lib/types/payment'
import { toast } from 'sonner'

/**
 * Mutation hook for creating a Razorpay order
 */
export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
      const response = await apiClient.post<RazorpayOrderResponse>('/payments/create-order', request)
      return response
    },
    onError: (error) => {
      toast.error('Failed to create payment order', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
  })
}

/**
 * Mutation hook for verifying Razorpay payment
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: RazorpayVerifyRequest): Promise<PaymentVerificationResponse> => {
      const response = await apiClient.post<PaymentVerificationResponse>('/payments/verify', request)
      return response
    },
    onSuccess: (data) => {
      toast.success('Payment Successful', {
        description: data.message || 'Invoice has been marked as paid',
      })
      
      // Invalidate invoice queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(data.invoiceId) })
    },
    onError: (error) => {
      toast.error('Payment Verification Failed', {
        description: error instanceof Error ? error.message : 'Failed to verify payment',
      })
    },
  })
}

