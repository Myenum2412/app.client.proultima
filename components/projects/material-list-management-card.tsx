"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessoriesDialog } from "@/components/projects/accessories-dialog";
import { CouplersFormSaversDialog } from "@/components/projects/couplers-form-savers-dialog";
import { motion } from "framer-motion";
import { getDummyMaterialListManagement } from "@/components/projects/utils";

export type MaterialListBarListRow = {
  id?: string;
  dwgNo: string;
  releaseDescription: string;
  ctrlCode: string;
  relNo: string | number;
  weightLbs: string | number;
  date: string;
  varyingBars: string;
  remarks: string;
};

export type MaterialListField = { id?: string; label: string; value: string };

export type MaterialListBlock = {
  id?: string;
  heading: string;
  status: "released" | "under_review" | string;
  priority: "High" | "Medium" | string;
  note?: string;
  barList: MaterialListBarListRow[];
  additionalFields: MaterialListField[];
};

export function MaterialListManagementCard({
  title = "Material List Management",
  blocks,
}: {
  title?: string;
  blocks?: MaterialListBlock[];
}) {
  const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(false);
  const [isCouplersFormSaversOpen, setIsCouplersFormSaversOpen] = useState(false);

  // 🚀 OPTIMIZATION: Lazy load dummy data only when component renders
  const materialBlocks = useMemo(() => {
    if (blocks && blocks.length > 0) return blocks;
    
    // Import and generate dummy data lazily
    return getDummyMaterialListManagement();
  }, [blocks]);

  if (!materialBlocks.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
              <div className="flex flex-col gap-10">
                {materialBlocks.map((block, idx) => (
              <motion.div
                key={block.id ?? block.heading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-lg font-semibold">{block.heading}</div>
                  <div className="flex items-center gap-2">
                    {String(block.status).toLowerCase() === "released" ? (
                      <>
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <Badge className="bg-emerald-600 text-white border-transparent px-4 py-1.5">
                          Released
                        </Badge>
                        <Badge className="bg-white text-red-600 border border-red-200 px-4 py-1.5">
                          {block.priority}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Eye className="size-5 text-white" />
                        <Badge className="bg-primary text-white border-transparent px-4 py-1.5">
                          Under Review
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-1.5">
                          {block.priority}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {block.note ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-blue-700"
                  >
                    <span className="font-semibold">Note:</span> {block.note}
                  </motion.div>
                ) : null}

                <div className="mt-8 text-base font-semibold">Bar List Summary</div>

                <div className="mt-4 overflow-x-auto overflow-y-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-background">
                        <TableHead className="px-4 py-4">DWG #</TableHead>
                        <TableHead className="px-4 py-4">
                          Release Description
                        </TableHead>
                        <TableHead className="px-4 py-4">CTRL Code</TableHead>
                        <TableHead className="px-4 py-4">REL #</TableHead>
                        <TableHead className="px-4 py-4">WT (LBS)</TableHead>
                        <TableHead className="px-4 py-4">Date</TableHead>
                        <TableHead className="px-4 py-4">Varying Bars</TableHead>
                        <TableHead className="px-4 py-4">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.barList.map((row, rowIdx) => (
                        <motion.tr
                          key={row.id ?? `${row.dwgNo}-${row.relNo}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: rowIdx * 0.03 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="px-4 py-4 font-medium">
                            {row.dwgNo}
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            {row.releaseDescription}
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge className="bg-white border border-zinc-200 text-foreground px-3 py-1">
                              {row.ctrlCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4">{row.relNo}</TableCell>
                          <TableCell className="px-4 py-4">
                            {row.weightLbs}
                          </TableCell>
                          <TableCell className="px-4 py-4">{row.date}</TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge className="bg-zinc-100 text-zinc-900 border-transparent px-4 py-1">
                              {row.varyingBars}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4 font-medium">
                            {row.remarks}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8 text-base font-semibold">Additional Fields</div>
                <div className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {block.additionalFields.map((f, fieldIdx) => {
                    const labelLower = f.label.toLowerCase();
                    const isAccessories = labelLower === "accessories";
                    const isCouplersFormSavers = labelLower.includes("couplers") || labelLower.includes("form savers");
                    const isClickable = isAccessories || isCouplersFormSavers;
                    
                    return (
                      <motion.div
                        key={f.id ?? f.label}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: fieldIdx * 0.05 }}
                        className={isClickable ? "cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors" : ""}
                        onClick={isClickable ? () => {
                          if (isAccessories) setIsAccessoriesOpen(true);
                          if (isCouplersFormSavers) setIsCouplersFormSaversOpen(true);
                        } : undefined}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (isClickable && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            if (isAccessories) setIsAccessoriesOpen(true);
                            if (isCouplersFormSavers) setIsCouplersFormSaversOpen(true);
                          }
                        }}
                      >
                        <div className="text-sm text-muted-foreground">
                          {f.label}:
                        </div>
                        <div className="mt-1 text-base font-semibold">{f.value}</div>
                      </motion.div>
                    );
                  })}
                </div>

                    {idx < materialBlocks.length - 1 ? <Separator className="mt-10" /> : null}
              </motion.div>
            ))}
          </div>
        </CardContent>
        <AccessoriesDialog
          open={isAccessoriesOpen}
          onOpenChange={setIsAccessoriesOpen}
        />
        <CouplersFormSaversDialog
          open={isCouplersFormSaversOpen}
          onOpenChange={setIsCouplersFormSaversOpen}
        />
      </Card>
    </motion.div>
  );
}

