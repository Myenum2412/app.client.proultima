"use client";

import * as React from "react";
import { Calendar, FileText, Building2, User, CheckCircle2, Clock, AlertCircle, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvoiceDetails, useVerifyPayment } from "@/lib/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { PayNowButton } from "./pay-now-button";
import type { BillingInvoiceRow } from "./invoice-columns";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface InvoiceDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: BillingInvoiceRow | null;
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    paid: { label: "Paid", variant: "default" as const, icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    unpaid: { label: "Unpaid", variant: "destructive" as const, icon: AlertCircle, className: "bg-red-100 text-red-700 border-red-200" },
    partially_paid: { label: "Partially Paid", variant: "secondary" as const, icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" },
    overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle, className: "bg-red-100 text-red-700 border-red-200" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} border font-medium flex items-center gap-1.5`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function InvoiceDetailsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function InvoiceDetailsDrawer({ open, onOpenChange, invoice }: InvoiceDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const { data: invoiceDetails, isLoading, error } = useInvoiceDetails(
    invoice?.id ?? "",
    {
      enabled: open && !!invoice?.id,
    }
  );

  const verifyPayment = useVerifyPayment();

  // Refresh invoice details after payment
  React.useEffect(() => {
    if (verifyPayment.isSuccess && invoice?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.billingInvoice(invoice.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billingInvoices() });
    }
  }, [verifyPayment.isSuccess, invoice?.id, queryClient]);

  const canMakePayment = invoiceDetails && (invoiceDetails.status === "unpaid" || invoiceDetails.status === "partially_paid");

  // Handle payment - close drawer before opening Razorpay
  const handlePayment = () => {
    onOpenChange(false); // Close drawer first
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl font-bold">Invoice Details</SheetTitle>
          <SheetDescription>
            Complete invoice information and payment history
          </SheetDescription>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InvoiceDetailsSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to load invoice</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : "An error occurred"}
                </p>
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Close
                </Button>
              </div>
            </motion.div>
          ) : invoiceDetails ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-6 p-6">
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold">{invoiceDetails.invoiceNo}</h2>
                      <p className="text-sm text-muted-foreground">Invoice ID: {invoiceDetails.id}</p>
                    </div>
                    <StatusBadge status={invoiceDetails.status} />
                  </div>

                  <Separator />

                  {/* Invoice Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Project</p>
                          <p className="text-base font-semibold">{invoiceDetails.projectName}</p>
                          <p className="text-sm text-muted-foreground">{invoiceDetails.projectNo}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Client / Contractor</p>
                          <p className="text-base font-semibold">{invoiceDetails.contractor}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                          <p className="text-base font-semibold">
                            {dateFormat.format(new Date(invoiceDetails.issueDate))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                          <p className={`text-base font-semibold ${
                            new Date(invoiceDetails.dueDate) < new Date() && invoiceDetails.status !== "paid"
                              ? "text-red-600"
                              : ""
                          }`}>
                            {dateFormat.format(new Date(invoiceDetails.dueDate))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Line Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Itemized Breakdown
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 text-sm font-semibold">Description</th>
                            <th className="text-center p-3 text-sm font-semibold">Quantity</th>
                            <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                            <th className="text-right p-3 text-sm font-semibold">Tax</th>
                            <th className="text-right p-3 text-sm font-semibold">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceDetails.lineItems.map((item, index) => (
                            <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                              <td className="p-3 text-sm">{item.description}</td>
                              <td className="p-3 text-sm text-center">{item.quantity.toFixed(2)}</td>
                              <td className="p-3 text-sm text-right">{money.format(item.unitPrice)}</td>
                              <td className="p-3 text-sm text-right">{money.format(item.tax)}</td>
                              <td className="p-3 text-sm text-right font-medium">{money.format(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{money.format(invoiceDetails.totalAmountBilled)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span className="font-medium">{money.format(invoiceDetails.tax)}</span>
                    </div>
                    {invoiceDetails.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-emerald-600">-{money.format(invoiceDetails.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Grand Total</span>
                      <span>{money.format(invoiceDetails.grandTotal)}</span>
                    </div>
                    {invoiceDetails.paidAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Paid Amount</span>
                          <span className="font-medium">{money.format(invoiceDetails.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Remaining Balance</span>
                          <span className={invoiceDetails.remainingBalance > 0 ? "text-red-600" : "text-emerald-600"}>
                            {money.format(invoiceDetails.remainingBalance)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Payment Section */}
                  {canMakePayment && (
                    <div className="space-y-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-700" />
                        <h3 className="text-lg font-semibold text-emerald-900">Payment</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount Due</span>
                          <span className="font-bold text-lg">{money.format(invoiceDetails.remainingBalance)}</span>
                        </div>
                        {invoice && (
                          <PayNowButton invoice={invoice} onBeforePayment={handlePayment} />
                        )}
                      </div>
                    </div>
                  )}

                  {invoiceDetails.status === "paid" && (
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-semibold">This invoice has been fully paid.</p>
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  {invoiceDetails.payments.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Payment History</h3>
                        <div className="space-y-3">
                          {invoiceDetails.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{money.format(payment.amount)}</p>
                                  <StatusBadge
                                    status={
                                      payment.status === "completed"
                                        ? "paid"
                                        : payment.status === "pending"
                                        ? "partially_paid"
                                        : "unpaid"
                                    }
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {payment.method} • {dateFormat.format(new Date(payment.paymentDate))}
                                </p>
                                {payment.transactionId && (
                                  <p className="text-xs text-muted-foreground">
                                    Transaction ID: {payment.transactionId}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}

