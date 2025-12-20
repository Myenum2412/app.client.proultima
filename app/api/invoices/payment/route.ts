import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

interface PaymentRequest {
  invoiceIds: string[]
  paymentMethod: string
  amount: number
  discount?: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body: PaymentRequest = await request.json()
    const { invoiceIds, paymentMethod, amount, discount = 0, notes } = body

    if (!invoiceIds || invoiceIds.length === 0) {
      return createSuccessResponse(null, 'No invoices selected for payment.')
    }

    if (!paymentMethod) {
      return createSuccessResponse(null, 'Payment method is required.')
    }

    // Update invoice statuses to 'Paid' and set paid_date
    const { data: updatedInvoices, error } = await supabase
      .from('invoices')
      .update({
        status: 'Paid',
        paid_date: new Date().toISOString(),
      })
      .in('id', invoiceIds)
      .select()

    if (error) {
      console.error('Error updating invoices:', error)
      return createSuccessResponse(null, `Error processing payment: ${error.message}`)
    }

    // Create payment record (if you have a payments table)
    // For now, we'll just update the invoices

    return createSuccessResponse(
      {
        updatedCount: updatedInvoices?.length || 0,
        invoiceIds,
        paymentMethod,
        amount,
        discount,
        notes,
      },
      `Successfully processed payment for ${updatedInvoices?.length || 0} invoice(s).`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

