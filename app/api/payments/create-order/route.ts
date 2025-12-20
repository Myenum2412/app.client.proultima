import { NextRequest } from 'next/server'
import Razorpay from 'razorpay'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'
import { RazorpayOrderRequest, RazorpayOrderResponse } from '@/lib/types/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)

    const body: RazorpayOrderRequest = await request.json()
    const { invoiceId, amount } = body

    if (!invoiceId) {
      return createErrorResponse('Invoice ID is required', 400)
    }

    if (!amount || amount <= 0) {
      return createErrorResponse('Invalid payment amount', 400)
    }

    // Get Razorpay credentials from environment
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured')
      return createErrorResponse('Payment gateway not configured. Please contact administrator.', 500)
    }

    // Fetch invoice to verify it exists and get co_price
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_id, project_name, co_price, status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return createErrorResponse('Invoice not found', 404)
    }

    // Check if invoice is already paid
    if (invoice.status === 'Paid') {
      return createErrorResponse('This invoice has already been paid', 400)
    }

    // Use co_price from invoice (in rupees)
    const paymentAmount = invoice.co_price || amount

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    // Create order in Razorpay (amount in paise)
    const orderAmount = Math.round(paymentAmount * 100) // Convert to paise

    const orderOptions = {
      amount: orderAmount,
      currency: 'INR',
      receipt: `invoice_${invoice.invoice_id}_${Date.now()}`,
      notes: {
        invoice_id: invoice.invoice_id,
        project_name: invoice.project_name,
      },
    }

    const razorpayOrder = await razorpay.orders.create(orderOptions)

    const response: RazorpayOrderResponse = {
      orderId: razorpayOrder.id,
      keyId: razorpayKeyId,
      amount: paymentAmount,
      currency: 'INR',
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return handleApiError(error)
  }
}

