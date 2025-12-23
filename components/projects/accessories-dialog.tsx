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
import { demoAccessories } from "@/public/assets";

export type AccessoriesRow = {
  dwgNo: string;
  elements: string;
  description: string;
  supportHeight: string;
  type: string;
  qty: number;
  lft: number;
  remarks: string;
};

export function AccessoriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = demoAccessories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[75vh] h-[70vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Accessories</DialogTitle>
          <DialogDescription>
            Accessories details for the project
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      DWG #
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Elements
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Description
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Support Height
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Type
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Qty
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      LFT
                    </TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Remarks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="px-4 py-4 text-center font-medium">
                        {row.dwgNo}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.elements}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.description}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.supportHeight}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.type}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.qty}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        {row.lft.toFixed(1)}
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

