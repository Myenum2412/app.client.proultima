"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
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

export function DataTablePro<TData, TValue>({
  columns,
  data,
  searchColumnId,
  searchPlaceholder = "Search...",
  exportFilename = "export.csv",
  filterLabel = "Filter",
  renderFilterMenu,
  headerClassName = "bg-emerald-50/70",
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumnId?: string;
  searchPlaceholder?: string;
  exportFilename?: string;
  filterLabel?: string;
  renderFilterMenu?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  headerClassName?: string;
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
      const needle = String(filterValue ?? "").toLowerCase().trim();
      if (!needle) return true;
      const raw = row.getValue(columnId);
      const hay = raw == null ? "" : String(raw).toLowerCase();
      return hay.includes(needle);
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    defaultColumn: { filterFn: stringIncludes },
  });

  const searchColumn = searchColumnId
    ? table.getColumn(searchColumnId)
    : undefined;

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-lg">
          <Input
            placeholder={searchPlaceholder}
            value={(searchColumn?.getFilterValue() as string) ?? ""}
            onChange={(e) => searchColumn?.setFilterValue(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const rows = table.getFilteredRowModel().rows.map((r) => {
                const obj: Record<string, unknown> = {};
                for (const key of Object.keys(r.original as any)) {
                  obj[key] = (r.original as any)[key];
                }
                return obj;
              });
              downloadText(exportFilename, toCsv(rows), "text/csv");
            }}
          >
            <Download className="size-4" />
            Export All
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {filterLabel}
                <ChevronDown className="ml-1 size-4 opacity-60" />
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
                    {table.getAllLeafColumns().map((col) => {
                      const header = col.columnDef.header;
                      const accessorKey = (col.columnDef as { accessorKey?: unknown })
                        .accessorKey;
                      const label: string =
                        typeof header === "string"
                          ? header
                          : typeof accessorKey === "string"
                            ? accessorKey
                            : col.id;
                      const value = (col.getFilterValue() as string) ?? "";
                      return (
                        <div key={col.id} className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {label}
                          </div>
                          <Input
                            value={value}
                            onChange={(e) => {
                              const v = e.target.value;
                              col.setFilterValue(v ? v : undefined);
                            }}
                            placeholder={`Filter ${String(label).toLowerCase()}...`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={headerClassName}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
              {[10, 20, 50].map((s) => (
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
    </div>
  );
}


