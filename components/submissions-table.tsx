"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { Filter, Eye, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { SectionTableCard } from "@/components/ui/section-table-card"

export interface Submission extends Record<string, unknown> {
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

// Columns without select column (handled by SectionTableCard)
export const submissionsColumns: ColumnDef<Submission>[] = [
  {
    id: "_search",
    accessorKey: "_search",
    header: "Search",
    enableHiding: false,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: "includesString",
    cell: () => null, // Hidden column, no cell content
    meta: {
      headerClassName: "sr-only", // Hide header visually
      cellClassName: "sr-only", // Hide cell visually
    },
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

interface SubmissionsTableProps {
  initialSubmissions?: Submission[]
}

export function SubmissionsTable({ initialSubmissions = [] }: SubmissionsTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Use initial data only for the base query (all submissions)
  // When status filter changes, React Query will fetch new data
  const { data: submissions = [], isLoading, error } = useSubmissions({
    status: statusFilter !== "all" ? statusFilter : undefined,
    initialData: statusFilter === "all" ? initialSubmissions : undefined,
  })

  // Create a computed search column that combines all searchable fields
  const dataWithSearch = React.useMemo(() => {
    return submissions.map((submission: Submission) => ({
      ...submission,
      _search: [
        submission.proNumber,
        submission.projectName,
        submission.drawing,
        submission.workDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }))
  }, [submissions])

  // Custom filter menu for status
  const renderStatusFilterMenu = React.useCallback(
    (table: ReturnType<typeof import("@tanstack/react-table").useReactTable<Submission>>) => {
      return (
        <div className="w-[min(360px,calc(100vw-2rem))] p-3">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="text-sm font-medium">Filters</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                table.resetColumnFilters()
                setStatusFilter("all")
              }}
            >
              Clear
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Status</div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
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
            </div>
          </div>
        </div>
      )
    },
    [statusFilter]
  )

  // Custom actions for export selected
  const renderCustomActions = React.useCallback(
    (table: ReturnType<typeof import("@tanstack/react-table").useReactTable<Submission>>) => {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      
      if (selectedRows.length === 0) return null

      const handleExportSelected = () => {
        const csvHeaders = ["Pro Number", "Project Name", "Submission Type", "Work Description", "Drawing", "Sheets", "Submission Date"]
        const csvRows = selectedRows.map((row) => {
          const submission = row.original
          // Remove _search field from export
          const { _search, ...exportData } = submission as Submission & { _search?: string }
          return [
            exportData.proNumber,
            exportData.projectName,
            exportData.submissionType,
            exportData.workDescription,
            exportData.drawing,
            exportData.sheets,
            exportData.submissionDate,
          ]
        })
        
        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
        ].join("\n")
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `submissions-selected-${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportSelected}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
          title="Export selected submissions"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Export Selected ({selectedRows.length})</span>
          <span className="sm:hidden">Export ({selectedRows.length})</span>
        </Button>
      )
    },
    []
  )

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
    <SectionTableCard
      title="Submissions"
      data={dataWithSearch}
      columns={submissionsColumns}
      search={{
        columnId: "_search",
        placeholder: "Search by pro number, project name, drawing, or description...",
      }}
      exportFilename={`submissions-${format(new Date(), "yyyy-MM-dd")}.csv`}
      renderFilterMenu={renderStatusFilterMenu}
      renderActions={renderCustomActions}
      headerClassName="bg-green-50 dark:bg-green-950/20"
      pageSizes={[10, 20, 30, 50, 100]}
      isLoading={isLoading}
    />
  )
}
