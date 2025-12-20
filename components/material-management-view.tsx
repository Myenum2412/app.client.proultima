"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useProjects } from "@/hooks/use-projects"
import { useDrawingsYetToReturn, useDrawingsYetToRelease, useDrawingLog } from "@/hooks/use-assets"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { Package, Search, Filter, Download, FileText, Scale, Truck, MapPin, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { FileSectionCard } from "@/components/file-section-card"

interface MaterialItem {
  id: string
  projectId: string
  projectNumber: string
  projectName: string
  drawing: string
  rebarGrade: string
  weight: number // in tons
  status: "pending" | "released" | "in-progress"
  releaseDate?: string
  description?: string
}

interface MaterialSummary {
  projectId: string
  projectNumber: string
  projectName: string
  clientName: string
  contractor: string
  projectLocation: string
  totalItems: number
  releasedItems: number
  pendingItems: number
  totalWeight: number
  releasedWeight: number
  pendingWeight: number
  lastReleaseDate?: string
  materials: MaterialItem[]
}

interface MaterialManagementViewProps {
  onMaterialSelect?: (material: MaterialItem | any) => void
}

export function MaterialManagementView({ onMaterialSelect }: MaterialManagementViewProps = {}) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch data from the same source as File page
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects()
  const { data: drawingsYetToReturn = [], isLoading: isLoadingReturn } = useDrawingsYetToReturn()
  const { data: drawingsYetToRelease = [], isLoading: isLoadingRelease } = useDrawingsYetToRelease()
  const { data: drawingLog = [], isLoading: isLoadingLog } = useDrawingLog()

  const isLoading = isLoadingProjects || isLoadingReturn || isLoadingRelease || isLoadingLog
  const error = projectsError

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  // Transform file page data into material items
  const materialSummaries = useMemo(() => {
    if (!projects.length) return []

    return projects.map((project): MaterialSummary => {
      // Get all drawings for this project
      const projectDrawings = [
        ...drawingsYetToReturn.filter(d => d.dwg),
        ...drawingsYetToRelease.filter(d => d.dwg),
        ...drawingLog.filter(d => d.dwg),
      ]

      // Extract material items from drawings
      // For drawings with weight, create material items
      // For drawings without weight, still include them but with 0 weight
      const materials: MaterialItem[] = projectDrawings
        .map((drawing, index) => {
          // Try to extract rebar grade from description or use default
          let rebarGrade = "#4" // Default
          const description = drawing.description || ""
          
          // Try to find rebar grade in description (e.g., "#4", "#5", "#6")
          const gradeMatch = description.match(/#[0-9]+/i)
          if (gradeMatch) {
            rebarGrade = gradeMatch[0].toUpperCase()
          }

          return {
            id: `${project.id}-${drawing.dwg}-${index}`,
            projectId: project.id || "",
            projectNumber: project.jobNumber || project.projectName || "",
            projectName: project.projectName || "",
            drawing: drawing.dwg || "",
            rebarGrade: rebarGrade,
            weight: drawing.totalWeight || 0,
            status: (drawing.status === "FFU" ? "released" : 
                    drawing.status === "APP" ? "in-progress" : 
                    drawing.status === "R&R" ? "pending" : "pending") as "pending" | "released" | "in-progress",
            releaseDate: drawing.latestSubmittedDate,
            description: drawing.description || "",
          }
        })
        .filter(m => m.drawing) // Only include items with drawing numbers
      
      // If we have multiple drawings with the same drawing number but different weights,
      // we could aggregate them, but for now we keep them separate

      // Calculate summary stats
      const totalItems = materials.length
      const releasedItems = materials.filter(m => m.status === "released").length
      const pendingItems = materials.filter(m => m.status === "pending").length
      const totalWeight = materials.reduce((sum, m) => sum + m.weight, 0)
      const releasedWeight = materials
        .filter(m => m.status === "released")
        .reduce((sum, m) => sum + m.weight, 0)
      const pendingWeight = materials
        .filter(m => m.status === "pending")
        .reduce((sum, m) => sum + m.weight, 0)

      const lastRelease = materials
        .filter(m => m.status === "released" && m.releaseDate)
        .sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))[0]

      return {
        projectId: project.id || "",
        projectNumber: project.jobNumber || project.projectName || "",
        projectName: project.projectName || "",
        clientName: project.clientName || "N/A",
        contractor: project.contractorName || "N/A",
        projectLocation: project.projectLocation || "N/A",
        totalItems,
        releasedItems,
        pendingItems,
        totalWeight,
        releasedWeight,
        pendingWeight,
        lastReleaseDate: lastRelease?.releaseDate,
        materials,
      }
    })
  }, [projects, drawingsYetToReturn, drawingsYetToRelease, drawingLog])

  // Filter materials
  const filteredSummaries = useMemo(() => {
    let filtered = materialSummaries

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter(s => s.projectId === projectFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.map(summary => ({
        ...summary,
        materials: summary.materials.filter(m => {
          if (statusFilter === "released") return m.status === "released"
          if (statusFilter === "pending") return m.status === "pending"
          if (statusFilter === "in-progress") return m.status === "in-progress"
          return true
        }),
      })).filter(s => s.materials.length > 0)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.map(summary => ({
        ...summary,
        materials: summary.materials.filter(m =>
          m.projectName.toLowerCase().includes(query) ||
          m.projectNumber.toLowerCase().includes(query) ||
          m.drawing.toLowerCase().includes(query) ||
          m.rebarGrade.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
        ),
      })).filter(s => s.materials.length > 0)
    }

    return filtered
  }, [materialSummaries, projectFilter, statusFilter, searchQuery])

  // Get selected project summary
  const selectedSummary = useMemo(() => {
    if (!selectedProject) return null
    return filteredSummaries.find(s => s.projectId === selectedProject)
  }, [filteredSummaries, selectedProject])

  // Flatten all materials for table view
  const allMaterials = useMemo(() => {
    return filteredSummaries.flatMap(summary => summary.materials)
  }, [filteredSummaries])

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalProjects = filteredSummaries.length
    const totalItems = filteredSummaries.reduce((sum, s) => sum + s.totalItems, 0)
    const releasedItems = filteredSummaries.reduce((sum, s) => sum + s.releasedItems, 0)
    const pendingItems = filteredSummaries.reduce((sum, s) => sum + s.pendingItems, 0)
    const totalWeight = filteredSummaries.reduce((sum, s) => sum + s.totalWeight, 0)
    const releasedWeight = filteredSummaries.reduce((sum, s) => sum + s.releasedWeight, 0)
    const pendingWeight = filteredSummaries.reduce((sum, s) => sum + s.pendingWeight, 0)

    return {
      totalProjects,
      totalItems,
      releasedItems,
      pendingItems,
      totalWeight,
      releasedWeight,
      pendingWeight,
    }
  }, [filteredSummaries])

  if (!mounted || isLoading) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading material data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <ErrorState 
            message={error instanceof Error ? error.message : "Failed to load material data"}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Section Card */}
      <FileSectionCard />

      {/* Section Card with Stats */}
      <div
        className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4"
        style={{
          backgroundImage: "url('/image/dashboard-bg.png')",
          minHeight: "200px",
        }}
      >
        <div className="absolute inset-0 bg-background/30 dark:bg-background/50 rounded-lg z-0"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold text-white">Material Management</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage project materials, quantities, and status
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80 mb-1">Last Updated</p>
                <p className="text-lg font-semibold text-white">
                  {format(lastUpdated, "MM/dd/yyyy")}
                </p>
                <p className="text-xs text-white/80">
                  {format(lastUpdated, "hh:mm:ss a")}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
            {/* Total Projects */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.totalProjects}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Total Projects
                </CardDescription>
              </div>
            </Card>

            {/* Total Items */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.totalItems}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Total Items
                </CardDescription>
              </div>
            </Card>

            {/* Released Items */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.releasedItems}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Released Items
                </CardDescription>
              </div>
            </Card>

            {/* Pending Items */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.pendingItems}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Pending Items
                </CardDescription>
              </div>
            </Card>

            {/* Total Weight */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.totalWeight.toFixed(1)}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Total Weight (tons)
                </CardDescription>
              </div>
            </Card>

            {/* Released Weight */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.releasedWeight.toFixed(1)}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Released Weight (tons)
                </CardDescription>
              </div>
            </Card>

            {/* Pending Weight */}
            <Card className="@container/card h-24 flex items-center">
              <div className="w-full px-4 text-left">
                <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                  {overallStats.pendingWeight.toFixed(1)}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Pending Weight (tons)
                </CardDescription>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="px-4 lg:px-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id || ""}>
                    {project.projectName} ({project.jobNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </CardContent>
        </Card>

      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSummaries.map((summary) => (
          <Card
            key={summary.projectId}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              selectedProject === summary.projectId && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedProject(
              selectedProject === summary.projectId ? null : summary.projectId
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{summary.projectName}</CardTitle>
                  <CardDescription className="mt-1">
                    {summary.projectNumber}
                  </CardDescription>
                </div>
                <Badge variant="outline">{summary.totalItems} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium">{summary.clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contractor</p>
                    <p className="font-medium flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {summary.contractor}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {summary.projectLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Weight</p>
                    <p className="font-medium">{summary.totalWeight.toFixed(2)} tons</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.totalItems}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{summary.releasedItems}</p>
                    <p className="text-xs text-muted-foreground">Released</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{summary.pendingItems}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                {summary.lastReleaseDate && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Last Release: {summary.lastReleaseDate}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Material Details Table */}
      {selectedSummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Material Details - {selectedSummary.projectName}</CardTitle>
                <CardDescription>
                  {selectedSummary.materials.length} material items
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                Close Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drawing</TableHead>
                    <TableHead>Rebar Grade</TableHead>
                    <TableHead>Weight (tons)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Release Date</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSummary.materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No materials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedSummary.materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.drawing}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.rebarGrade}</Badge>
                        </TableCell>
                        <TableCell>{material.weight.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              material.status === "released"
                                ? "default"
                                : material.status === "in-progress"
                                ? "secondary"
                                : "outline"
                            }
                            className={cn(
                              material.status === "released" && "bg-green-500 text-white",
                              material.status === "in-progress" && "bg-yellow-500 text-white"
                            )}
                          >
                            {material.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{material.releaseDate || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {material.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Materials Table (when no project selected) */}
      {!selectedProject && allMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Materials</CardTitle>
            <CardDescription>
              {allMaterials.length} material items across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Drawing</TableHead>
                    <TableHead>Rebar Grade</TableHead>
                    <TableHead>Weight (tons)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Release Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.projectName}</TableCell>
                      <TableCell>{material.drawing}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.rebarGrade}</Badge>
                      </TableCell>
                      <TableCell>{material.weight.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            material.status === "released"
                              ? "default"
                              : material.status === "in-progress"
                              ? "secondary"
                              : "outline"
                          }
                          className={cn(
                            material.status === "released" && "bg-green-500 text-white",
                            material.status === "in-progress" && "bg-yellow-500 text-white"
                          )}
                        >
                          {material.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{material.releaseDate || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredSummaries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No materials found matching your filters</p>
          </CardContent>
        </Card>
      )}

      </div>
    </div>
  )
}

// Generate demo materials based on the image format
function generateDemoMaterials() {
  return [
    {
      id: "mat-001",
      title: "SLAB ON GRADE AREA-H (STAIR-H2)",
      dwgNumber: "R-71",
      releaseDescription: "R71 AREA-H STAIR-H2 SOG",
      ctrlCode: "BEQ",
      relNumber: "42",
      weightLbs: 591.07,
      date: "2025-05-13",
      varyingBars: false,
      remarks: "AW BAR LIST",
      status: "released" as const,
      priority: "high" as const,
      loadCategory: "N/A",
      coating: "N/A",
      deliveryDate: "2025-05-14",
      grade: "N/A",
      couplersFormSavers: "N/A",
      accessories: "N/A",
      specialShapes: "N/A",
      pdfPath: "/materials/R-71.pdf",
    },
    {
      id: "mat-002",
      title: "FOUNDATION WALL SECTION A-A",
      dwgNumber: "R-72",
      releaseDescription: "R72 FOUNDATION WALL A-A",
      ctrlCode: "BEP",
      relNumber: "43",
      weightLbs: 1245.50,
      date: "2025-05-12",
      varyingBars: true,
      remarks: "STANDARD BAR LIST",
      status: "released" as const,
      priority: "medium" as const,
      loadCategory: "Heavy",
      coating: "Epoxy",
      deliveryDate: "2025-05-15",
      grade: "#5",
      couplersFormSavers: "Yes",
      accessories: "Ties",
      specialShapes: "L-Shape",
      pdfPath: "/materials/R-72.pdf",
    },
    {
      id: "mat-003",
      title: "COLUMN DETAIL C1-C4",
      dwgNumber: "R-73",
      releaseDescription: "R73 COLUMN C1 TO C4",
      ctrlCode: "BER",
      relNumber: "44",
      weightLbs: 892.33,
      date: "2025-05-11",
      varyingBars: false,
      remarks: "COLUMN REBAR LIST",
      status: "in-progress" as const,
      priority: "high" as const,
      loadCategory: "Medium",
      coating: "N/A",
      deliveryDate: "2025-05-16",
      grade: "#6",
      couplersFormSavers: "No",
      accessories: "Spacers",
      specialShapes: "N/A",
    },
    {
      id: "mat-004",
      title: "BEAM DETAIL B1-B8",
      dwgNumber: "R-74",
      releaseDescription: "R74 BEAM B1 TO B8",
      ctrlCode: "BES",
      relNumber: "45",
      weightLbs: 1567.89,
      date: "2025-05-10",
      varyingBars: true,
      remarks: "BEAM REBAR LIST",
      status: "pending" as const,
      priority: "medium" as const,
      loadCategory: "Heavy",
      coating: "Galvanized",
      deliveryDate: "2025-05-17",
      grade: "#7",
      couplersFormSavers: "Yes",
      accessories: "Chairs",
      specialShapes: "U-Shape",
    },
    {
      id: "mat-005",
      title: "WALL PANEL W1-W12",
      dwgNumber: "R-75",
      releaseDescription: "R75 WALL PANEL W1 TO W12",
      ctrlCode: "BET",
      relNumber: "46",
      weightLbs: 2341.22,
      date: "2025-05-09",
      varyingBars: false,
      remarks: "WALL PANEL LIST",
      status: "released" as const,
      priority: "low" as const,
      loadCategory: "Light",
      coating: "N/A",
      deliveryDate: "2025-05-18",
      grade: "#4",
      couplersFormSavers: "No",
      accessories: "N/A",
      specialShapes: "N/A",
      pdfPath: "/materials/R-75.pdf",
    },
  ]
}

