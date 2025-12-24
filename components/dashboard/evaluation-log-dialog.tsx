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
import { demoEvaluationLog } from "@/public/assets";

export type EvaluationLogRow = {
  category: string;
  element: string;
  dwgNo: string;
  description: string;
  rev0: {
    dos: string;
    weightLbs: number;
  };
};

export function EvaluationLogDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = demoEvaluationLog;

  // Group data by category
  const groupedData = data.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {} as Record<string, Array<typeof data[number]>>);

  // Calculate total weight
  const totalWeight = data.reduce((sum, row) => sum + row.rev0.weightLbs, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>EVALUATION LOG</DialogTitle>
          <DialogDescription>
            Comparison of estimated vs detailed weights
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-emerald-50/70">
                    <th
                      rowSpan={2}
                      className="px-4 py-4 text-center font-semibold text-emerald-900 bg-yellow-100 border-r-2 border-emerald-200 border-b border-emerald-200"
                    >
                      <div className="text-blue-600 underline font-bold">
                        PANELS
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900 border-b border-emerald-200">
                      Elements
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900 border-b border-emerald-200">
                      Dwg No.
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900 border-b border-emerald-200">
                      Description
                    </th>
                    <th
                      colSpan={2}
                      className="px-4 py-4 text-center font-semibold text-emerald-900 border-l-2 border-emerald-200 border-b border-emerald-200"
                    >
                      Rev 0
                    </th>
                  </tr>
                  <tr className="bg-emerald-50/70">
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Elements
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Dwg No.
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Description
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900 border-l-2 border-emerald-200">
                      DOS
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-emerald-900">
                      Weight (Lbs.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedData).map(([category, rows]) => (
                    rows.map((row, index) => (
                      <tr key={`${category}-${index}`} className="border-b">
                        {index === 0 && (
                          <td
                            rowSpan={rows.length}
                            className="px-4 py-4 text-center font-bold bg-yellow-100 border-r-2 border-emerald-200 align-middle"
                          >
                            <div className="text-blue-600 underline font-bold">
                              {category}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4 text-center font-medium">
                          {row.element}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {row.dwgNo}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {row.description}
                        </td>
                        <td className="px-4 py-4 text-center border-l-2 border-emerald-200">
                          {row.rev0.dos}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {row.rev0.weightLbs.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ))}
                  <tr className="bg-red-50/70">
                    <td className="px-4 py-4 text-center font-bold border-r-2 border-emerald-200">
                      {/* Empty for category column */}
                    </td>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center font-bold"
                    >
                      TOTAL (lbs.)
                    </td>
                    <td className="px-4 py-4 text-center font-bold border-l-2 border-emerald-200">
                      {/* Empty for DOS column */}
                    </td>
                    <td className="px-4 py-4 text-center font-bold bg-red-100">
                      {totalWeight.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

