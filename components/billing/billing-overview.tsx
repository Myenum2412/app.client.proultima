"use client";

import { useBillingInvoices } from "@/lib/hooks/use-api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import type { BillingInvoiceRow } from "./invoice-columns";

export function BillingOverview() {
  // Fetch all invoices for overview (use large pageSize to get all)
  const { data: invoicesData } = useBillingInvoices({
    page: 1,
    pageSize: 1000, // Large page size to get all invoices for overview calculations
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load invoices." },
  });

  // Extract data array from paginated response
  const data = invoicesData?.data ?? [];

  // Calculate metrics from real invoice data
  const totalInvoices = data.length;
  const totalAmountBilled = data.reduce(
    (sum, inv) => sum + inv.totalAmountBilled,
    0
  );
  const totalBilledTonnage = data.reduce(
    (sum, inv) => sum + inv.billedTonnage,
    0
  );
  const averageInvoiceAmount =
    totalInvoices > 0 ? totalAmountBilled / totalInvoices : 0;
  const totalCoHours = data.reduce(
    (sum, inv) => sum + inv.billedHoursCo,
    0
  );
  const totalCoAmount = data.reduce(
    (sum, inv) => sum + inv.coBilledAmount,
    0
  );

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const metrics = [
    {
      label: "Total Invoices",
      value: totalInvoices.toString(),
      unit: "",
    },
    {
      label: "Total Amount Billed",
      value: money.format(totalAmountBilled),
      unit: "",
    },
    {
      label: "Total Billed Tonnage",
      value: totalBilledTonnage.toFixed(2),
      unit: "Tons",
    },
    {
      label: "Average Invoice Amount",
      value: money.format(averageInvoiceAmount),
      unit: "",
    },
    {
      label: "Total CO Hours",
      value: totalCoHours.toFixed(1),
      unit: "Hours",
    },
    {
      label: "Total CO Amount",
      value: money.format(totalCoAmount),
      unit: "",
    },
  ];

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader className="relative overflow-hidden">
        <Image
          src="/image/dashboard-bg.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/70 to-white/20" />
        <div className="relative">
          <h1 className="text-xl font-semibold">Billing Overview</h1>
          <p className="text-sm text-muted-foreground">
            Summary of invoices and billing statistics
          </p>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <div className="grid grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex flex-col p-4 rounded-lg border bg-background/50 backdrop-blur-sm"
            >
              <div className="text-sm text-muted-foreground mb-2">
                {metric.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                {metric.unit && (
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

