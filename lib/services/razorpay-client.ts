/**
 * Razorpay Client Service
 * Handles client-side Razorpay checkout integration
 */

declare global {
  interface Window {
    Razorpay: any
  }
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number // Amount in paise
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
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

/**
 * Load Razorpay script dynamically
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay script')))
      return
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay script'))
    document.body.appendChild(script)
  })
}

/**
 * Open Razorpay checkout
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  try {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript()

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available')
    }

    const razorpay = new window.Razorpay({
      key: options.key,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.order_id,
      handler: options.handler,
      prefill: options.prefill,
      theme: options.theme || {
        color: '#3399cc',
      },
      modal: {
        ...options.modal,
        ondismiss: options.modal?.ondismiss || (() => {
          console.log('Payment cancelled by user')
        }),
      },
    })

    razorpay.open()
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error)
    throw error
  }
}

