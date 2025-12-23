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
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/public/assets";
import { cn } from "@/lib/utils";

type ActiveProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getStatusVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("released completely")) {
    return "default"; // Green/success color
  }
  if (normalized.includes("in progress") || normalized.includes("partially")) {
    return "secondary"; // Blue/in-progress color
  }
  if (normalized.includes("pending") || normalized.includes("not released")) {
    return "outline"; // Gray/pending color
  }
  return "outline";
}

export function ActiveProjectsDialog({ open, onOpenChange }: ActiveProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[75vh] h-[70vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full border-b">
          <DialogTitle>Active Projects</DialogTitle>
          <DialogDescription>
            List of all ongoing projects and their current status
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70">
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Job Number</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Project Name</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Contractor</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Location</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Estimated Tons</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Detailing Status</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Revision Status</TableHead>
                    <TableHead className="px-4 py-4 text-center text-emerald-900 font-semibold">Release Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoProjects.map((project, index) => (
                    <TableRow key={index}>
                      <TableCell className="px-4 py-4 text-center font-medium">{project.jobNumber}</TableCell>
                      <TableCell className="px-4 py-4 text-center max-w-xs truncate" title={project.name}>
                        {project.name}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">{project.contractorName ?? "—"}</TableCell>
                      <TableCell className="px-4 py-4 text-center">{project.location ?? "—"}</TableCell>
                      <TableCell className="px-4 py-4 text-center">{project.estimatedTons?.toFixed(1) ?? "—"}</TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge variant={getStatusVariant(project.detailingStatus)}>
                          {project.detailingStatus ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge variant={getStatusVariant(project.revisionStatus)}>
                          {project.revisionStatus ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge variant={getStatusVariant(project.releaseStatus)}>
                          {project.releaseStatus ?? "—"}
                        </Badge>
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

