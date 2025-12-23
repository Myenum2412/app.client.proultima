"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { loadRazorpayScript } from "@/lib/razorpay/checkout";
import { useCreatePaymentOrder, useVerifyPayment } from "@/lib/hooks/use-api";
import type { BillingInvoiceRow } from "./invoice-columns";

export function PayNowButton({ 
  invoice, 
  onBeforePayment 
}: { 
  invoice: BillingInvoiceRow;
  onBeforePayment?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const handlePayment = async () => {
    // Call the callback to close drawer (if provided)
    if (onBeforePayment) {
      onBeforePayment();
      // Wait a bit for drawer to close smoothly
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    try {
      setIsLoading(true);

      // Inject critical CSS for Razorpay z-index
      const styleId = 'razorpay-zindex-override';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .razorpay-container,
          #razorpay-container,
          .razorpay-backdrop,
          iframe[name^="razorpay"],
          div[id^="checkout-frame"] {
            z-index: 2147483647 !important;
            position: fixed !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        alert("Failed to load payment gateway. Please try again.");
        setIsLoading(false);
        return;
      }

      // Create order using TanStack Query mutation
      const orderData = await createOrder.mutateAsync({
        amount: invoice.totalAmountBilled,
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        currency: "INR",
      });

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PROULTIMA",
        description: `Payment for Invoice ${invoice.invoiceNo}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server using TanStack Query mutation
            const verifyResult = await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice.id, 
              amount: invoice.totalAmountBilled,
            } as any) as { success?: boolean; paymentId?: string; error?: string };

            if (verifyResult.success) {
              alert("Payment successful! Invoice has been marked as Paid.\nPayment ID: " + verifyResult.paymentId);
              // Reload page to show updated invoice status
              window.location.reload();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "Customer",
          email: "",
          contact: "",
        },
        theme: {
          color: "#059669", // Emerald color matching your theme
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
          confirm_close: false, // Don't confirm when closing
          escape: true, // Allow ESC key to close
          animation: true,
          backdropclose: true, // Allow clicking backdrop to close
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        alert("Payment failed. Please try again.");
        setIsLoading(false);
      });
      
      // Open Razorpay checkout
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.message || "Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      size="sm"
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Pay Now"
      )}
    </Button>
  );
}

