"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  Column,
  FilterFn,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
} from "@/lib/utils/icon-imports";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";
type ColumnMeta = {
  align?: Align;
  headerClassName?: string;
  cellClassName?: string;
};

function alignClass(align: Align | undefined) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function columnLabel<TData>(col: Column<TData, unknown>) {
  const header = col.columnDef.header;
  if (typeof header === "string") return header;
  const accessorKey = (col.columnDef as { accessorKey?: unknown }).accessorKey;
  if (typeof accessorKey === "string") return accessorKey;
  return col.id;
}

function SectionTableCardInner<TData extends Record<string, unknown>, TValue>({
  title,
  data,
  columns,
  search,
  exportFilename = "export.csv",
  renderFilterMenu,
  headerClassName = "bg-emerald-50/70",
  pageSizes = [10, 20, 50],
  onRowClick,
  isLoading,
  pagination,
  enablePdfExport = false,
}: {
  title: string;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  search?: { columnId: string; placeholder: string };
  exportFilename?: string;
  renderFilterMenu?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  headerClassName?: string;
  pageSizes?: number[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  pagination?: React.ReactNode;
  enablePdfExport?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Function to download PDF file
  const downloadPdf = React.useCallback((pdfPath: string, filename: string) => {
    try {
      // Handle Google Drive URLs - convert to download URL
      if (pdfPath.includes('drive.google.com')) {
        const fileIdMatch = pdfPath.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          // Use Google Drive's direct download URL
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          // Open in new tab for Google Drive (they handle the download)
          window.open(downloadUrl, '_blank');
          return;
        }
      }

      // For relative paths, construct full URL
      let url = pdfPath;
      if (!pdfPath.startsWith('http')) {
        // Relative path - make it absolute
        url = pdfPath.startsWith('/') 
          ? `${window.location.origin}${pdfPath}`
          : `${window.location.origin}/${pdfPath}`;
      }

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Final fallback: open in new tab
      let fallbackUrl = pdfPath;
      if (!pdfPath.startsWith('http') && !pdfPath.startsWith('/')) {
        fallbackUrl = '/' + pdfPath;
      }
      window.open(fallbackUrl, '_blank');
    }
  }, []);

  // Handle checkbox change - export PDF if enabled
  const handleCheckboxChange = React.useCallback((row: TData, checked: boolean) => {
    if (checked && enablePdfExport) {
      const pdfPath = (row as any).pdfPath;
      const dwgNo = (row as any).dwgNo || 'document';
      
      if (pdfPath) {
        const filename = `${dwgNo}.pdf`;
        downloadPdf(pdfPath, filename);
      }
    }
  }, [enablePdfExport, downloadPdf]);

  const stringIncludes: FilterFn<TData> = React.useCallback(
    (row, columnId, filterValue) => {
      const needle = String(filterValue ?? "").toLowerCase().trim();
      if (!needle) return true;
      const raw = row.getValue(columnId);
      const hay = raw == null ? "" : String(raw).toLowerCase();
      return hay.includes(needle);
    },
    []
  );

  const selectionColumn = React.useMemo<ColumnDef<TData>>(
    () => ({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            // If PDF export is enabled and selecting all, export all PDFs
            if (value && enablePdfExport) {
              const selectedRows = table.getFilteredRowModel().rows;
              selectedRows.forEach((r) => {
                const pdfPath = (r.original as any).pdfPath;
                const dwgNo = (r.original as any).dwgNo || 'document';
                if (pdfPath) {
                  downloadPdf(pdfPath, `${dwgNo}.pdf`);
                }
              });
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            handleCheckboxChange(row.original, !!value);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { align: "center", headerClassName: "w-10", cellClassName: "w-10" },
    }),
    [enablePdfExport, downloadPdf, handleCheckboxChange]
  );

  const columnsWithSelection = React.useMemo(
    () => [selectionColumn, ...(columns as ColumnDef<TData, unknown>[])],
    [selectionColumn, columns]
  );

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    defaultColumn: { filterFn: stringIncludes },
  });

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  
  const paginationInfo = React.useMemo(() => {
    const start = total === 0 ? 0 : pageIndex * pageSize + 1;
    const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);
    return { start, end };
  }, [total, pageIndex, pageSize]);
  
  const handleExport = React.useCallback(() => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original);
    downloadText(exportFilename, toCsv(rows), "text/csv");
  }, [table, exportFilename]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="size-4" />
            Export All
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Eye className="mr-2 size-4" />
                Columns
                <ChevronDown className="ml-1 size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Show Columns</div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {table
                  .getAllColumns()
                  .filter((column) => {
                    // Always show select and actions columns
                    if (column.id === "select" || column.id === "actions") {
                      return false;
                    }
                    return column.getCanHide();
                  })
                  .map((column) => {
                    const label = columnLabel(column);
                    const isVisible = column.getIsVisible();
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={isVisible}
                        onCheckedChange={(value) => {
                          if (value) {
                            // If selecting a column, hide all others first, then show selected
                            const allColumns = table.getAllColumns().filter(
                              (c) => c.id !== "select" && c.id !== "actions" && c.getCanHide()
                            );
                            // Hide all columns first
                            allColumns.forEach((c) => {
                              c.toggleVisibility(c.id === column.id);
                            });
                          } else {
                            // If unchecking, just hide this column
                            column.toggleVisibility(false);
                          }
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // Show all columns
                    table.getAllColumns().forEach((column) => {
                      if (column.getCanHide()) {
                        column.toggleVisibility(true);
                      }
                    });
                  }}
                >
                  Show All
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={headerClassName}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 py-4",
                        alignClass((header.column.columnDef.meta as ColumnMeta)?.align),
                        (header.column.columnDef.meta as ColumnMeta)?.headerClassName
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="w-full">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-4",
                          alignClass((cell.column.columnDef.meta as ColumnMeta)?.align),
                          (cell.column.columnDef.meta as ColumnMeta)?.cellClassName
                        )}
                      >
                        <div className="w-full">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithSelection.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="mt-4">{pagination}</div>
        ) : (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Rows per page</div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="w-20" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                {paginationInfo.start}-{paginationInfo.end} of {total} records
              </div>
              <div>
                Page {total === 0 ? 0 : pageIndex + 1} of {table.getPageCount() || 1}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="size-4" />
                  <span className="sr-only">First page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">Next page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="size-4" />
                  <span className="sr-only">Last page</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SectionTableCard = React.memo(SectionTableCardInner) as typeof SectionTableCardInner;

