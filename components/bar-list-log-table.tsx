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
import { format } from "date-fns"

export interface BarListLogEntry {
  serialNumber: number
  drawingNumber: string
  releaseDescription: string
  ctrlCode: string
  relNumber: string
  drawingWeight?: number
  takeOffWeight: number
  patch?: string
  date: string
  remarks: string
}

export interface BarListLogProjectInfo {
  project: string
  outputFormat: string
  location: string
  lastUpdatedOn: string
  jobNo: string
}

interface BarListLogTableProps {
  projectInfo?: BarListLogProjectInfo
  entries?: BarListLogEntry[]
}

// Demo data based on the image
const defaultProjectInfo: BarListLogProjectInfo = {
  project: "Valley View Business Park Tilt Panels",
  outputFormat: "ASA",
  location: "JESSUP, PA",
  lastUpdatedOn: "15-12-2025",
  jobNo: "U2524",
}

const defaultEntries: BarListLogEntry[] = [
  {
    serialNumber: 1,
    drawingNumber: "R-1",
    releaseDescription: "R1 WALL PANELS E1-E8",
    ctrlCode: "DV3B",
    relNumber: "1",
    takeOffWeight: 48712.88,
    date: "07-17-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 2,
    drawingNumber: "R-2",
    releaseDescription: "R2 WALL PANELS N1-N8",
    ctrlCode: "DV3B",
    relNumber: "2",
    takeOffWeight: 45230.50,
    date: "07-17-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 3,
    drawingNumber: "R-3",
    releaseDescription: "R3 WALL PANELS W1-W8",
    ctrlCode: "DV3B",
    relNumber: "3",
    takeOffWeight: 47500.00,
    date: "07-17-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 4,
    drawingNumber: "R-4",
    releaseDescription: "R4 WALL PANELS S1-S8",
    ctrlCode: "DV3B",
    relNumber: "4",
    takeOffWeight: 46800.00,
    date: "07-17-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 5,
    drawingNumber: "R-5",
    releaseDescription: "R5 ROOF PANELS R1-R8",
    ctrlCode: "DV3B",
    relNumber: "5",
    takeOffWeight: 52000.00,
    date: "07-25-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 6,
    drawingNumber: "R-6",
    releaseDescription: "R6 FOUNDATION PANELS F1-F12",
    ctrlCode: "DV3B",
    relNumber: "6",
    takeOffWeight: 65000.00,
    date: "07-28-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 7,
    drawingNumber: "R-7",
    releaseDescription: "R7 COLUMN PANELS C1-C16",
    ctrlCode: "DV3B",
    relNumber: "7",
    takeOffWeight: 72000.00,
    date: "08-01-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 8,
    drawingNumber: "R-8",
    releaseDescription: "R8 BEAM PANELS B1-B20",
    ctrlCode: "DV3B",
    relNumber: "8",
    takeOffWeight: 85000.00,
    date: "08-05-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 9,
    drawingNumber: "R-9",
    releaseDescription: "R9 SLAB PANELS S1-S24",
    ctrlCode: "DV3B",
    relNumber: "9",
    takeOffWeight: 95000.00,
    date: "08-08-19",
    remarks: "FFU BAR LIST",
  },
  {
    serialNumber: 10,
    drawingNumber: "R-27, R-28 & R-15",
    releaseDescription: "R27 R28 R15 WALL S71-S80&W1-W3",
    ctrlCode: "DV3L",
    relNumber: "10",
    takeOffWeight: 49706.00,
    date: "09-25-19",
    remarks: "FFU BAR LIST",
  },
]

const columns: ColumnDef<BarListLogEntry>[] = [
  {
    accessorKey: "serialNumber",
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
          S. No
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
    accessorKey: "releaseDescription",
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
          RELEASE DESCRIPTION
        </div>
      )
    },
    cell: ({ row }) => (
      <div>{row.getValue("releaseDescription")}</div>
    ),
  },
  {
    accessorKey: "ctrlCode",
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
          CTRL CODE
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("ctrlCode")}</div>
    ),
  },
  {
    accessorKey: "relNumber",
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
          REL #
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("relNumber")}</div>
    ),
  },
  {
    accessorKey: "drawingWeight",
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
          DRAWING WT (LBS)
        </div>
      )
    },
    cell: ({ row }) => {
      const weight = row.getValue("drawingWeight") as number | undefined
      return (
        <div className="text-center">
          {weight ? weight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "takeOffWeight",
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
          TAKE-OFF WT (LBS)
        </div>
      )
    },
    cell: ({ row }) => {
      const weight = row.getValue("takeOffWeight") as number
      return (
        <div className="text-center font-medium">
          {weight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "patch",
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
          PATCH
        </div>
      )
    },
    cell: ({ row }) => {
      const patch = row.getValue("patch") as string | undefined
      return <div className="text-center">{patch || "-"}</div>
    },
  },
  {
    accessorKey: "date",
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
          DATE
        </div>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as string
      return <div className="text-center">{date}</div>
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
          REMARKS
        </div>
      )
    },
    cell: ({ row }) => (
      <div>{row.getValue("remarks")}</div>
    ),
  },
]

export function BarListLogTable({ 
  projectInfo = defaultProjectInfo, 
  entries = defaultEntries 
}: BarListLogTableProps) {
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
            <h1 className="text-2xl font-bold text-white">BAR LIST LOG</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Project bar list tracking and management
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
                  table.getRowModel().rows.map((row, index) => {
                    const isLastRow = index === table.getRowModel().rows.length - 1
                    return (
                      <TableRow
                        key={row.id}
                        className={`border-b border-black ${
                          isLastRow 
                            ? "bg-red-100 dark:bg-red-900/20" 
                            : "bg-white hover:bg-gray-50"
                        }`}
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
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-black"
                    >
                      No bar list entries found.
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
              {startRecord}-{endRecord} of {totalRecords} records
            </div>
            <div className="text-sm text-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
