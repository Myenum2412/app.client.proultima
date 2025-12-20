"use client"

import { useState, useEffect } from "react"
import { Invoice } from "@/lib/types/invoice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCreatePaymentOrder, useVerifyPayment } from "@/hooks/use-payment"
import { openRazorpayCheckout } from "@/lib/services/razorpay-client"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSuccess?: () => void
}

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function PaymentDialog({ open, onOpenChange, invoice, onSuccess }: PaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const createOrder = useCreatePaymentOrder()
  const verifyPayment = useVerifyPayment()

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsProcessing(false)
    }
  }, [open])

  const handleProceedToPayment = async () => {
    if (!invoice) {
      toast.error('Invoice data not available')
      return
    }

    // Check if invoice is already paid
    if (invoice.status === 'Paid') {
      toast.error('This invoice has already been paid')
      onOpenChange(false)
      return
    }

    // Validate CO price
    const paymentAmount = invoice.coPrice || 0
    if (paymentAmount <= 0) {
      toast.error('Invalid payment amount. CO price is not set for this invoice.')
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await createOrder.mutateAsync({
        invoiceId: invoice.id,
        amount: paymentAmount,
      })

      // The mutation will throw an error if the API returns an error response
      // So if we get here, orderResponse should be valid
      if (!orderResponse || !orderResponse.orderId || !orderResponse.keyId) {
        throw new Error('Invalid order response from server')
      }

      // Step 2: Open Razorpay checkout
      await openRazorpayCheckout({
        key: orderResponse.keyId,
        amount: Math.round(paymentAmount * 100), // Convert to paise (multiply by 100)
        currency: orderResponse.currency || 'INR',
        name: 'Invoice Payment',
        description: `Payment for Invoice #${invoice.invoiceId} - ${invoice.projectName}`,
        order_id: orderResponse.orderId,
        handler: async (response) => {
          // Step 3: Verify payment on success
          try {
            setIsProcessing(true)
            
            await verifyPayment.mutateAsync({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              invoiceId: invoice.id,
            })

            // Success - close dialog and refresh
            onOpenChange(false)
            if (onSuccess) {
              onSuccess()
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            // Error toast is handled by the hook
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            console.log('Payment cancelled by user')
          },
        },
      })
    } catch (error) {
      console.error('Payment initiation error:', error)
      // Error toast is handled by the hook's onError
      setIsProcessing(false)
      // Don't throw - let the hook handle the error display
    }
  }

  if (!invoice) {
    return null
  }

  const paymentAmount = invoice.coPrice || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md z-50">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Review invoice details before proceeding to payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Information */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-medium">{invoice.invoiceId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Project Name:</span>
              <span className="font-medium">{invoice.projectName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Project Number:</span>
              <span className="font-medium">{invoice.projectNumber}</span>
            </div>
          </div>

          {/* Payment Amount - Highlighted */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Payment Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrencyAmount(paymentAmount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CO Price
            </p>
          </div>

          {/* Payment Button */}
          <div className="pt-4">
            <Button
              onClick={handleProceedToPayment}
              disabled={isProcessing || createOrder.isPending || paymentAmount <= 0}
              className="w-full gap-2 bg-green-700 hover:bg-green-800 text-white"
              size="lg"
            >
              {isProcessing || createOrder.isPending || verifyPayment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>

          {/* Info Message */}
          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to Razorpay secure payment gateway
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

