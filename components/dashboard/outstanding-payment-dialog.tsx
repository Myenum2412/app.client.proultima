"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { demoInvoices, demoProjects } from "@/public/assets";
import { PayNowButton } from "@/components/billing/pay-now-button";
import type { BillingInvoiceRow } from "@/components/billing/invoice-columns";

type OutstandingPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Generate payment trend data from invoices
function generatePaymentData() {
  // Generate data for the last 90 days
  const today = new Date();
  const chartData: Array<{ date: string; outstanding: number; paid: number }> = [];
  
  // Distribute invoices across the last 90 days
  const totalOutstanding = demoInvoices.reduce(
    (sum, inv) => sum + inv.totalAmountBilled,
    0
  );
  
  // Generate daily data points
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Simulate gradual payment and accumulation
    const dayIndex = 89 - i;
    const progress = dayIndex / 89;
    
    // Outstanding decreases over time as payments are made
    const outstanding = Math.max(0, totalOutstanding * (1 - progress * 0.4));
    // Paid increases over time
    const paid = totalOutstanding * progress * 0.4;
    
    // Add some variation
    const variation = (Math.sin(dayIndex * 0.1) * 0.1 + 1);
    
    chartData.push({
      date: dateStr,
      outstanding: Math.round(outstanding * variation),
      paid: Math.round(paid * variation),
    });
  }
  
  return chartData;
}

const chartConfig = {
  outstanding: {
    label: "Outstanding",
    color: "hsl(0, 84%, 60%)", // Red color for outstanding
  },
  paid: {
    label: "Paid",
    color: "hsl(142, 76%, 36%)", // Green color for paid
  },
} satisfies ChartConfig;

export function OutstandingPaymentDialog({
  open,
  onOpenChange,
}: OutstandingPaymentDialogProps) {
  const [timeRange, setTimeRange] = React.useState("90d");
  const chartData = React.useMemo(() => generatePaymentData(), []);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const totalOutstanding = demoInvoices.reduce(
    (sum, inv) => sum + inv.totalAmountBilled,
    0
  );

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Create project lookup map by job number
  const projectByJobNumber = new Map<string, (typeof demoProjects)[number]>();
  for (const p of demoProjects) {
    projectByJobNumber.set(p.jobNumber, p);
  }

  // Map invoices to table rows with project information
  const outstandingInvoices: BillingInvoiceRow[] = demoInvoices.map((inv, index) => {
    const proj = projectByJobNumber.get(inv.jobNumber);
    return {
      id: `inv-${index + 1}`,
      invoiceNo: inv.invoiceNo,
      projectNo: inv.jobNumber,
      contractor: proj?.contractorName ?? "",
      projectName: proj?.name ?? "",
      billedTonnage: inv.billedTonnage,
      unitPriceOrLumpSum: inv.unitPriceOrLumpSum,
      tonsBilledAmount: inv.tonsBilledAmount,
      billedHoursCo: inv.billedHoursCo,
      coPrice: inv.coPrice,
      coBilledAmount: inv.coBilledAmount,
      totalAmountBilled: inv.totalAmountBilled,
      status: "Pending",
    };
  });

  // Sort by invoice number (descending - newest first)
  outstandingInvoices.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full border-b">
          <DialogTitle>Outstanding Payment Details</DialogTitle>
          <DialogDescription>
            View payment trends and outstanding invoice details
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Total Outstanding Payment</CardTitle>
                <CardDescription>
                  Amount pending across all invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {money.format(totalOutstanding)}
                </div>
              </CardContent>
            </Card>

            {/* Chart Card */}
            <Card className="pt-0">
              <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                  <CardTitle>Payment Trends</CardTitle>
                  <CardDescription>
                    Showing outstanding and paid amounts over time
                  </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                    aria-label="Select time range"
                  >
                    <SelectValue placeholder="Last 3 months" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="90d" className="rounded-lg">
                      Last 3 months
                    </SelectItem>
                    <SelectItem value="30d" className="rounded-lg">
                      Last 30 days
                    </SelectItem>
                    <SelectItem value="7d" className="rounded-lg">
                      Last 7 days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[300px] w-full"
                >
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-outstanding)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-outstanding)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-paid)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-paid)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            });
                          }}
                          indicator="dot"
                          formatter={(value) => money.format(Number(value))}
                        />
                      }
                    />
                    <Area
                      dataKey="paid"
                      type="natural"
                      fill="url(#fillPaid)"
                      stroke="var(--color-paid)"
                      stackId="a"
                    />
                    <Area
                      dataKey="outstanding"
                      type="natural"
                      fill="url(#fillOutstanding)"
                      stroke="var(--color-outstanding)"
                      stackId="a"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Outstanding Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardDescription>
                  List of all invoices with payment options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-emerald-50/70">
                        <TableRow>
                          <TableHead className="text-center font-semibold text-emerald-900">Invoice #</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Project #</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Project Name</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Contractor</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Billed Tonnage</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Total Amount</TableHead>
                          <TableHead className="text-center font-semibold text-emerald-900">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No outstanding invoices found
                            </TableCell>
                          </TableRow>
                        ) : (
                          outstandingInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="text-center font-medium">{invoice.invoiceNo}</TableCell>
                              <TableCell className="text-center">{invoice.projectNo}</TableCell>
                              <TableCell className="text-center">{invoice.projectName}</TableCell>
                              <TableCell className="text-center">{invoice.contractor}</TableCell>
                              <TableCell className="text-center">{invoice.billedTonnage.toFixed(2)}</TableCell>
                              <TableCell className="text-center font-semibold">
                                {money.format(invoice.totalAmountBilled)}
                              </TableCell>
                              <TableCell className="text-center">
                                <PayNowButton invoice={invoice} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

