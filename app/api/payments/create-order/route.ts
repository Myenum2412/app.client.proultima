import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { razorpayClient, isRazorpayConfigured } from "@/lib/razorpay/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { amount, invoiceId, invoiceNo, currency = "INR" } = body;

    if (!amount || !invoiceId || !invoiceNo) {
      return NextResponse.json(
        { error: "Missing required fields: amount, invoiceId, invoiceNo" },
        { status: 400 }
      );
    }

    // Validate Razorpay configuration
    if (!isRazorpayConfigured()) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json(
        { 
          error: "Payment gateway not configured. Please contact support.",
          message: "Razorpay credentials are missing from server configuration"
        },
        { status: 500 }
      );
    }

    // Validate amount
    if (amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be a positive number." },
        { status: 400 }
      );
    }

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Validate minimum amount (Razorpay minimum is 1 INR = 100 paise)
    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 1.00 INR" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `invoice_${invoiceNo}_${Date.now()}`,
      notes: {
        invoiceId,
        invoiceNo,
        userId: user.id,
        userEmail: user.email,
      },
    };

    const order = await razorpayClient.orders.create(options as any);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to create payment order";
    let statusCode = 500;

    if (error.error) {
      // Razorpay API error
      errorMessage = error.error.description || error.error.reason || error.message || errorMessage;
      statusCode = error.statusCode || 500;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

