"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Image from "next/image"

export interface AccessoriesLogEntry {
  drawingNumber: string
  elements: string
  description: string
  supportHeight?: string
  type: string
  quantity: number
  lft?: number
  remarks?: string
}

export interface AccessoriesLogProjectInfo {
  projectName: string
  jobNo: string
  clientName: string
  gcName: string
  location: string
  estimatedTons?: string
  detailedTons: number
  lastUpdatedOn: string
}

interface AccessoriesLogTableProps {
  projectInfo?: AccessoriesLogProjectInfo
  entries?: AccessoriesLogEntry[]
}

// Demo data based on the image
const defaultProjectInfo: AccessoriesLogProjectInfo = {
  projectName: "Valley View Business Park Tilt Panels",
  jobNo: "U2524",
  clientName: "RE-STEEL",
  gcName: "T&T CONSTRUCTION",
  location: "JESSUP, PA",
  estimatedTons: "",
  detailedTons: 399,
  lastUpdatedOn: "15-12-2025",
}

const defaultEntries: AccessoriesLogEntry[] = [
  {
    drawingNumber: "R-1",
    elements: "E1-E8",
    description: "Wall Panel Accessories",
    supportHeight: "12'-0\"",
    type: "Angle",
    quantity: 16,
    lft: 192.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-2",
    elements: "N1-N8",
    description: "North Wall Accessories",
    supportHeight: "12'-0\"",
    type: "Plate",
    quantity: 8,
    lft: 96.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-3",
    elements: "W1-W8",
    description: "West Wall Panel Accessories",
    supportHeight: "14'-0\"",
    type: "Angle",
    quantity: 12,
    lft: 168.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-4",
    elements: "S1-S8",
    description: "South Wall Accessories",
    supportHeight: "12'-0\"",
    type: "Channel",
    quantity: 10,
    lft: 120.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-5",
    elements: "R1-R8",
    description: "Roof Panel Accessories",
    supportHeight: "16'-0\"",
    type: "Angle",
    quantity: 20,
    lft: 320.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-6",
    elements: "F1-F12",
    description: "Foundation Accessories",
    supportHeight: "8'-0\"",
    type: "Plate",
    quantity: 24,
    lft: 192.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-7",
    elements: "C1-C16",
    description: "Column Accessories",
    supportHeight: "18'-0\"",
    type: "Angle",
    quantity: 32,
    lft: 576.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-8",
    elements: "B1-B20",
    description: "Beam Accessories",
    supportHeight: "14'-0\"",
    type: "Channel",
    quantity: 40,
    lft: 560.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-9",
    elements: "S1-S24",
    description: "Slab Accessories",
    supportHeight: "10'-0\"",
    type: "Plate",
    quantity: 48,
    lft: 480.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-10",
    elements: "M1-M6",
    description: "Miscellaneous Accessories",
    supportHeight: "12'-0\"",
    type: "Angle",
    quantity: 12,
    lft: 144.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-11",
    elements: "T1-T4",
    description: "Tie Accessories",
    supportHeight: "9'-0\"",
    type: "Rod",
    quantity: 8,
    lft: 72.0,
    remarks: "FFU",
  },
  {
    drawingNumber: "R-12",
    elements: "L1-L10",
    description: "Lintel Accessories",
    supportHeight: "11'-0\"",
    type: "Channel",
    quantity: 20,
    lft: 220.0,
    remarks: "FFU",
  },
]

const columns: ColumnDef<AccessoriesLogEntry>[] = [
  {
    accessorKey: "drawingNumber",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          DWG #
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("drawingNumber")}</div>
    ),
  },
  {
    accessorKey: "elements",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Elements
        </div>
      )
    },
    cell: ({ row }) => (
      <div>{row.getValue("elements")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Description
        </div>
      )
    },
    cell: ({ row }) => (
      <div>{row.getValue("description")}</div>
    ),
  },
  {
    accessorKey: "supportHeight",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Support height
        </div>
      )
    },
    cell: ({ row }) => {
      const height = row.getValue("supportHeight") as string | undefined
      return <div className="text-center">{height || "-"}</div>
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Type
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("type")}</div>
    ),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Qty
        </div>
      )
    },
    cell: ({ row }) => {
      const qty = row.getValue("quantity") as number
      return <div className="text-center font-medium">{qty}</div>
    },
  },
  {
    accessorKey: "lft",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          LFT
        </div>
      )
    },
    cell: ({ row }) => {
      const lft = row.getValue("lft") as number | undefined
      return (
        <div className="text-center">
          {lft ? lft.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false) // Set to descending
            } else {
              column.toggleSorting(true) // Set to ascending
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Remarks
        </div>
      )
    },
    cell: ({ row }) => {
      const remarks = row.getValue("remarks") as string | undefined
      return <div>{remarks || "-"}</div>
    },
  },
]

export function AccessoriesLogTable({ 
  projectInfo = defaultProjectInfo, 
  entries = defaultEntries 
}: AccessoriesLogTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: entries,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  const totalRecords = entries.length
  const startRecord = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
  const endRecord = Math.min(
    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
    totalRecords
  )

  return (
    <div
      className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4"
      style={{
        backgroundImage: "url('/image/dashboard-bg.png')",
        minHeight: "200px",
      }}
    >
      <div className="absolute inset-0 bg-background/30 dark:bg-background/50 rounded-lg z-0"></div>

      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="mb-1">
            <h1 className="text-2xl font-bold text-white">ACCESSORIES LOG</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Project accessories tracking and management
            </p>
          </div>
        </div>

        {/* Project Info Section */}
        <div className="bg-card/95 backdrop-blur-sm border-2 border-black rounded-lg p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">PROJECT NAME :</span>
                <span>{projectInfo.projectName}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">JOB # :</span>
                <span>{projectInfo.jobNo}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">CLIENT NAME :</span>
                <span>{projectInfo.clientName}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">GC NAME :</span>
                <span>{projectInfo.gcName}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">LOCATION :</span>
                <span>{projectInfo.location}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="font-semibold min-w-[140px]">Estimated Tons :</span>
                  <span>{projectInfo.estimatedTons || "-"}</span>
                </div>
                <div className="flex-shrink-0">
                  <Image
                    src="/image/proultima-logo.png"
                    alt="Proultima Engineering Solutions"
                    width={150}
                    height={50}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Detailed Tons :</span>
                <span>{projectInfo.detailedTons}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Last updated on :</span>
                <span className="text-red-600 font-semibold">{projectInfo.lastUpdatedOn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="border-2 border-black rounded-lg overflow-hidden bg-card/95 backdrop-blur-sm shadow-md">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-green-400/50 border-b-2 border-black">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black"
                      >
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-black bg-white hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="text-black whitespace-nowrap border-r border-black"
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
                      colSpan={columns.length}
                      className="h-24 text-center text-black"
                    >
                      No accessories entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-card/95 backdrop-blur-sm border-2 border-black rounded-lg flex items-center justify-between px-4 py-3 shadow-md">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-foreground">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-sm text-foreground">
              {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} records` : "0 records"}
            </div>
            <div className="text-sm text-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                table.setPageIndex(0)
              }}
              disabled={table.getState().pagination.pageIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                table.previousPage()
              }}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                table.nextPage()
              }}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                table.setPageIndex(table.getPageCount() - 1)
              }}
              disabled={table.getState().pagination.pageIndex >= table.getPageCount() - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
