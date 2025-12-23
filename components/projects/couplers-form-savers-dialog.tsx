"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { demoCouplersFormSavers } from "@/public/assets";

export type CouplersFormSaversRow = {
  sNo: number;
  dwgNo: string;
  description: string;
  type: string;
  code: string;
  qtyPerBarSize: {
    bar4?: number;
    bar5?: number;
    bar6?: number;
    bar7?: number;
    bar8?: number;
    bar9?: number;
    bar10?: number;
    bar11?: number;
    bar14?: number;
    bar18?: number;
  };
  remarks: string;
};

export function CouplersFormSaversDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = demoCouplersFormSavers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[75vh] h-[70vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Couplers/Form Savers</DialogTitle>
          <DialogDescription>
            Couplers and form savers details for the project
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      S.No
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Dwg. No.
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Description
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Type
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Code
                    </TableHead>
                    <TableHead
                      colSpan={10}
                      className="px-4 py-4 text-center font-semibold text-emerald-900 border-x"
                    >
                      Qty per Bar size
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      REMARKS
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900 border-x">
                      #4
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #5
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #6
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #7
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #8
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #9
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #10
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #11
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      #14
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900 border-x">
                      #18
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.sNo}>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.sNo}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.dwgNo}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.description}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.type}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.code}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center border-x">
                        {row.qtyPerBarSize.bar4 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar5 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar6 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar7 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar8 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar9 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar10 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar11 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qtyPerBarSize.bar14 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center border-x">
                        {row.qtyPerBarSize.bar18 ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.remarks}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

