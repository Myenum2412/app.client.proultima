"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Download,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDrawingLog, type DrawingLog } from "@/hooks/use-assets";
import { LoadingState } from "@/components/ui/loading-state";
import { DrawingDetailView } from "@/components/drawing-detail-view";
import { DrawingPdfModal } from "@/components/drawing-pdf-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export type DrawingLogTableData = DrawingLog;

const statusColors = {
  APP: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "R&R":
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export const drawingLogColumns: ColumnDef<DrawingLogTableData>[] = [
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
    accessorKey: "dwg",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>DWG #</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium py-2">
        {row.getValue("dwg")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Status</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="py-2">
          <Badge
            className={statusColors[status as keyof typeof statusColors] || ""}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Description</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div
        className="text-sm max-w-[300px] truncate py-2"
        title={row.getValue("description") as string}
      >
        {row.getValue("description") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "totalWeight",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Total Weight (Tons)</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const weight = row.getValue("totalWeight") as number;
      return (
        <div className="text-sm font-medium py-2">
          {weight ? weight.toFixed(1) : "0.0"}
        </div>
      );
    },
  },
  {
    accessorKey: "latestSubmittedDate",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Latest Submitted Date</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("latestSubmittedDate") as string;
      return <div className="text-sm py-2">{date || "—"}</div>;
    },
  },
  {
    accessorKey: "weeksSinceSent",
    header: ({ column }) => {
      const sortState = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Weeks Since Sent</span>
          {sortState === "asc" && (
            <span className="ml-2 text-xs">(Low to High)</span>
          )}
          {sortState === "desc" && (
            <span className="ml-2 text-xs">(High to Low)</span>
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const weeks = row.getValue("weeksSinceSent") as string | undefined;
      return <div className="text-sm py-2">{weeks || "—"}</div>;
    },
  },
];

export interface DrawingLogTableRef {
  handleEmail: () => void;
  isEmailDisabled: boolean;
  selectedCount: number;
}

interface DrawingLogTableProps {
  drawings?: DrawingLog[];
  projectId?: string;
  projectNumber?: string;
  projectName?: string;
}

export const DrawingLogTable = React.forwardRef<
  DrawingLogTableRef,
  DrawingLogTableProps
>(({ drawings, projectId, projectNumber, projectName }, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedDrawing, setSelectedDrawing] =
    React.useState<DrawingLog | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = React.useState(false);
  const [selectedPdfDrawing, setSelectedPdfDrawing] =
    React.useState<DrawingLog | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false);

  // Fetch from Supabase if projectId is provided
  const { data: supabaseDrawings = [], isLoading } = useDrawingLog(projectId);

  // Directly use Supabase data when projectId is provided, otherwise use provided drawings
  const data = React.useMemo(() => {
    // If projectId is provided, always use Supabase data (ignore drawings prop)
    if (projectId) {
      console.log("[DrawingLog] Using Supabase data:", {
        projectId,
        count: supabaseDrawings?.length || 0,
      });
      return supabaseDrawings || [];
    }
    // Otherwise, use provided drawings prop
    console.log("[DrawingLog] Using provided drawings:", {
      count: drawings?.length || 0,
    });
    return drawings || [];
  }, [projectId, supabaseDrawings, drawings]);

  // Debounce global filter for better performance - MUST be called before any conditional returns
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);

  // Handle drawing navigation from detail view - MUST be called before any conditional returns
  React.useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const drawing = event.detail.drawing as DrawingLog;
      setSelectedDrawing(drawing);
      setIsDetailViewOpen(true);
    };

    window.addEventListener(
      "drawing-navigate",
      handleNavigate as EventListener
    );
    return () => {
      window.removeEventListener(
        "drawing-navigate",
        handleNavigate as EventListener
      );
    };
  }, []);

  const handleRowClick = (drawing: DrawingLog) => {
    // Check if PDF exists, if so open PDF modal, otherwise open detail view
    if (drawing.pdfPath && drawing.pdfPath.trim() !== "") {
      // Helper function to get PDF URL
      const getPdfUrl = (pdfPath: string): string => {
        // If it's already a full URL, return as is
        if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
          return pdfPath;
        }
        // If it's a local path starting with /, check if it's in public/assets
        if (pdfPath.startsWith("/")) {
          if (pdfPath.startsWith("/assets/")) {
            const relativePath = pdfPath.replace("/assets/", "");
            return `/api/pdf?path=${encodeURIComponent(relativePath)}`;
          }
          return pdfPath;
        }
        // If pdfPath is just a filename or relative path, construct the full path
        const project = projectNumber || "PRO-2025-001";
        const folder = "Drawing-Log";
        const relativePath = `${project}/${folder}/${pdfPath}`;
        return `/api/pdf?path=${encodeURIComponent(relativePath)}`;
      };

      const pdfUrl = getPdfUrl(drawing.pdfPath);
      const drawingWithUrl = { ...drawing, pdfPath: pdfUrl };
      setSelectedPdfDrawing(drawingWithUrl);
      setIsPdfModalOpen(true);
    } else {
      setSelectedDrawing(drawing);
      setIsDetailViewOpen(true);
    }
  };

  // Use data directly without filtering - MUST be called before any conditional returns
  const table = useReactTable({
    data: data,
    columns: drawingLogColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  // All useState hooks MUST be called before any conditional returns
  const [isDownloadingFiles, setIsDownloadingFiles] = React.useState(false);

  // Define handler functions before hooks that depend on them
  const handleOpenOutlookEmail = React.useCallback(async () => {
    if (selectedRows.length === 0) return;

    setIsDownloadingFiles(true);
    try {
      const selectedDrawings = selectedRows.map((row) => row.original);

      // Generate email body with metadata
      const emailBody = generateEmailBody(
        selectedDrawings,
        projectNumber,
        projectName
      );
      const emailSubject = `Drawing Log - ${projectNumber || "Project"}`;

      // Download selected PDFs as zip
      await downloadSelectedPDFsAsZip(selectedDrawings, projectNumber);

      // Create mailto link
      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;

      // Open Outlook/email client
      window.location.href = mailtoLink;
    } catch (error) {
      console.error("Failed to prepare email:", error);
      alert("Failed to prepare email. Please try again.");
    } finally {
      setIsDownloadingFiles(false);
    }
  }, [selectedRows, projectNumber, projectName]);

  const generateEmailBody = (
    drawings: DrawingLog[],
    projectNumber?: string,
    projectName?: string
  ): string => {
    const drawingsList = drawings
      .map((drawing, index) => {
        return `${index + 1}. Drawing Number: ${drawing.dwg}
   Status: ${drawing.status}
   Description: ${drawing.description || "N/A"}
   Total Weight: ${
     drawing.totalWeight ? drawing.totalWeight.toFixed(1) : "0.0"
   } Tons
   Latest Submitted Date: ${drawing.latestSubmittedDate || "N/A"}
   Weeks Since Sent: ${drawing.weeksSinceSent || "N/A"}`;
      })
      .join("\n\n");

    return `Drawing Log

${projectNumber ? `Project Number: ${projectNumber}` : ""}
${projectName ? `Project Name: ${projectName}` : ""}
Total Drawings: ${drawings.length}

Selected Drawings:
${drawingsList}

Please find the attached PDF files in the downloaded zip file.

This is an automated notification from Proultima.`;
  };

  const downloadSelectedPDFsAsZip = async (
    drawings: DrawingLog[],
    projectNumber?: string
  ): Promise<void> => {
    // Create a zip file using JSZip
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Download each PDF and add to zip
    const downloadPromises = drawings.map(async (drawing) => {
      if (!drawing.pdfPath) return;

      try {
        let pdfPath = drawing.pdfPath;
        if (
          !pdfPath.includes("/") &&
          !pdfPath.startsWith("/") &&
          !pdfPath.startsWith("http")
        ) {
          const project = projectNumber || "PRO-2025-001";
          pdfPath = `${project}/Drawing-Log/${pdfPath}`;
        }

        // Construct PDF URL
        let pdfUrl = pdfPath;
        if (pdfPath.startsWith("/assets/")) {
          const relativePath = pdfPath.replace("/assets/", "");
          pdfUrl = `/api/pdf?path=${encodeURIComponent(relativePath)}`;
        } else if (!pdfPath.startsWith("http")) {
          pdfUrl = `/api/pdf?path=${encodeURIComponent(pdfPath)}`;
        }

        const response = await fetch(pdfUrl);
        const blob = await response.blob();

        // Add to zip with drawing number as filename
        zip.file(`${drawing.dwg}.pdf`, blob);
      } catch (error) {
        console.error(`Failed to download PDF for ${drawing.dwg}:`, error);
      }
    });

    await Promise.all(downloadPromises);

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Download zip file
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = `drawing-log-${projectNumber || "project"}-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Expose email handler to parent via ref - MUST be called before any conditional returns
  React.useImperativeHandle(
    ref,
    () => ({
      handleEmail: handleOpenOutlookEmail,
      isEmailDisabled: selectedRows.length === 0 || isDownloadingFiles,
      selectedCount: selectedRows.length,
    }),
    [handleOpenOutlookEmail, selectedRows.length, isDownloadingFiles]
  );

  // Conditional return MUST be after ALL hooks (useState, useMemo, useEffect, useReactTable, useImperativeHandle, useCallback)
  if (isLoading && projectId) {
    return <LoadingState message="Loading drawing log..." />;
  }

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return;

    const csvHeaders = [
      "DWG #",
      "Status",
      "Description",
      "Total Weight (Tons)",
      "Latest Submitted Date",
      "Weeks Since Sent",
    ];
    const csvRows = selectedRows.map((row) => [
      row.original.dwg,
      row.original.status,
      row.original.description,
      row.original.totalWeight.toFixed(1),
      row.original.latestSubmittedDate,
      row.original.weeksSinceSent || "",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `drawing-log-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden -mt-8">
      <div className=" flex-shrink-0">
        <p className="text-sm text-muted-foreground px-1">
          View and manage all drawing log records
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 flex-shrink-0">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Filter by DWG #, description, or status..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportSelected}
              className="gap-2"
              title="Export selected drawings"
            >
              <Download className="h-4 w-4" />
              Export Selected ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              // Export all filtered drawings to CSV
              const csvHeaders = [
                "DWG #",
                "Status",
                "Description",
                "Total Weight (Tons)",
                "Latest Submitted Date",
                "Weeks Since Sent",
              ];
              const csvRows = data.map((drawing) => [
                drawing.dwg,
                drawing.status,
                drawing.description,
                drawing.totalWeight.toFixed(1),
                drawing.latestSubmittedDate,
                drawing.weeksSinceSent || "",
              ]);

              const csvContent = [
                csvHeaders.join(","),
                ...csvRows.map((row) =>
                  row.map((cell) => `"${cell}"`).join(",")
                ),
              ].join("\n");

              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute(
                "download",
                `drawing-log-${format(new Date(), "yyyy-MM-dd")}.csv`
              );
              link.style.visibility = "hidden";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export All
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="relative flex-1 overflow-auto min-w-0 w-full">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-green-50 dark:bg-green-950/20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-green-50 dark:bg-green-950/20"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="text-black dark:text-white font-semibold whitespace-nowrap bg-green-50 dark:bg-green-950/20 px-3 py-2"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        row.getIsSelected() && "bg-muted"
                      )}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on checkbox
                        if (
                          (e.target as HTMLElement).closest(
                            'input[type="checkbox"]'
                          )
                        ) {
                          return;
                        }
                        handleRowClick(row.original);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="whitespace-nowrap px-3 py-2"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={drawingLogColumns.length}
                      className="h-24 text-center"
                    >
                      No drawings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="text-sm text-muted-foreground">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} records
          </div>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drawing Detail View */}
      {selectedDrawing && (
        <DrawingDetailView
          drawing={{
            dwg: selectedDrawing.dwg,
            status: selectedDrawing.status,
            description: selectedDrawing.description,
            releaseStatus: "",
            latestSubmittedDate: selectedDrawing.latestSubmittedDate,
            pdfPath: selectedDrawing.pdfPath,
          }}
          drawings={data.map((d) => ({
            dwg: d.dwg,
            status: d.status,
            description: d.description,
            releaseStatus: "",
            latestSubmittedDate: d.latestSubmittedDate,
            pdfPath: d.pdfPath,
          }))}
          open={isDetailViewOpen}
          onOpenChange={setIsDetailViewOpen}
          userRole="manager"
          userName="Current User"
        />
      )}

      {/* PDF Modal */}
      {selectedPdfDrawing && (
        <DrawingPdfModal
          open={isPdfModalOpen}
          onOpenChange={setIsPdfModalOpen}
          pdfUrl={selectedPdfDrawing.pdfPath || ""}
          title={`Drawing ${selectedPdfDrawing.dwg}`}
          description={selectedPdfDrawing.description}
        />
      )}
    </div>
  );
});

DrawingLogTable.displayName = "DrawingLogTable";
