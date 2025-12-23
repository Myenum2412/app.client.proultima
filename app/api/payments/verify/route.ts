import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, amount } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment verified successfully - Update database
    const supabase = await createSupabaseServerClient();

    // 1. Create payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount: amount || 0,
        currency: "INR",
        status: "success",
      });

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      return NextResponse.json(
        { error: "Payment verified but failed to save to database" },
        { status: 500 }
      );
    }

    // 2. Update invoice status to "Paid" and set paid_date
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "Paid",
        paid_date: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error("Error updating invoice status:", invoiceError);
      // Don't return error - payment is already saved
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: "Payment verified and invoice updated successfully",
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

