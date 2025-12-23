"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export type BillingInvoiceRow = {
  id: string;
  invoiceNo: string;
  projectNo: string;
  contractor: string;
  projectName: string;
  billedTonnage: number;
  unitPriceOrLumpSum: string;
  tonsBilledAmount: number;
  billedHoursCo: number;
  coPrice: number;
  coBilledAmount: number;
  totalAmountBilled: number;
  status: string; // Add status field: 'Paid', 'Pending', 'Overdue', 'Draft', 'Cancelled'
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function SortableHeader({
  column,
  children,
}: {
  column: Column<BillingInvoiceRow, unknown>;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      className="mx-auto h-auto py-1.5 px-2 text-center"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span className="leading-tight">{children}</span>
      <ArrowUpDown className="ml-2 size-4" />
    </Button>
  );
}

function MultilineLabel({
  line1,
  line2,
}: {
  line1: string;
  line2?: string;
}) {
  return (
    <span className="inline-block text-center leading-tight">
      {line1}
      {line2 ? (
        <>
          <br />
          {line2}
        </>
      ) : null}
    </span>
  );
}

export const billingInvoiceColumns = (
  onOpenDrawer: (invoice: BillingInvoiceRow) => void
): ColumnDef<BillingInvoiceRow>[] => [
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Invoice #" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("invoiceNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "projectNo",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Project #" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("projectNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "contractor",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Contractor" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("contractor")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Project Name" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("projectName")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "billedTonnage",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Billed" line2="Tonnage" />
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{Number(row.getValue("billedTonnage")).toFixed(2)}</div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "unitPriceOrLumpSum",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Unit Price/" line2="Lump Sum" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("unitPriceOrLumpSum")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "tonsBilledAmount",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Tons Billed" line2="Amount" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{money.format(Number(row.getValue("tonsBilledAmount")))}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "billedHoursCo",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Billed" line2="Hours (CO)" />
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{Number(row.getValue("billedHoursCo")).toFixed(1)}</div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "coPrice",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="CO Price" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{money.format(Number(row.getValue("coPrice")))}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "coBilledAmount",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="CO Billed" line2="Amount" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{money.format(Number(row.getValue("coBilledAmount")))}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "totalAmountBilled",
    header: ({ column }) => (
      <SortableHeader column={column}>
        <MultilineLabel line1="Total" line2="Amount Billed" />
      </SortableHeader>
    ),
    cell: ({ row }) => <div className="font-medium">{money.format(Number(row.getValue("totalAmountBilled")))}</div>,
    meta: { align: "center" },
  },
  {
    id: "actions",
    header: () => <div className="text-center font-semibold">Action</div>,
    cell: ({ row }) => {
      const status = row.original.status; // Get status from row data
      const canPay = status !== "Paid" && status !== "Cancelled";
      
      return (
        <div className="flex justify-center gap-2">
          {canPay ? (
            <Button
              size="sm"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from also firing
                onOpenDrawer(row.original); // Open drawer with this invoice
              }}
            >
              Pay Now
            </Button>
          ) : (
            <span className="text-sm text-emerald-600 font-medium">✓ Paid</span>
          )}
        </div>
      );
    },
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  },
];


