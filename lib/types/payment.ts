export interface Payment {
  id: string
  invoiceId: string
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  amount: number
  currency: string
  paymentMethod?: string
  status: 'pending' | 'success' | 'failed'
  razorpayResponse?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface RazorpayOrderRequest {
  invoiceId: string
  amount: number // Amount in rupees (will be converted to paise)
}

export interface RazorpayOrderResponse {
  orderId: string
  keyId: string
  amount: number
  currency: string
}

export interface RazorpayVerifyRequest {
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  invoiceId: string
}

export interface PaymentVerificationResponse {
  success: boolean
  paymentId: string
  invoiceId: string
  message?: string
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number // Amount in paise
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

