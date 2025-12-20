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

export interface CouplerLogEntry {
  serialNumber: number
  drawingNumber: string
  description: string
  type: string
  code: string
  qtyPerBarSize: {
    size4?: number
    size5?: number
    size6?: number
    size7?: number
    size8?: number
    size9?: number
    size10?: number
    size11?: number
    size14?: number
    size18?: number
  }
  remarks?: string
}

export interface CouplerLogProjectInfo {
  project: string
  location: string
  lastUpdatedOn: string
  outputFormat: string
  jobNo: string
}

interface CouplerLogTableProps {
  projectInfo?: CouplerLogProjectInfo
  entries?: CouplerLogEntry[]
}

// Demo data based on the image
const defaultProjectInfo: CouplerLogProjectInfo = {
  project: "Valley View Business Park Tilt Panels",
  location: "JESSUP, PA",
  lastUpdatedOn: "15-12-2025",
  outputFormat: "ASA",
  jobNo: "U2524",
}

const defaultEntries: CouplerLogEntry[] = [
  {
    serialNumber: 1,
    drawingNumber: "R-1",
    description: "Wall Panel Couplers",
    type: "Type A",
    code: "CP-A",
    qtyPerBarSize: {
      size4: 24,
      size5: 18,
      size6: 32,
      size7: 0,
      size8: 16,
      size9: 0,
      size10: 12,
      size11: 0,
      size14: 8,
      size18: 4,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 2,
    drawingNumber: "R-2",
    description: "Foundation Couplers",
    type: "Type B",
    code: "CP-B",
    qtyPerBarSize: {
      size4: 16,
      size5: 12,
      size6: 28,
      size7: 0,
      size8: 20,
      size9: 0,
      size10: 14,
      size11: 0,
      size14: 10,
      size18: 6,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 3,
    drawingNumber: "R-3",
    description: "Column Couplers",
    type: "Type A",
    code: "CP-A",
    qtyPerBarSize: {
      size4: 0,
      size5: 0,
      size6: 20,
      size7: 0,
      size8: 24,
      size9: 0,
      size10: 18,
      size11: 0,
      size14: 16,
      size18: 12,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 4,
    drawingNumber: "R-4",
    description: "Beam Couplers",
    type: "Type C",
    code: "CP-C",
    qtyPerBarSize: {
      size4: 8,
      size5: 6,
      size6: 16,
      size7: 0,
      size8: 12,
      size9: 0,
      size10: 10,
      size11: 0,
      size14: 8,
      size18: 4,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 5,
    drawingNumber: "R-5",
    description: "Slab Couplers",
    type: "Type A",
    code: "CP-A",
    qtyPerBarSize: {
      size4: 32,
      size5: 28,
      size6: 24,
      size7: 0,
      size8: 20,
      size9: 0,
      size10: 16,
      size11: 0,
      size14: 12,
      size18: 8,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 6,
    drawingNumber: "R-6",
    description: "Roof Panel Couplers",
    type: "Type B",
    code: "CP-B",
    qtyPerBarSize: {
      size4: 20,
      size5: 16,
      size6: 30,
      size7: 0,
      size8: 18,
      size9: 0,
      size10: 14,
      size11: 0,
      size14: 10,
      size18: 6,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 7,
    drawingNumber: "R-7",
    description: "Lintel Couplers",
    type: "Type A",
    code: "CP-A",
    qtyPerBarSize: {
      size4: 12,
      size5: 10,
      size6: 18,
      size7: 0,
      size8: 14,
      size9: 0,
      size10: 12,
      size11: 0,
      size14: 8,
      size18: 4,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 8,
    drawingNumber: "R-8",
    description: "Tie Beam Couplers",
    type: "Type C",
    code: "CP-C",
    qtyPerBarSize: {
      size4: 6,
      size5: 4,
      size6: 12,
      size7: 0,
      size8: 10,
      size9: 0,
      size10: 8,
      size11: 0,
      size14: 6,
      size18: 2,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 9,
    drawingNumber: "R-9",
    description: "Stair Couplers",
    type: "Type B",
    code: "CP-B",
    qtyPerBarSize: {
      size4: 14,
      size5: 12,
      size6: 22,
      size7: 0,
      size8: 16,
      size9: 0,
      size10: 12,
      size11: 0,
      size14: 8,
      size18: 4,
    },
    remarks: "FFU",
  },
  {
    serialNumber: 10,
    drawingNumber: "R-10",
    description: "Miscellaneous Couplers",
    type: "Type A",
    code: "CP-A",
    qtyPerBarSize: {
      size4: 10,
      size5: 8,
      size6: 14,
      size7: 0,
      size8: 12,
      size9: 0,
      size10: 10,
      size11: 0,
      size14: 6,
      size18: 2,
    },
    remarks: "FFU",
  },
]

const columns: ColumnDef<CouplerLogEntry>[] = [
  {
    accessorKey: "serialNumber",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          S.No
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue("serialNumber")}</div>
    ),
  },
  {
    accessorKey: "drawingNumber",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Dwg. No.
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("drawingNumber")}</div>
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
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
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
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
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
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <div
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false || currentSort === "asc") {
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          Code
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("code")}</div>
    ),
  },
  {
    accessorKey: "qtyPerBarSize.size4",
    header: () => <div className="text-center">#4</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size4
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size5",
    header: () => <div className="text-center">#5</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size5
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size6",
    header: () => <div className="text-center">#6</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size6
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size7",
    header: () => <div className="text-center">#7</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size7
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size8",
    header: () => <div className="text-center">#8</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size8
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size9",
    header: () => <div className="text-center">#9</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size9
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size10",
    header: () => <div className="text-center">#10</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size10
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size11",
    header: () => <div className="text-center">#11</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size11
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size14",
    header: () => <div className="text-center">#14</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size14
      return <div className="text-center">{qty || "-"}</div>
    },
  },
  {
    accessorKey: "qtyPerBarSize.size18",
    header: () => <div className="text-center">#18</div>,
    cell: ({ row }) => {
      const qty = row.original.qtyPerBarSize.size18
      return <div className="text-center">{qty || "-"}</div>
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
              column.toggleSorting(false)
            } else {
              column.toggleSorting(true)
            }
          }}
          className="cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          REMARKS
        </div>
      )
    },
    cell: ({ row }) => {
      const remarks = row.getValue("remarks") as string | undefined
      return <div>{remarks || "-"}</div>
    },
  },
]

export function CouplerLogTable({ 
  projectInfo = defaultProjectInfo, 
  entries = defaultEntries 
}: CouplerLogTableProps) {
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
            <h1 className="text-2xl font-bold text-white">COUPLER LOG</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Project coupler tracking and management
            </p>
          </div>
        </div>

        {/* Project Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 line-clamp-2">
                {projectInfo.project}
              </CardTitle>
            </div>
          </Card>
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2">
                {projectInfo.location}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                LOCATION
              </CardDescription>
            </div>
          </Card>
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 text-red-600">
                {projectInfo.lastUpdatedOn}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Last updated on
              </CardDescription>
            </div>
          </Card>
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2">
                {projectInfo.outputFormat}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                OUTPUT FORMAT
              </CardDescription>
            </div>
          </Card>
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2">
                {projectInfo.jobNo}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                JOB NO
              </CardDescription>
            </div>
          </Card>
        </div>

        {/* Main Table */}
        <div className="border-2 border-black rounded-lg overflow-hidden bg-card/95 backdrop-blur-sm shadow-md">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                {/* First Header Row - Parent Headers */}
                <TableRow className="bg-green-400/50 border-b-2 border-black">
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    S.No
                  </TableHead>
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    Dwg. No.
                  </TableHead>
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    Description
                  </TableHead>
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    Type
                  </TableHead>
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    Code
                  </TableHead>
                  <TableHead colSpan={10} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    Qty per Bar size
                  </TableHead>
                  <TableHead rowSpan={2} className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    REMARKS
                  </TableHead>
                </TableRow>
                {/* Second Header Row - Bar Size Sub-headers */}
                <TableRow className="bg-green-400/50 border-b-2 border-black">
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #4
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #5
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #6
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #7
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #8
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #9
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #10
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #11
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #14
                  </TableHead>
                  <TableHead className="bg-green-400/50 text-white font-bold whitespace-nowrap text-center border-r border-black">
                    #18
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow
                      key={entry.serialNumber}
                      className="border-b border-black bg-white hover:bg-gray-50"
                    >
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.serialNumber}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black font-medium">
                        {entry.drawingNumber}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.type}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.code}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size4 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size5 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size6 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size7 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size8 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size9 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size10 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size11 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size14 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black text-center">
                        {entry.qtyPerBarSize.size18 || "-"}
                      </TableCell>
                      <TableCell className="text-black whitespace-nowrap border-r border-black">
                        {entry.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={17}
                      className="h-24 text-center text-black"
                    >
                      No coupler entries found.
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
