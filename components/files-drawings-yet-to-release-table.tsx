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
import { ChevronDown, Download, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, FileText, Eye, Mail } from "lucide-react"
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
import { useDrawingsYetToRelease, type DrawingYetToRelease } from "@/hooks/use-assets"
import { LoadingState } from "@/components/ui/loading-state"
import { DrawingDetailView } from "@/components/drawing-detail-view"
import { DrawingEmailForm } from "@/components/drawing-email-form"
import { DrawingPdfModal } from "@/components/drawing-pdf-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"

export type DrawingsYetToReleaseTableData = DrawingYetToRelease

const statusColors = {
  FFU: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

// Helper function to get PDF URL from local assets or Supabase storage
function getPdfUrl(pdfPath: string, projectNumber?: string): string {
  // If it's already a full URL, return as is
  if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
    return pdfPath
  }
  
  // If it's a local path starting with /, check if it's in public/assets
  if (pdfPath.startsWith('/')) {
    // If it's already a public path, use it directly
    if (pdfPath.startsWith('/assets/')) {
      // Convert to API route
      const relativePath = pdfPath.replace('/assets/', '')
      return `/api/pdf?path=${encodeURIComponent(relativePath)}`
    }
    return pdfPath
  }
  
  // If pdfPath is just a filename or relative path, construct the full path
  // Default to PRO-2025-001/Drawings-Yet-to-Release if no project number provided
  const project = projectNumber || 'PRO-2025-001'
  const folder = 'Drawings-Yet-to-Release'
  
  // Construct the path: PRO-2025-001/Drawings-Yet-to-Release/filename.pdf
  const relativePath = `${project}/${folder}/${pdfPath}`
  
  // Use the API route to serve the PDF
  return `/api/pdf?path=${encodeURIComponent(relativePath)}`
}

// Create columns function that accepts state setters
const createDrawingsYetToReleaseColumns = (
  setSelectedPdfDrawing: (drawing: DrawingYetToRelease | null) => void,
  setIsPdfModalOpen: (open: boolean) => void,
  projectNumber?: string
): ColumnDef<DrawingsYetToReleaseTableData>[] => [
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
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>DWG #</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium py-2">{row.getValue("dwg")}</div>
    ),
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
      <div className="text-sm max-w-[300px] truncate py-2" title={row.getValue("description") as string}>{row.getValue("description") || "—"}</div>
    ),
  },
  {
    accessorKey: "totalWeight",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Total Weight (Tons)</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const totalWeight = row.getValue("totalWeight") as number
      return (
        <div className="text-sm py-2">
          {totalWeight ? totalWeight.toFixed(2) : "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "releaseStatus",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Release Status</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const releaseStatus = row.getValue("releaseStatus") as string
      return (
        <div className="text-sm py-2">
          {releaseStatus || "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "latestSubmittedDate",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Latest Submitted Date</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("latestSubmittedDate") as string
      return <div className="text-sm py-2">{date || "—"}</div>
    },
  },
  {
    id: "weeksSinceSent",
    header: ({ column }) => {
      const sortState = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span>Weeks Since Sent</span>
          {sortState === "asc" && <span className="ml-2 text-xs">(Low to High)</span>}
          {sortState === "desc" && <span className="ml-2 text-xs">(High to Low)</span>}
        </Button>
      )
    },
    cell: ({ row }) => {
      // Hide PDF actions when row is selected
      if (row.getIsSelected()) {
        return <div className="py-2">—</div>
      }

      const drawing = row.original
      const hasPdf = drawing.pdfPath && drawing.pdfPath.trim() !== ""
      
      const handleViewPdf = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasPdf && drawing.pdfPath) {
          // If pdfPath is just a filename, construct full path
          let pdfPath = drawing.pdfPath
          if (!pdfPath.includes('/') && !pdfPath.startsWith('/') && !pdfPath.startsWith('http')) {
            // Just a filename, construct path: PRO-2025-001/Drawings-Yet-to-Release/filename.pdf
            const project = projectNumber || 'PRO-2025-001'
            pdfPath = `${project}/Drawings-Yet-to-Release/${pdfPath}`
          }
          const pdfUrl = getPdfUrl(pdfPath, projectNumber)
          // Create a new drawing object with the resolved PDF URL
          const drawingWithUrl = { ...drawing, pdfPath: pdfUrl }
          setSelectedPdfDrawing(drawingWithUrl)
          setIsPdfModalOpen(true)
        } else {
          toast.error('PDF not available for this drawing')
        }
      }

      const handleDownloadPdf = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasPdf && drawing.pdfPath) {
          // If pdfPath is just a filename, construct full path
          let pdfPath = drawing.pdfPath
          if (!pdfPath.includes('/') && !pdfPath.startsWith('/') && !pdfPath.startsWith('http')) {
            // Just a filename, construct path: PRO-2025-001/Drawings-Yet-to-Release/filename.pdf
            const project = projectNumber || 'PRO-2025-001'
            pdfPath = `${project}/Drawings-Yet-to-Release/${pdfPath}`
          }
          const pdfUrl = getPdfUrl(pdfPath, projectNumber)
          
          // Create download link
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = `${drawing.dwg}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
      
      return (
        <div className="flex items-center gap-2 py-2">
          {hasPdf ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleViewPdf}
                title="View PDF"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDownloadPdf}
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
]

export interface DrawingsYetToReleaseTableRef {
  handleEmail: () => void
  isEmailDisabled: boolean
  selectedCount: number
}

export const DrawingsYetToReleaseTable = React.forwardRef<
  DrawingsYetToReleaseTableRef,
  {
    drawings?: DrawingYetToRelease[]
    projectId?: string
    projectNumber?: string
    projectName?: string
  }
>(({ 
  drawings,
  projectId,
  projectNumber,
  projectName
}, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedDrawing, setSelectedDrawing] = React.useState<DrawingYetToRelease | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = React.useState(false)
  const [selectedPdfDrawing, setSelectedPdfDrawing] = React.useState<DrawingYetToRelease | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false)

  // Fetch from Supabase if projectId is provided
  const { data: supabaseDrawings = [], isLoading } = useDrawingsYetToRelease(projectId)

  // Directly use Supabase data when projectId is provided, otherwise use provided drawings
  const data = React.useMemo(() => {
    // If projectId is provided, always use Supabase data (ignore drawings prop)
    if (projectId) {
      console.log('[DrawingsYetToRelease] Using Supabase data:', { projectId, count: supabaseDrawings?.length || 0 })
      return supabaseDrawings || []
    }
    // Otherwise, use provided drawings prop
    console.log('[DrawingsYetToRelease] Using provided drawings:', { count: drawings?.length || 0 })
    return drawings || []
  }, [projectId, supabaseDrawings, drawings])

  // Handle drawing navigation from detail view - hooks must be called before conditional returns
  React.useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const drawing = event.detail.drawing as DrawingYetToRelease
      setSelectedDrawing(drawing)
      setIsDetailViewOpen(true)
    }

    window.addEventListener("drawing-navigate", handleNavigate as EventListener)
    return () => {
      window.removeEventListener("drawing-navigate", handleNavigate as EventListener)
    }
  }, [])

  const handleRowClick = (drawing: DrawingYetToRelease) => {
    // Check if PDF exists, if so open PDF modal, otherwise open detail view
    if (drawing.pdfPath && drawing.pdfPath.trim() !== '') {
      // Helper function to get PDF URL
      const getPdfUrl = (pdfPath: string): string => {
        // If it's already a full URL, return as is
        if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
          return pdfPath
        }
        // If it's a local path starting with /, check if it's in public/assets
        if (pdfPath.startsWith('/')) {
          if (pdfPath.startsWith('/assets/')) {
            const relativePath = pdfPath.replace('/assets/', '')
            return `/api/pdf?path=${encodeURIComponent(relativePath)}`
          }
          return pdfPath
        }
        // If pdfPath is just a filename or relative path, construct the full path
        const project = projectNumber || 'PRO-2025-001'
        const folder = 'Drawings-Yet-to-Release'
        const relativePath = `${project}/${folder}/${pdfPath}`
        return `/api/pdf?path=${encodeURIComponent(relativePath)}`
      }
      
      const pdfUrl = getPdfUrl(drawing.pdfPath)
      const drawingWithUrl = { ...drawing, pdfPath: pdfUrl }
      setSelectedPdfDrawing(drawingWithUrl)
      setIsPdfModalOpen(true)
    } else {
      // No PDF, open detail view instead
      setSelectedDrawing(drawing)
      setIsDetailViewOpen(true)
    }
  }

  // Create columns with state setters - hooks must be called before conditional returns
  const columns = React.useMemo(
    () => createDrawingsYetToReleaseColumns(setSelectedPdfDrawing, setIsPdfModalOpen, projectNumber),
    [setSelectedPdfDrawing, setIsPdfModalOpen, projectNumber]
  )

  // useReactTable hook MUST be called before any conditional returns
  const table = useReactTable({
    data: data,
    columns,
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

  // All useState hooks MUST be called before any conditional returns
  const [isEmailFormOpen, setIsEmailFormOpen] = React.useState(false)
  const [isDownloadingFiles, setIsDownloadingFiles] = React.useState(false)

  const selectedRows = table.getSelectedRowModel().rows

  // Define handler functions before hooks that depend on them
  const handleOpenOutlookEmail = React.useCallback(async () => {
    if (selectedRows.length === 0) return

    setIsDownloadingFiles(true)
    try {
      const selectedDrawings = selectedRows.map((row) => row.original)
      
      // Generate email body with metadata
      const emailBody = generateEmailBody(selectedDrawings, projectNumber, projectName)
      const emailSubject = `Drawings Yet to Release - ${projectNumber || 'Project'}`
      
      // Download selected PDFs as zip
      await downloadSelectedPDFsAsZip(selectedDrawings, projectNumber)
      
      // Create mailto link
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      
      // Open Outlook/email client
      window.location.href = mailtoLink
    } catch (error) {
      console.error("Failed to prepare email:", error)
      alert("Failed to prepare email. Please try again.")
    } finally {
      setIsDownloadingFiles(false)
    }
  }, [selectedRows, projectNumber, projectName])

  const generateEmailBody = (
    drawings: DrawingYetToRelease[],
    projectNumber?: string,
    projectName?: string
  ): string => {
    const drawingsList = drawings.map((drawing, index) => {
      return `${index + 1}. Drawing Number: ${drawing.dwg}
   Status: ${drawing.status}
   Description: ${drawing.description || 'N/A'}
   Release Status: ${drawing.releaseStatus || 'N/A'}
   Latest Submitted Date: ${drawing.latestSubmittedDate || 'N/A'}`
    }).join('\n\n')

    return `Drawings Yet to Release

${projectNumber ? `Project Number: ${projectNumber}` : ''}
${projectName ? `Project Name: ${projectName}` : ''}
Total Drawings: ${drawings.length}

Selected Drawings:
${drawingsList}

Please find the attached PDF files in the downloaded zip file.

This is an automated notification from Proultima.`
  }

  const downloadSelectedPDFsAsZip = async (
    drawings: DrawingYetToRelease[],
    projectNumber?: string
  ): Promise<void> => {
    // Create a zip file using JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Download each PDF and add to zip
    const downloadPromises = drawings.map(async (drawing) => {
      if (!drawing.pdfPath) return

      try {
        let pdfPath = drawing.pdfPath
        if (!pdfPath.includes('/') && !pdfPath.startsWith('/') && !pdfPath.startsWith('http')) {
          const project = projectNumber || 'PRO-2025-001'
          pdfPath = `${project}/Drawings-Yet-to-Release/${pdfPath}`
        }
        
        const pdfUrl = getPdfUrl(pdfPath, projectNumber)
        const response = await fetch(pdfUrl)
        const blob = await response.blob()
        
        // Add to zip with drawing number as filename
        zip.file(`${drawing.dwg}.pdf`, blob)
      } catch (error) {
        console.error(`Failed to download PDF for ${drawing.dwg}:`, error)
      }
    })

    await Promise.all(downloadPromises)

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    // Download zip file
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = `drawings-yet-to-release-${projectNumber || 'project'}-${format(new Date(), 'yyyy-MM-dd')}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return

    const csvHeaders = ["DWG #", "Status", "Description", "Release Status", "Latest Submitted Date"]
    const csvRows = selectedRows.map((row) => [
      row.original.dwg,
      row.original.status,
      row.original.description,
      row.original.releaseStatus,
      row.original.latestSubmittedDate,
    ])
    
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `drawings-yet-to-release-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Expose email handler to parent via ref - MUST be called before any conditional returns
  React.useImperativeHandle(ref, () => ({
    handleEmail: handleOpenOutlookEmail,
    isEmailDisabled: selectedRows.length === 0 || isDownloadingFiles,
    selectedCount: selectedRows.length,
  }), [handleOpenOutlookEmail, selectedRows.length, isDownloadingFiles])

  // Conditional return MUST be after ALL hooks (useState, useMemo, useEffect, useReactTable, useImperativeHandle)
  if (isLoading && projectId) {
    return <LoadingState message="Loading drawings..." />
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden -mt-8">
        <div className=" flex-shrink-0">
          <p className="text-sm text-muted-foreground px-1">
            View and manage all drawings pending release
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
              const csvHeaders = ["DWG #", "Status", "Description", "Release Status", "Latest Submitted Date"]
              const csvRows = data.map((drawing) => [
                drawing.dwg,
                drawing.status,
                drawing.description,
                drawing.releaseStatus,
                drawing.latestSubmittedDate,
              ])
              
              const csvContent = [
                csvHeaders.join(","),
                ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
              ].join("\n")
              
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
              const link = document.createElement("a")
              const url = URL.createObjectURL(blob)
              link.setAttribute("href", url)
              link.setAttribute("download", `drawings-yet-to-release-${format(new Date(), "yyyy-MM-dd")}.csv`)
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
                        row.getIsSelected() ? "bg-muted" : "cursor-pointer hover:bg-muted/50 transition-colors"
                      )}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on checkbox or if row is selected
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                          return
                        }
                        // Don't show view details if row is selected
                        if (row.getIsSelected()) {
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
                      colSpan={columns.length}
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

      {/* Drawing Detail View */}
      <DrawingDetailView
        drawing={selectedDrawing}
        drawings={data}
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        userRole="manager" // TODO: Get from auth context
        userName="Current User" // TODO: Get from auth context
      />

      {/* Email Form Dialog */}
      <DrawingEmailForm
        open={isEmailFormOpen}
        onOpenChange={setIsEmailFormOpen}
        drawings={selectedRows.map((row) => row.original)}
        projectNumber={projectNumber}
        projectName={projectName}
        type="yet-to-release"
      />

      {/* PDF Modal */}
      {selectedPdfDrawing && (
        <DrawingPdfModal
          open={isPdfModalOpen}
          onOpenChange={setIsPdfModalOpen}
          pdfUrl={selectedPdfDrawing.pdfPath || ''}
          title={`Drawing ${selectedPdfDrawing.dwg}`}
          description={selectedPdfDrawing.description}
        />
      )}
    </div>
  )
})

DrawingsYetToReleaseTable.displayName = "DrawingsYetToReleaseTable"

