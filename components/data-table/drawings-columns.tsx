"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export type DrawingRow = {
  id: string;
  dwgNo: string;
  status: "APP" | "REV" | "REJ" | "PND";
  description: string;
  totalWeightTons: number;
  latestSubmittedDate: string;
  weeksSinceSent: number;
};

function statusBadge(status: DrawingRow["status"]) {
  switch (status) {
    case "APP":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-transparent">
          APP
        </Badge>
      );
    case "REV":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-transparent">
          REV
        </Badge>
      );
    case "REJ":
      return (
        <Badge className="bg-red-100 text-red-700 border-transparent">
          REJ
        </Badge>
      );
    case "PND":
    default:
      return (
        <Badge className="bg-zinc-100 text-zinc-700 border-transparent">
          PND
        </Badge>
      );
  }
}

export const drawingsColumns: ColumnDef<DrawingRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "dwgNo",
    header: "DWG #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("dwgNo")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusBadge(row.getValue("status") as DrawingRow["status"]),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("description")}</div>
    ),
  },
  {
    accessorKey: "totalWeightTons",
    header: "Total Weight (Tons)",
    cell: ({ row }) => (
      <div className="font-medium">{Number(row.getValue("totalWeightTons")).toFixed(1)}</div>
    ),
  },
  {
    accessorKey: "latestSubmittedDate",
    header: "Latest Submitted Date",
    cell: ({ row }) => <div>{row.getValue("latestSubmittedDate")}</div>,
  },
  {
    accessorKey: "weeksSinceSent",
    header: "Release Status",
    cell: ({ row }) => <div>{row.getValue("weeksSinceSent")}</div>,
  },
];


