"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, Download, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSubmissions } from "@/hooks/use-submissions"
import { LoadingState } from "@/components/ui/loading-state"
import { cn } from "@/lib/utils"

export interface Submission {
  id: string
  proNumber: string
  projectName: string
  submissionType: string
  workDescription: string
  drawing: string
  sheets: string
  submissionDate: string
  projectId?: string
  releaseStatus?: string
  pdfPath?: string
}

const statusColors = {
  APP: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "R&R": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  FFU: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export const submissionsColumns: ColumnDef<Submission>[] = [
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
    accessorKey: "proNumber",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Pro Number</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium py-2">{row.getValue("proNumber")}</div>
    ),
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Project Name</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm py-2 max-w-[200px] truncate" title={row.getValue("projectName") as string}>
        {row.getValue("projectName")}
      </div>
    ),
  },
  {
    accessorKey: "submissionType",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Submission Type</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("submissionType") as string
      return (
        <div className="py-2">
          <Badge className={statusColors[status as keyof typeof statusColors] || ""}>
            {status}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "workDescription",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Work Description</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm max-w-[300px] truncate py-2" title={row.getValue("workDescription") as string}>
        {row.getValue("workDescription") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "drawing",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Drawing</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(A-Z)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Z-A)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium py-2">{row.getValue("drawing")}</div>
    ),
  },
  {
    accessorKey: "sheets",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Sheets (Revision)</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm font-medium py-2">{row.getValue("sheets")}</div>
    ),
  },
  {
    accessorKey: "submissionDate",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Submission Date</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Oldest First)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(Newest First)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("submissionDate") as string
      return (
        <div className="text-sm py-2">
          {date && date !== "—" ? format(new Date(date), "MMM dd, yyyy") : "—"}
        </div>
      )
    },
  },
]

export function SubmissionsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data: submissions = [], isLoading, error } = useSubmissions(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  )

  // Filter function
  const filteredData = React.useMemo(() => {
    let filtered = submissions

    // Apply global search filter
    if (globalFilter) {
      const filterLower = globalFilter.toLowerCase()
      filtered = filtered.filter((submission: Submission) => {
        const proNumberMatch = submission.proNumber?.toLowerCase().includes(filterLower)
        const projectNameMatch = submission.projectName?.toLowerCase().includes(filterLower)
        const drawingMatch = submission.drawing?.toLowerCase().includes(filterLower)
        const descriptionMatch = submission.workDescription?.toLowerCase().includes(filterLower)
        return proNumberMatch || projectNameMatch || drawingMatch || descriptionMatch
      })
    }

    return filtered
  }, [submissions, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns: submissionsColumns,
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
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return

    const csvHeaders = ["Pro Number", "Project Name", "Submission Type", "Work Description", "Drawing", "Sheets", "Submission Date"]
    const csvRows = selectedRows.map((row) => [
      row.original.proNumber,
      row.original.projectName,
      row.original.submissionType,
      row.original.workDescription,
      row.original.drawing,
      row.original.sheets,
      row.original.submissionDate,
    ])
    
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `submissions-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <LoadingState message="Loading submissions..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-destructive">Error loading submissions</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <h2 className="text-2xl font-bold mb-2">Submissions</h2>
        <p className="text-sm text-muted-foreground">
          View and manage all project submissions
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 shrink-0">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by pro number, project name, drawing, or description..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm pl-9"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="APP">For Approval (APP)</SelectItem>
            <SelectItem value="R&R">R&R</SelectItem>
            <SelectItem value="FFU">File & Field Use (FFU)</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportSelected}
              className="gap-2"
              title="Export selected submissions"
            >
              <Download className="h-4 w-4" />
              Export Selected ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              // Export all filtered submissions to CSV
              const csvHeaders = ["Pro Number", "Project Name", "Submission Type", "Work Description", "Drawing", "Sheets", "Submission Date"]
              const csvRows = filteredData.map((submission: Submission) => [
                submission.proNumber,
                submission.projectName,
                submission.submissionType,
                submission.workDescription,
                submission.drawing,
                submission.sheets,
                submission.submissionDate,
              ])
              
              const csvContent = [
                csvHeaders.join(","),
                ...csvRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
              ].join("\n")
              
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
              const link = document.createElement("a")
              const url = URL.createObjectURL(blob)
              link.setAttribute("href", url)
              link.setAttribute("download", `submissions-${format(new Date(), "yyyy-MM-dd")}.csv`)
              link.style.visibility = "hidden"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export All
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                  )
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
                  <TableRow key={headerGroup.id} className="bg-green-50 dark:bg-green-950/20">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-black dark:text-white font-semibold whitespace-nowrap bg-green-50 dark:bg-green-950/20 px-3 py-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
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
                        "hover:bg-muted/50 transition-colors",
                        row.getIsSelected() && "bg-muted"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap px-3 py-2">
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
                      colSpan={submissionsColumns.length}
                      className="h-24 text-center"
                    >
                      No submissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
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
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} records
          </div>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
    </div>
  )
}

