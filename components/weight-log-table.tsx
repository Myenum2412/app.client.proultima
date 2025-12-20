"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface RevisionData {
  dos?: string // Date of Submission (MM-DD-YY)
  weight?: number
  wd?: number // Weight Difference (negative values shown in parentheses)
  aeMarkupsReceived?: string // AE mark-ups received date
}

export interface WeightLogEntry {
  serialNumber: number
  drawingNumber: string
  barmark: string
  description: string
  numberOfDrawings: number
  rev0?: RevisionData
  rev1?: RevisionData
  rev2?: RevisionData
  rev3?: RevisionData
  rev4?: RevisionData
  rev5?: RevisionData
  rev6?: RevisionData
  rev7?: RevisionData
  latestSubmittedDate?: string
  finalWeight?: number
}

export interface WeightLogProjectInfo {
  projectName: string
  appForApproval?: string
  ffuForFileFieldUse?: string
  rrResubmittedForApproval?: string
  date: string
  detailingStatus: string
  dosDateOfSubmission?: string
  client: string
  gc: string
  estimatedWeight: number
  jobNumber: string
}

interface WeightLogTableProps {
  projectInfo?: WeightLogProjectInfo
  entries?: WeightLogEntry[]
}

// Demo data based on the image
const defaultProjectInfo: WeightLogProjectInfo = {
  projectName: "Project Valley View Business Park Tilt Panels",
  appForApproval: "APP - For Approval",
  ffuForFileFieldUse: "FFU - For File & Field Use",
  rrResubmittedForApproval: "R&R - Resubmitted for Approval",
  date: "12-15-25",
  detailingStatus: "COMPLETED",
  dosDateOfSubmission: "DOS - Date of Submission",
  client: "RE-STEEL",
  gc: "T&T CONSTRUCTION",
  estimatedWeight: 398.9,
  jobNumber: "U2524",
}

const defaultEntries: WeightLogEntry[] = [
  {
    serialNumber: 1,
    drawingNumber: "R-1",
    barmark: "A",
    description: "EAST WALL PANELS E1 TO E8",
    numberOfDrawings: 1,
    rev0: { dos: "05-23-19", weight: 48441.95 },
    rev1: { dos: "06-15-19", weight: 48684.55, wd: 242.60 },
    rev2: { dos: "07-12-19", weight: 48575.30, wd: -109.25 },
    rev3: { dos: "08-20-19", weight: 48650.00, wd: 74.70 },
    rev4: { dos: "09-10-19", weight: 48640.75, wd: -9.25, aeMarkupsReceived: "07-12-19" },
    rev5: { dos: "10-05-19", weight: 49286.95, wd: 646.20 },
    latestSubmittedDate: "10-05-19",
    finalWeight: 49286.95,
  },
  {
    serialNumber: 2,
    drawingNumber: "R-2",
    barmark: "B",
    description: "NORTH WALL PANELS N1 TO N8",
    numberOfDrawings: 1,
    rev0: { dos: "05-23-19", weight: 45230.50 },
    rev1: { dos: "06-15-19", weight: 45450.25, wd: 219.75 },
    rev2: { dos: "07-12-19", weight: 45380.00, wd: -70.25 },
    rev3: { dos: "08-20-19", weight: 45420.50, wd: 40.50 },
    rev4: { dos: "09-10-19", weight: 45415.25, wd: -5.25, aeMarkupsReceived: "07-12-19" },
    rev5: { dos: "10-05-19", weight: 46000.00, wd: 584.75 },
    latestSubmittedDate: "10-05-19",
    finalWeight: 46000.00,
  },
  {
    serialNumber: 3,
    drawingNumber: "R-3",
    barmark: "C",
    description: "WEST WALL PANELS W1 TO W8",
    numberOfDrawings: 1,
    rev0: { dos: "05-23-19", weight: 47500.00 },
    rev1: { dos: "06-15-19", weight: 47720.50, wd: 220.50 },
    rev2: { dos: "07-12-19", weight: 47650.25, wd: -70.25 },
    rev3: { dos: "08-20-19", weight: 47700.00, wd: 49.75 },
    rev4: { dos: "09-10-19", weight: 47695.50, wd: -4.50, aeMarkupsReceived: "07-12-19" },
    rev5: { dos: "10-05-19", weight: 48250.75, wd: 555.25 },
    latestSubmittedDate: "10-05-19",
    finalWeight: 48250.75,
  },
  {
    serialNumber: 4,
    drawingNumber: "R-4",
    barmark: "D",
    description: "SOUTH WALL PANELS S-1 TO S-8",
    numberOfDrawings: 1,
    rev0: { dos: "05-23-19", weight: 46800.00 },
    rev1: { dos: "06-15-19", weight: 47020.25, wd: 220.25 },
    rev2: { dos: "07-12-19", weight: 46950.00, wd: -70.25 },
    rev3: { dos: "08-20-19", weight: 47000.50, wd: 50.50 },
    rev4: { dos: "09-10-19", weight: 46995.25, wd: -5.25, aeMarkupsReceived: "07-12-19" },
    rev5: { dos: "10-05-19", weight: 47550.00, wd: 554.75 },
    latestSubmittedDate: "10-05-19",
    finalWeight: 47550.00,
  },
  {
    serialNumber: 5,
    drawingNumber: "R-5",
    barmark: "F",
    description: "ROOF PANELS R1 TO R8",
    numberOfDrawings: 1,
    rev0: { dos: "05-25-19", weight: 52000.00 },
    rev1: { dos: "06-18-19", weight: 52250.75, wd: 250.75 },
    rev2: { dos: "07-15-19", weight: 52180.50, wd: -70.25 },
    rev3: { dos: "08-22-19", weight: 52230.00, wd: 49.50 },
    rev4: { dos: "09-12-19", weight: 52225.25, wd: -4.75, aeMarkupsReceived: "07-15-19" },
    rev5: { dos: "10-08-19", weight: 52800.00, wd: 574.75 },
    latestSubmittedDate: "10-08-19",
    finalWeight: 52800.00,
  },
  {
    serialNumber: 6,
    drawingNumber: "R-6",
    barmark: "H",
    description: "FOUNDATION PANELS F1 TO F12",
    numberOfDrawings: 1,
    rev0: { dos: "05-28-19", weight: 65000.00 },
    rev1: { dos: "06-20-19", weight: 65250.50, wd: 250.50 },
    rev2: { dos: "07-18-19", weight: 65180.25, wd: -70.25 },
    rev3: { dos: "08-25-19", weight: 65230.75, wd: 50.50 },
    rev4: { dos: "09-15-19", weight: 65225.00, wd: -5.75, aeMarkupsReceived: "07-18-19" },
    rev5: { dos: "10-10-19", weight: 65800.50, wd: 575.50 },
    latestSubmittedDate: "10-10-19",
    finalWeight: 65800.50,
  },
  {
    serialNumber: 7,
    drawingNumber: "R-7",
    barmark: "J",
    description: "COLUMN PANELS C1 TO C16",
    numberOfDrawings: 1,
    rev0: { dos: "06-01-19", weight: 72000.00 },
    rev1: { dos: "06-25-19", weight: 72250.25, wd: 250.25 },
    rev2: { dos: "07-22-19", weight: 72180.00, wd: -70.25 },
    rev3: { dos: "08-28-19", weight: 72230.50, wd: 50.50 },
    rev4: { dos: "09-18-19", weight: 72225.75, wd: -4.75, aeMarkupsReceived: "07-22-19" },
    rev5: { dos: "10-12-19", weight: 72800.00, wd: 574.25 },
    latestSubmittedDate: "10-12-19",
    finalWeight: 72800.00,
  },
  {
    serialNumber: 8,
    drawingNumber: "R-8",
    barmark: "K",
    description: "BEAM PANELS B1 TO B20",
    numberOfDrawings: 1,
    rev0: { dos: "06-05-19", weight: 85000.00 },
    rev1: { dos: "06-28-19", weight: 85250.75, wd: 250.75 },
    rev2: { dos: "07-25-19", weight: 85180.50, wd: -70.25 },
    rev3: { dos: "09-01-19", weight: 85230.25, wd: 49.75 },
    rev4: { dos: "09-20-19", weight: 85225.00, wd: -5.25, aeMarkupsReceived: "07-25-19" },
    rev5: { dos: "10-15-19", weight: 85800.75, wd: 575.75 },
    latestSubmittedDate: "10-15-19",
    finalWeight: 85800.75,
  },
  {
    serialNumber: 9,
    drawingNumber: "R-9",
    barmark: "L",
    description: "SLAB PANELS S1 TO S24",
    numberOfDrawings: 1,
    rev0: { dos: "06-08-19", weight: 95000.00 },
    rev1: { dos: "07-01-19", weight: 95250.50, wd: 250.50 },
    rev2: { dos: "07-28-19", weight: 95180.25, wd: -70.25 },
    rev3: { dos: "09-05-19", weight: 95230.75, wd: 50.50 },
    rev4: { dos: "09-22-19", weight: 95225.50, wd: -5.25, aeMarkupsReceived: "07-28-19" },
    rev5: { dos: "10-18-19", weight: 95800.00, wd: 574.50 },
    latestSubmittedDate: "10-18-19",
    finalWeight: 95800.00,
  },
  {
    serialNumber: 10,
    drawingNumber: "R-10",
    barmark: "N",
    description: "STAIR PANELS ST1 TO ST8",
    numberOfDrawings: 1,
    rev0: { dos: "06-12-19", weight: 42000.00 },
    rev1: { dos: "07-05-19", weight: 42250.25, wd: 250.25 },
    rev2: { dos: "08-01-19", weight: 42180.00, wd: -70.25 },
    rev3: { dos: "09-08-19", weight: 42230.50, wd: 50.50 },
    rev4: { dos: "09-25-19", weight: 42225.75, wd: -4.75, aeMarkupsReceived: "08-01-19" },
    rev5: { dos: "10-20-19", weight: 42800.00, wd: 574.25 },
    latestSubmittedDate: "10-20-19",
    finalWeight: 42800.00,
  },
]

export function WeightLogTable({ 
  projectInfo = defaultProjectInfo, 
  entries = defaultEntries 
}: WeightLogTableProps) {
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(1)

  const formatWeight = (weight?: number) => {
    if (weight === undefined || weight === null) return "-"
    return weight.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatWeightDifference = (wd?: number) => {
    if (wd === undefined || wd === null) return "-"
    if (wd < 0) {
      return `(${Math.abs(wd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    }
    return wd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const revisions = [0, 1, 2, 3, 4, 5, 6, 7] as const

  // Pagination calculations
  const totalRecords = entries.length
  const totalPages = Math.ceil(totalRecords / pageSize)
  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalRecords)
  const paginatedEntries = entries.slice(startRecord - 1, endRecord)

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  return (
    <div className="w-full space-y-6">
      {/* Project Header */}
      <div className="bg-card border-2 border-black rounded-lg p-6 shadow-sm">
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-4">{projectInfo.projectName}</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            {projectInfo.appForApproval && (
              <div>
                <span className="font-semibold">{projectInfo.appForApproval}</span>
              </div>
            )}
            {projectInfo.ffuForFileFieldUse && (
              <div>
                <span className="font-semibold">{projectInfo.ffuForFileFieldUse}</span>
              </div>
            )}
            {projectInfo.rrResubmittedForApproval && (
              <div>
                <span className="font-semibold">{projectInfo.rrResubmittedForApproval}</span>
              </div>
            )}
            <div>
              <span className="font-semibold">Date:</span>
              <span className="ml-2">{projectInfo.date}</span>
            </div>
            <div>
              <span className="font-semibold">Detailing Status:</span>
              <Badge variant="default" className="ml-2">{projectInfo.detailingStatus}</Badge>
            </div>
            {projectInfo.dosDateOfSubmission && (
              <div>
                <span className="font-semibold">{projectInfo.dosDateOfSubmission}</span>
              </div>
            )}
            <div>
              <span className="font-semibold">Client:</span>
              <span className="ml-2">{projectInfo.client}</span>
            </div>
            <div>
              <span className="font-semibold">GC:</span>
              <span className="ml-2">{projectInfo.gc}</span>
            </div>
            <div>
              <span className="font-semibold">Estimated Weight:</span>
              <span className="ml-2">{projectInfo.estimatedWeight}</span>
            </div>
            <div>
              <span className="font-semibold">Job Number:</span>
              <span className="ml-2">{projectInfo.jobNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border-2 border-black rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              {/* First Header Row - Parent Headers */}
              <TableRow className="bg-green-400/50 border-b-2 border-black">
                <TableHead 
                  rowSpan={2}
                  className="sticky left-0 z-10 bg-green-500 text-white font-bold whitespace-nowrap text-center border-r-2 border-black align-middle"
                >
                  S.No
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black align-middle"
                >
                  Dwg #
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black align-middle"
                >
                  Barmark (Prefix)
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black align-middle min-w-[200px]"
                >
                  Description
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black align-middle"
                >
                  No.of Drgs
                </TableHead>
                <TableHead 
                  colSpan={3}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 0
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 1
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 2
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 3
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 4
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 5
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 6
                </TableHead>
                <TableHead 
                  colSpan={4}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black"
                >
                  Rev 7
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black align-middle"
                >
                  Latest submitted date
                </TableHead>
                <TableHead 
                  rowSpan={2}
                  className="bg-green-500 text-white font-bold whitespace-nowrap text-center align-middle"
                >
                  Weight
                </TableHead>
              </TableRow>
              {/* Second Header Row - Sub Headers */}
              <TableRow className="bg-green-500 border-b-2 border-black">
                {/* Rev 0 sub-headers */}
                <TableHead className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black">
                  DOS
                </TableHead>
                <TableHead className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black">
                  Weight
                </TableHead>
                <TableHead className="bg-green-500 text-white font-bold text-center border-r border-black">
                  <div className="flex flex-col leading-tight">
                    <span>AE mark-ups</span>
                    <span>rec'd date</span>
                  </div>
                </TableHead>
                {/* Rev 1-7 sub-headers */}
                {[1, 2, 3, 4, 5, 6, 7].map((rev) => (
                  <React.Fragment key={rev}>
                    <TableHead className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black">
                      DOS
                    </TableHead>
                    <TableHead className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black">
                      Weight
                    </TableHead>
                    <TableHead className="bg-green-500 text-white font-bold whitespace-nowrap text-center border-r border-black">
                      WD
                    </TableHead>
                    <TableHead className="bg-green-500 text-white font-bold text-center border-r border-black">
                      <div className="flex flex-col leading-tight">
                        <span>AE mark-ups</span>
                        <span>rec'd date</span>
                      </div>
                    </TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry, index) => {
                return (
                  <TableRow 
                    key={entry.serialNumber}
                    className="bg-white border-b border-black hover:bg-gray-50"
                  >
                    <TableCell className="sticky left-0 z-10 bg-white text-black font-medium whitespace-nowrap text-center border-r-2 border-black">
                      {entry.serialNumber}
                    </TableCell>
                    <TableCell className="text-black font-medium whitespace-nowrap text-center border-r border-black">
                      {entry.drawingNumber}
                    </TableCell>
                    <TableCell className="text-black font-medium whitespace-nowrap text-center border-r border-black">
                      {entry.barmark}
                    </TableCell>
                    <TableCell className="text-black whitespace-nowrap border-r border-black">
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                      {entry.numberOfDrawings}
                    </TableCell>
                    {/* Rev 0 - 3 columns: DOS, Weight, AE mark-ups rec'd date */}
                    {(() => {
                      const rev0Data = entry.rev0
                      return (
                        <>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {rev0Data?.dos || "-"}
                          </TableCell>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {formatWeight(rev0Data?.weight)}
                          </TableCell>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {rev0Data?.aeMarkupsReceived || "-"}
                          </TableCell>
                        </>
                      )
                    })()}
                    {/* Rev 1-7 - 4 columns each: DOS, Weight, WD, AE mark-ups rec'd date */}
                    {[1, 2, 3, 4, 5, 6, 7].map((rev) => {
                      const revData = entry[`rev${rev}` as keyof WeightLogEntry] as RevisionData | undefined
                      return (
                        <React.Fragment key={rev}>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {revData?.dos || "-"}
                          </TableCell>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {formatWeight(revData?.weight)}
                          </TableCell>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {formatWeightDifference(revData?.wd)}
                          </TableCell>
                          <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                            {revData?.aeMarkupsReceived || "-"}
                          </TableCell>
                        </React.Fragment>
                      )
                    })}
                    <TableCell className="text-black text-center whitespace-nowrap border-r border-black">
                      {entry.latestSubmittedDate || "-"}
                    </TableCell>
                    <TableCell className="text-black text-center font-semibold whitespace-nowrap">
                      {formatWeight(entry.finalWeight)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-background border-t border-black flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-foreground">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
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
            Page {currentPage} of {totalPages}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
