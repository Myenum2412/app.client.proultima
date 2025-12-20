import { NextRequest } from 'next/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'
import { RazorpayVerifyRequest, PaymentVerificationResponse } from '@/lib/types/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)

    const body: RazorpayVerifyRequest = await request.json()
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, invoiceId } = body

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !invoiceId) {
      return createErrorResponse('Missing required payment verification data', 400)
    }

    // Get Razorpay credentials
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
    if (!razorpayKeySecret) {
      console.error('Razorpay key secret not configured')
      return createErrorResponse('Payment gateway not configured', 500)
    }

    // Verify Razorpay signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex')

    if (generatedSignature !== razorpaySignature) {
      console.error('Invalid Razorpay signature')
      return createErrorResponse('Invalid payment signature. Payment verification failed.', 400)
    }

    // Check if payment already exists (prevent duplicates)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .single()

    if (existingPayment) {
      if (existingPayment.status === 'success') {
        return createErrorResponse('This payment has already been processed', 400)
      }
    }

    // Initialize Razorpay to fetch payment details
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!razorpayKeyId) {
      return createErrorResponse('Payment gateway not configured', 500)
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    // Fetch payment details from Razorpay
    let paymentDetails
    try {
      paymentDetails = await razorpay.payments.fetch(razorpayPaymentId)
    } catch (error) {
      console.error('Error fetching payment from Razorpay:', error)
      return createErrorResponse('Failed to verify payment with Razorpay', 500)
    }

    // Verify payment status
    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      return createErrorResponse(`Payment not completed. Status: ${paymentDetails.status}`, 400)
    }

    // Fetch invoice to verify it exists
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_id, status, co_price')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return createErrorResponse('Invoice not found', 404)
    }

    // Check if invoice is already paid
    if (invoice.status === 'Paid') {
      // Still save the payment record but don't update invoice
      const { error: paymentError } = await supabase
        .from('payments')
        .upsert({
          invoice_id: invoiceId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          amount: invoice.co_price || (Number(paymentDetails.amount) / 100),
          currency: paymentDetails.currency || 'INR',
          payment_method: paymentDetails.method || null,
          status: 'success',
          razorpay_response: paymentDetails as unknown as Record<string, unknown>,
        }, {
          onConflict: 'razorpay_payment_id',
        })

      if (paymentError) {
        console.error('Error saving payment:', paymentError)
        return createSuccessResponse(null, 'Failed to save payment record')
      }

      return createSuccessResponse(null, 'Invoice is already paid, but payment record saved')
    }

    // Save payment record to database
    const paymentData = {
      invoice_id: invoiceId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
      amount: invoice.co_price || (Number(paymentDetails.amount) / 100),
      currency: paymentDetails.currency || 'INR',
      payment_method: paymentDetails.method || null,
      status: 'success' as const,
      razorpay_response: paymentDetails as unknown as Record<string, unknown>,
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .upsert(paymentData, {
        onConflict: 'razorpay_payment_id',
      })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      return createErrorResponse('Failed to save payment record', 500)
    }

    // Update invoice status to Paid
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'Paid',
        paid_date: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      // Payment is saved but invoice update failed - this is a critical error
      return createErrorResponse('Payment verified but failed to update invoice. Please contact support.', 500)
    }

    const response: PaymentVerificationResponse = {
      success: true,
      paymentId: razorpayPaymentId,
      invoiceId: invoiceId,
      message: 'Payment verified and invoice updated successfully',
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Error verifying payment:', error)
    return handleApiError(error)
  }
}

