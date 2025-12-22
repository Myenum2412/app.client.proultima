"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  Eye,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
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
import MaxWidthWrapper from "../MaxWidthWrapper";

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

export function SectionTableCard<
  TData extends Record<string, unknown>,
  TValue
>({
  title,
  data,
  columns,
  search,
  exportFilename = "export.csv",
  renderFilterMenu,
  renderActions,
  headerClassName = "bg-emerald-50/70",
  pageSizes = [10, 20, 50],
  onRowClick,
  isLoading,
  pagination,
}: {
  title: string;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  search?: { columnId: string; placeholder: string };
  exportFilename?: string;
  renderFilterMenu?: (
    table: ReturnType<typeof useReactTable<TData>>
  ) => React.ReactNode;
  renderActions?: (
    table: ReturnType<typeof useReactTable<TData>>
  ) => React.ReactNode;
  headerClassName?: string;
  pageSizes?: number[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  pagination?: React.ReactNode;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const stringIncludes: FilterFn<TData> = React.useCallback(
    (row, columnId, filterValue) => {
      const needle = String(filterValue ?? "")
        .toLowerCase()
        .trim();
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
      meta: { align: "center", headerClassName: "w-10", cellClassName: "w-10" },
    }),
    []
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

  const searchColumn = search ? table.getColumn(search.columnId) : undefined;

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MaxWidthWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-x-hidden mt-5 max-w-[78vw]"
      >
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardAction className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 sm:flex-nowrap">
              {renderActions?.(table)}
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => {
                  const rows = table.getFilteredRowModel().rows.map((r) => {
                    const original = r.original;
                    // Remove internal fields (starting with _)
                    const filtered = Object.fromEntries(
                      Object.entries(original).filter(
                        ([key]) => !key.startsWith("_")
                      )
                    );
                    return filtered;
                  });
                  downloadText(exportFilename, toCsv(rows), "text/csv");
                }}
              >
                <Download className="size-3 sm:size-4" />
                <span className="hidden sm:inline">Export All</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                    <Eye className="mr-1 sm:mr-2 size-3 sm:size-4" />
                    <span className="hidden sm:inline">Columns</span>
                    <span className="sm:hidden">Cols</span>
                    <ChevronDown className="ml-1 size-3 sm:size-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    Show Columns
                  </div>
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
                                const allColumns = table
                                  .getAllColumns()
                                  .filter(
                                    (c) =>
                                      c.id !== "select" &&
                                      c.id !== "actions" &&
                                      c.getCanHide()
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                    <Filter className="mr-1 sm:mr-2 size-3 sm:size-4" />
                    Filter
                    <ChevronDown className="ml-1 size-3 sm:size-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {renderFilterMenu ? (
                    renderFilterMenu(table)
                  ) : (
                    <div className="w-[min(360px,calc(100vw-2rem))] p-3">
                      <div className="flex items-center justify-between gap-3 pb-2">
                        <div className="text-sm font-medium">Filters</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => table.resetColumnFilters()}
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="max-h-80 space-y-3 overflow-auto pr-1">
                        {table
                          .getAllLeafColumns()
                          .filter((c) => c.id !== "select")
                          .map((col) => {
                            const value =
                              (col.getFilterValue() as string) ?? "";
                            const meta = col.columnDef.meta as
                              | {
                                  filterVariant?: string;
                                  filterOptions?: Array<{
                                    label: string;
                                    value: string;
                                  }>;
                                }
                              | undefined;
                            const filterVariant = meta?.filterVariant;
                            const filterOptions = meta?.filterOptions;

                            return (
                              <div key={col.id} className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {columnLabel(col)}
                                </div>
                                {filterVariant === "select" && filterOptions ? (
                                  <Select
                                    value={value || "all"}
                                    onValueChange={(v) => {
                                      col.setFilterValue(
                                        v === "all" ? undefined : v
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filterOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      col.setFilterValue(v ? v : undefined);
                                    }}
                                    placeholder={`Filter ${String(
                                      columnLabel(col)
                                    ).toLowerCase()}...`}
                                  />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>

            {search ? (
              <div className="col-span-full">
                <Input
                  placeholder={search.placeholder}
                  value={(searchColumn?.getFilterValue() as string) ?? ""}
                  onChange={(e) => searchColumn?.setFilterValue(e.target.value)}
                  className="max-w-lg"
                />
              </div>
            ) : null}
          </CardHeader>

          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="overflow-x-auto overflow-y-hidden rounded-lg border"
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className={headerClassName}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={(() => {
                            const meta = (header.column.columnDef.meta ??
                              {}) as ColumnMeta;
                            return [
                              "px-4 py-4",
                              alignClass(meta.align),
                              meta.headerClassName,
                            ]
                              .filter(Boolean)
                              .join(" ");
                          })()}
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
                  <AnimatePresence mode="popLayout">
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onRowClick?.(row.original)}
                          className={
                            onRowClick
                              ? "cursor-pointer hover:bg-muted/50 transition-colors"
                              : "hover:bg-muted/30 transition-colors"
                          }
                        >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={(() => {
                              const meta = (cell.column.columnDef.meta ??
                                {}) as ColumnMeta;
                              return [
                                "px-4 py-4",
                                alignClass(meta.align),
                                meta.cellClassName,
                              ]
                                .filter(Boolean)
                                .join(" ");
                            })()}
                          >
                            <div className="w-full">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </div>
                          </TableCell>
                        ))}
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columnsWithSelection.length}
                          className="h-24 text-center"
                        >
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            No results.
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </motion.div>

            {pagination ? (
              <div className="mt-4">{pagination}</div>
            ) : (
              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    Rows per page
                  </div>
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
                    {start}-{end} of {total} records
                  </div>
                  <div>
                    Page {total === 0 ? 0 : pageIndex + 1} of{" "}
                    {table.getPageCount() || 1}
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
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
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
      </motion.div>
    </MaxWidthWrapper>
  );
}
