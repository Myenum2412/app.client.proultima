"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { SectionTableCard } from "@/components/projects/section-table-card";
import { DrawingPdfDialog } from "@/components/projects/drawing-pdf-dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import PDF viewer to avoid SSR issues with pdf.js
// Using optimized lazy loading utility
import { LazyDrawingPdfViewerAdvanced } from "@/lib/utils/lazy-loading";
const DrawingPdfViewerAdvanced = LazyDrawingPdfViewerAdvanced;
import {
  changeOrderColumns,
  drawingsColumns,
  invoiceColumns,
  upcomingSubmissionColumns,
  type ChangeOrderRow,
  type DrawingsRow,
  type InvoiceRow,
  type SubmissionRow,
} from "@/components/projects/sections";

type SectionKey =
  | "drawings_yet_to_return"
  | "drawings_yet_to_release"
  | "drawing_log"
  | "invoice_history"
  | "upcoming_submissions"
  | "change_orders";

function useProjectSection<T>(projectId: string, section: SectionKey, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.projectSection(projectId, section), page, pageSize],
    queryFn: () =>
      fetchJson<{ data: T[]; pagination: any }>(
        `/api/projects/${encodeURIComponent(projectId)}/sections?section=${encodeURIComponent(section)}&page=${page}&pageSize=${pageSize}`
      ),
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load section data." },
  });
}

function SectionTableCardSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center justify-between gap-4 border-b p-4">
        <div className="font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectSections({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [pdfDialog, setPdfDialog] = useState<{
    open: boolean;
    pdfUrl: string;
    title: string;
    description?: string;
    drawingId?: string;
    dwgNo?: string;
  }>({
    open: false,
    pdfUrl: "",
    title: "",
    drawingId: undefined,
    dwgNo: undefined,
  });

  const drawingsYetToReturn = useProjectSection<DrawingsRow>(
    projectId,
    "drawings_yet_to_return"
  );
  const drawingsYetToRelease = useProjectSection<DrawingsRow>(
    projectId,
    "drawings_yet_to_release"
  );
  const drawingLog = useProjectSection<DrawingsRow>(projectId, "drawing_log");
  const invoiceHistory = useProjectSection<InvoiceRow>(projectId, "invoice_history");
  const upcomingSubmissions = useProjectSection<SubmissionRow>(
    projectId,
    "upcoming_submissions"
  );
  const changeOrders = useProjectSection<ChangeOrderRow>(projectId, "change_orders");

  const handleDrawingLogRowClick = useCallback((row: DrawingsRow) => {
    // Get PDF path from the row data (assuming it's passed through the API)
    const pdfPath = (row as any).pdfPath;
    if (pdfPath) {
      setPdfDialog({
        open: true,
        pdfUrl: pdfPath,
        title: `Drawing ${row.dwgNo} - ${row.description}`,
        description: `Status: ${row.status} | Release Status: ${row.releaseStatus}`,
        drawingId: row.id,
        dwgNo: row.dwgNo,
      });
    }
  }, []);

  const handleSaveAnnotations = useCallback(async (annotations: any[], pdfBlob: Blob) => {
    if (!pdfDialog.drawingId) return;

    try {
      const formData = new FormData();
      formData.append("annotations", JSON.stringify(annotations));
      formData.append("pdfBlob", pdfBlob, "drawing.pdf");
      formData.append("revisionNumber", "1");
      formData.append("revisionStatus", "REVISION");

      const response = await fetch(
        `/api/drawings/${encodeURIComponent(pdfDialog.drawingId)}/annotations`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save annotations");
      }

      // Invalidate queries to refresh drawing log
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSection(projectId, "drawing_log") });
    } catch (error) {
      console.error("Error saving annotations:", error);
      throw error;
    }
  }, [pdfDialog.drawingId, projectId, queryClient]);

  // Helper function to extract data from paginated or non-paginated responses
  const getData = useCallback((query: ReturnType<typeof useProjectSection<any>>) => {
    // Check if the response is paginated (has data.data structure)
    if (query.data && typeof query.data === 'object' && 'data' in query.data) {
      return (query.data as { data: any[] }).data;
    }
    // Fallback to direct array if not paginated
    return (query.data as any[] | undefined) ?? [];
  }, []);

  // Memoize cards configuration to prevent unnecessary re-renders
  const cards = useMemo(
    () => [
      {
        title: "Drawings Yet to Return (APP/R&R)",
        query: drawingsYetToReturn,
        columns: drawingsColumns,
        exportFilename: "drawings-yet-to-return.csv",
      },
      {
        title: "Drawings Yet to Release",
        query: drawingsYetToRelease,
        columns: drawingsColumns,
        exportFilename: "drawings-yet-to-release.csv",
      },
      {
        title: "Drawing Log",
        query: drawingLog,
        columns: drawingsColumns,
        exportFilename: "drawing-log.csv",
      },
      {
        title: "Invoice History",
        query: invoiceHistory,
        columns: invoiceColumns,
        exportFilename: "invoice-history.csv",
      },
      {
        title: "Upcoming Submissions",
        query: upcomingSubmissions,
        columns: upcomingSubmissionColumns,
        exportFilename: "upcoming-submissions.csv",
      },
      {
        title: "Change Orders",
        query: changeOrders,
        columns: changeOrderColumns,
        exportFilename: "change-orders.csv",
      },
    ],
    [
      drawingsYetToReturn.data,
      drawingsYetToRelease.data,
      drawingLog.data,
      invoiceHistory.data,
      upcomingSubmissions.data,
      changeOrders.data,
    ]
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {card.query.isLoading ? (
              <SectionTableCardSkeleton title={card.title} />
            ) : (
              <div
                className={`transition-opacity duration-200 ${
                  card.query.isFetching ? "opacity-70" : "opacity-100"
                }`}
              >
                <SectionTableCard
                  title={card.title}
                  data={getData(card.query) as any}
                  columns={card.columns as any}
                  exportFilename={card.exportFilename}
                  onRowClick={
                    card.title === "Drawing Log" ? handleDrawingLogRowClick : undefined
                  }
                  enablePdfExport={card.title === "Drawing Log"}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <DrawingPdfViewerAdvanced
        open={pdfDialog.open}
        onOpenChange={(open) => setPdfDialog((prev) => ({ ...prev, open }))}
        pdfUrl={pdfDialog.pdfUrl}
        title={pdfDialog.title}
        description={pdfDialog.description}
        drawingId={pdfDialog.drawingId}
        dwgNo={pdfDialog.dwgNo}
        onSave={handleSaveAnnotations}
        userPermissions={{
          canEdit: true,
          canDelete: true,
          canCreateLayers: true,
          canManageRevisions: true,
          isViewOnly: false,
        }}
      />
    </>
  );
}


