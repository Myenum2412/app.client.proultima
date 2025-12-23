import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInvoiceById, getPaymentsByInvoice, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  subtotal: number;
}

export interface InvoicePayment {
  id: string;
  paymentDate: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed";
  transactionId?: string;
}

export interface InvoiceDetails {
  id: string;
  invoiceNo: string;
  projectNo: string;
  contractor: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  status: "paid" | "unpaid" | "partially_paid" | "overdue";
  billedTonnage: number;
  unitPriceOrLumpSum: string;
  tonsBilledAmount: number;
  billedHoursCo: number;
  coPrice: number;
  coBilledAmount: number;
  totalAmountBilled: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    const supabase = await createSupabaseServerClient();
    
    // Fetch invoice from Supabase
    const invoice = await getInvoiceById(supabase, invoiceId);
    
    // Fetch related payments
    const paymentsData = await getPaymentsByInvoice(supabase, invoiceId);
    
    // Fetch projects to get contractor info
    const projects = await getProjects(supabase);
    const project = projects.find(p => p.project_number === invoice.project_number);

    // Calculate dates
    const issueDate = new Date(invoice.issue_date);
    const dueDate = invoice.paid_date 
      ? new Date(invoice.paid_date)
      : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate tax (10% of total)
    const tax = (invoice.total_amount_billed || 0) * 0.1;
    const discount = 0;
    const grandTotal = (invoice.total_amount_billed || 0) + tax - discount;

    // Map payments
    const invoicePayments: InvoicePayment[] = (paymentsData || []).map((p: any) => ({
      id: p.id,
      paymentDate: new Date(p.created_at).toISOString().split("T")[0],
      amount: p.amount,
      method: p.payment_method || "Online",
      status: p.status === "success" ? "completed" : p.status as any,
      transactionId: p.razorpay_payment_id,
    }));

    const paidAmount = invoicePayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = grandTotal - paidAmount;

    // Determine status
    let status: "paid" | "unpaid" | "partially_paid" | "overdue" = "unpaid";
    if (paidAmount >= grandTotal) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partially_paid";
    } else if (new Date() > dueDate) {
      status = "overdue";
    }

    // Create line items from invoice data
    const lineItems: InvoiceLineItem[] = [];
    
    if ((invoice.billed_tonnage || 0) > 0) {
      lineItems.push({
        id: "1",
        description: `Steel Detailing Services - ${invoice.billed_tonnage} Tons @ $${invoice.unit_price_lump_sum || 0}`,
        quantity: invoice.billed_tonnage || 0,
        unitPrice: invoice.unit_price_lump_sum || 0,
        tax: (invoice.tons_billed_amount || 0) * 0.1,
        subtotal: invoice.tons_billed_amount || 0,
      });
    }

    // Add CO line item if applicable
    if ((invoice.billed_hours_co || 0) > 0) {
      lineItems.push({
        id: "2",
        description: `Change Order - ${invoice.billed_hours_co} Hours @ $${invoice.co_price}/hour`,
        quantity: invoice.billed_hours_co || 0,
        unitPrice: invoice.co_price || 0,
        tax: (invoice.co_billed_amount || 0) * 0.1,
        subtotal: invoice.co_billed_amount || 0,
      });
    }

    const invoiceDetails: InvoiceDetails = {
      id: invoiceId,
      invoiceNo: invoice.invoice_id,
      projectNo: invoice.project_number,
      contractor: project?.contractor_name ?? "",
      projectName: invoice.project_name,
      issueDate: issueDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      status,
      billedTonnage: invoice.billed_tonnage || 0,
      unitPriceOrLumpSum: `$${invoice.unit_price_lump_sum || 0}`,
      tonsBilledAmount: invoice.tons_billed_amount || 0,
      billedHoursCo: invoice.billed_hours_co || 0,
      coPrice: invoice.co_price || 0,
      coBilledAmount: invoice.co_billed_amount || 0,
      totalAmountBilled: invoice.total_amount_billed || 0,
      tax,
      discount,
      grandTotal,
      paidAmount,
      remainingBalance,
      lineItems,
      payments: invoicePayments,
    };

    return NextResponse.json(invoiceDetails);
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return NextResponse.json(
      { message: "Invoice not found" },
      { status: 404 }
    );
  }
}
