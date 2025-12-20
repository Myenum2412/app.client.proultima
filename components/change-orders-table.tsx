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
import { ChevronDown, Download, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { ChangeOrderDetailView } from "@/components/change-order-detail-view"
import { useDebounce } from "@/hooks/use-debounce"
import { useChangeOrders } from "@/hooks/use-assets"
import { LoadingState } from "@/components/ui/loading-state"

export interface ChangeOrder {
  id: string
  description: string
  amount: number
  date: string
  status: string
  weightChanges?: number
  totalHours?: number
  pdfPath?: string
}

export type ChangeOrderTableData = ChangeOrder

const statusColors = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export const changeOrderColumns: ColumnDef<ChangeOrderTableData>[] = [
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
    accessorKey: "id",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Change Order ID</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium py-2">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Description</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm max-w-[300px] truncate py-2" title={row.getValue("description") as string}>
        {row.getValue("description") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Amount</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return (
        <div className="text-sm py-2">
          ${amount ? amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Date</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as string
      return <div className="text-sm py-2">{date || "—"}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Status</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="py-2">
          <Badge className={statusColors[status as keyof typeof statusColors] || ""}>
            {status}
          </Badge>
        </div>
      )
    },
  },
]

interface ChangeOrdersTableProps {
  changeOrders?: ChangeOrder[]
  projectNumber?: string // For generating PDF paths
  projectId?: string // For fetching from Supabase
}

export function ChangeOrdersTable({ changeOrders, projectNumber = "PRO-2025-001", projectId }: ChangeOrdersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedChangeOrder, setSelectedChangeOrder] = React.useState<ChangeOrder | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = React.useState(false)

  // Fetch from Supabase if projectId is provided
  const { data: supabaseChangeOrders = [], isLoading } = useChangeOrders(projectId)

  // Use provided change orders, then Supabase data
  const ordersData = React.useMemo(() => {
    let orders: ChangeOrder[] = []
    
    if (changeOrders && changeOrders.length > 0) {
      orders = changeOrders
    } else if (supabaseChangeOrders && supabaseChangeOrders.length > 0) {
      orders = supabaseChangeOrders
    }

    // Add PDF paths if not provided
    return orders.map(order => ({
      ...order,
      pdfPath: order.pdfPath || `/assets/${projectNumber}/Change-order/${order.id}.pdf`,
    }))
  }, [changeOrders, supabaseChangeOrders, projectNumber])

  if (isLoading && !changeOrders) {
    return <LoadingState message="Loading change orders..." />
  }

  // Debounce global filter for better performance
  const debouncedGlobalFilter = useDebounce(globalFilter, 300)

  // Filter function
  const filteredData = React.useMemo(() => {
    let filtered = ordersData

    // Apply global search filter
    if (debouncedGlobalFilter) {
      const filterLower = debouncedGlobalFilter.toLowerCase()
      filtered = filtered.filter((order) => {
        const idMatch = order.id.toLowerCase().includes(filterLower)
        const descMatch = order.description.toLowerCase().includes(filterLower)
        const statusMatch = order.status.toLowerCase().includes(filterLower)
        return idMatch || descMatch || statusMatch
      })
    }

    return filtered
  }, [ordersData, debouncedGlobalFilter])

  const table = useReactTable({
    data: filteredData,
    columns: changeOrderColumns,
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

  const handleRowClick = (order: ChangeOrder) => {
    setSelectedChangeOrder(order)
    setIsDetailViewOpen(true)
  }

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return

    const csvHeaders = ["Change Order ID", "Description", "Amount", "Date", "Status"]
    const csvRows = selectedRows.map((row) => [
      row.original.id,
      row.original.description,
      row.original.amount.toString(),
      row.original.date,
      row.original.status,
    ])
    
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `change-orders-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold mb-2">Change Orders</h2>
        <p className="text-sm text-muted-foreground">
          View and manage all change orders for this project
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 flex-shrink-0">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Filter by ID, description, or status..."
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
              title="Export selected change orders"
            >
              <Download className="h-4 w-4" />
              Export Selected ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              // Export all filtered change orders to CSV
              const csvHeaders = ["Change Order ID", "Description", "Amount", "Date", "Status"]
              const csvRows = filteredData.map((order) => [
                order.id,
                order.description,
                order.amount.toString(),
                order.date,
                order.status,
              ])
              
              const csvContent = [
                csvHeaders.join(","),
                ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
              ].join("\n")
              
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
              const link = document.createElement("a")
              const url = URL.createObjectURL(blob)
              link.setAttribute("href", url)
              link.setAttribute("download", `change-orders-${format(new Date(), "yyyy-MM-dd")}.csv`)
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
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        row.getIsSelected() && "bg-muted"
                      )}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on checkbox
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                          return
                        }
                        handleRowClick(row.original)
                      }}
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
                      colSpan={changeOrderColumns.length}
                      className="h-24 text-center"
                    >
                      No change orders found.
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

      {/* Change Order Detail View */}
      <ChangeOrderDetailView
        changeOrder={selectedChangeOrder}
        changeOrders={filteredData}
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        userRole="manager"
        userName="Current User"
        projectNumber={projectNumber}
      />
    </div>
  )
}

