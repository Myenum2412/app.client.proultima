import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { toast } from 'sonner'

interface PaymentRequest {
  invoiceIds: string[]
  paymentMethod: string
  amount: number
  discount?: number
  notes?: string
}

interface PaymentResponse {
  updatedCount: number
  invoiceIds: string[]
  paymentMethod: string
  amount: number
  discount?: number
  notes?: string
}

export function useProcessPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payment: PaymentRequest): Promise<PaymentResponse> => {
      const response = await fetch('/api/invoices/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      })

      if (!response.ok) {
        const errorData: ApiResponse = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to process payment')
      }

      const result: ApiResponse<PaymentResponse> = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to process payment')
      }

      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(`Payment Processed`, {
        description: `Successfully processed payment for ${data.updatedCount} invoice(s).`,
      })
    },
    onError: (error: Error) => {
      toast.error('Payment Failed', {
        description: error.message,
      })
    },
  })
}

interface ExportRequest {
  invoiceIds: string[]
  format?: 'csv' | 'json'
}

export function useExportInvoices() {
  return useMutation({
    mutationFn: async ({ invoiceIds, format = 'csv' }: ExportRequest): Promise<void> => {
      const response = await fetch('/api/invoices/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds, format }),
      })

      if (!response.ok) {
        const errorData: ApiResponse = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to export invoices')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result: ApiResponse = await response.json()
        if (!result.success) {
          throw new Error(result.error || result.message || 'Failed to export invoices')
        }
      }
    },
    onSuccess: () => {
      toast.success('Export Successful', {
        description: 'Invoices exported successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Export Failed', {
        description: error.message,
      })
    },
  })
}

interface EmailRequest {
  invoiceIds: string[]
  recipientEmail?: string
  subject?: string
  message?: string
}

interface EmailResponse {
  sent: boolean
  recipientEmail: string
  invoiceCount: number
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: async (email: EmailRequest): Promise<EmailResponse> => {
      const response = await fetch('/api/invoices/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      })

      if (!response.ok) {
        const errorData: ApiResponse = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to send email')
      }

      const result: ApiResponse<EmailResponse> = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to send email')
      }

      return result.data
    },
    onSuccess: (data) => {
      toast.success('Email Sent', {
        description: `Invoice summary sent to ${data.recipientEmail}.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Email Failed', {
        description: error.message,
      })
    },
  })
}

