"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReleaseStatusBadge, type ReleaseStatus } from "@/components/projects/release-status-selector";
import {
  billingInvoiceColumns,
  type BillingInvoiceRow,
} from "@/components/billing/invoice-columns";

// Normalize various release status values to the two standard options
function normalizeReleaseStatus(status: string): ReleaseStatus {
  const normalized = status.toLowerCase().trim();
  
  // Check for "Partially Released" indicators
  if (
    normalized.includes("partially") ||
    normalized.includes("partial") ||
    (normalized.includes("released") && (
      normalized.includes("completely") ||
      normalized === "released" ||
      normalized.includes("released completely")
    ))
  ) {
    return "Partially Released";
  }
  
  // Everything else is "Yet to Be Released"
  return "Yet to Be Released";
}

export type DrawingsRow = {
  id: string;
  dwgNo: string;
  status: string;
  description: string;
  totalWeightTons: number;
  latestSubmittedDate: string;
  releaseStatus: string;
  pdfPath?: string;
};

export type DrawingLogRow = {
  id: string;
  dwgNo: string;
  event: string;
  date: string;
  by: string;
  notes: string;
};

export type InvoiceRow = BillingInvoiceRow;

export type SubmissionRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  submissionType: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
};

export type ChangeOrderRow = {
  id: string;
  changeOrderId: string;
  description: string;
  hours: number;
  date: string;
  status: string;
};

function statusPill(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("app")) {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-transparent">
        {label}
      </Badge>
    );
  }
  if (normalized.includes("paid") || normalized.includes("success")) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
        {label}
      </Badge>
    );
  }
  if (normalized.includes("open") || normalized.includes("due") || normalized.includes("pending")) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-transparent">
        {label}
      </Badge>
    );
  }
  if (normalized.includes("reject") || normalized.includes("fail")) {
    return (
      <Badge className="bg-red-100 text-red-700 border-transparent">
        {label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-100 text-zinc-700 border-transparent">
      {label}
    </Badge>
  );
}

export const drawingsColumns: ColumnDef<DrawingsRow>[] = [
  {
    accessorKey: "dwgNo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        DWG #
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("dwgNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusPill(String(row.getValue("status"))),
    meta: { align: "center" },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "totalWeightTons",
    header: "Total Weight (Tons)",
    cell: ({ row }) => (
      <div className="font-medium">
        {Number(row.getValue("totalWeightTons")).toFixed(1)}
      </div>
    ),
    meta: { align: "center" },
  },
  {
    accessorKey: "latestSubmittedDate",
    header: "Latest Submitted Date",
    cell: ({ row }) => <div>{String(row.getValue("latestSubmittedDate"))}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "releaseStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Release Status
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = String(row.getValue("releaseStatus"));
      // Normalize existing statuses to new format
      const normalizedStatus = normalizeReleaseStatus(status);
      
      return (
        <div className="flex justify-center">
          <ReleaseStatusBadge status={normalizedStatus} />
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const status = String(row.getValue(id));
      const normalizedStatus = normalizeReleaseStatus(status);
      
      if (!value || value === "all") return true;
      return normalizedStatus === value;
    },
    sortingFn: (rowA, rowB, columnId) => {
      const statusA = normalizeReleaseStatus(String(rowA.getValue(columnId)));
      const statusB = normalizeReleaseStatus(String(rowB.getValue(columnId)));
      
      // Sort: "Partially Released" first, then "Yet to Be Released"
      if (statusA === statusB) return 0;
      if (statusA === "Partially Released") return -1;
      return 1;
    },
    meta: { 
      align: "center",
      filterVariant: "select",
      filterOptions: [
        { label: "All", value: "all" },
        { label: "Partially Released", value: "Partially Released" },
        { label: "Yet to Be Released", value: "Yet to Be Released" },
      ],
    },
  },
];

export const drawingLogColumns: ColumnDef<DrawingLogRow>[] = [
  { accessorKey: "dwgNo", header: "DWG #", cell: ({ row }) => <div className="font-medium">{row.getValue("dwgNo")}</div> },
  { accessorKey: "event", header: "Event" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "by", header: "By" },
  { accessorKey: "notes", header: "Notes" },
];

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  // Reuse the exact Billing page invoice table columns/heading layout
  // Note: billingInvoiceColumns is now a function, call it with a no-op callback
  ...(billingInvoiceColumns(() => {}) as ColumnDef<InvoiceRow>[]),
];

export const upcomingSubmissionColumns: ColumnDef<SubmissionRow>[] = [
  {
    accessorKey: "proultimaPm",
    header: "PROULTIMA PM",
    cell: ({ row }) => <div className="font-medium">{row.getValue("proultimaPm")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "jobNo",
    header: "JOB #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("jobNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "projectName",
    header: "PROJECT NAME",
    cell: ({ row }) => <div className="font-medium">{row.getValue("projectName")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "submissionType",
    header: "SUBMISSION TYPE",
    cell: ({ row }) => <div className="font-medium">{row.getValue("submissionType")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "workDescription",
    header: "WORK DESCRIPTION",
    cell: ({ row }) => <div className="font-medium">{row.getValue("workDescription")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "drawingNo",
    header: "DRAWING #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("drawingNo")}</div>,
    meta: { align: "center" },
  },
  {
    accessorKey: "submissionDate",
    header: "SUBMISSION DATE",
    cell: ({ row }) => <div className="font-medium">{row.getValue("submissionDate")}</div>,
    meta: { align: "center" },
  },
];

export const changeOrderColumns: ColumnDef<ChangeOrderRow>[] = [
  {
    accessorKey: "changeOrderId",
    header: "Change Order ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("changeOrderId")}</div>
    ),
  },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "hours",
    header: () => <div className="text-right">Hours</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{Number(row.getValue("hours")).toFixed(1)}</div>
    ),
  },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusPill(String(row.getValue("status"))),
  },
];


