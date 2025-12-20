"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useProjects } from "@/hooks/use-projects"
import { useDrawingsYetToReturn, useDrawingsYetToRelease, useDrawingLog } from "@/hooks/use-assets"
import { format } from "date-fns"

export function FileSectionCard() {
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch data from the same source as File page
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects()
  const { data: drawingsYetToReturn = [], isLoading: isLoadingReturn } = useDrawingsYetToReturn()
  const { data: drawingsYetToRelease = [], isLoading: isLoadingRelease } = useDrawingsYetToRelease()
  const { data: drawingLog = [], isLoading: isLoadingLog } = useDrawingLog()

  const isLoading = isLoadingProjects || isLoadingReturn || isLoadingRelease || isLoadingLog

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  // Calculate file-related stats
  const fileStats = useMemo(() => {
    const totalDrawings = drawingsYetToReturn.length + drawingsYetToRelease.length + drawingLog.length
    const drawingsYetToReturnCount = drawingsYetToReturn.length
    const drawingsYetToReleaseCount = drawingsYetToRelease.length
    const releasedDrawings = drawingLog.length
    const pendingDrawings = drawingsYetToReturn.filter(d => d.status === "R&R" || d.status === "PENDING").length
    const forApprovalDrawings = drawingsYetToReturn.filter(d => d.status === "APP").length
    const fileFieldUseDrawings = drawingsYetToRelease.filter(d => d.status === "FFU").length

    return {
      totalDrawings,
      drawingsYetToReturnCount,
      drawingsYetToReleaseCount,
      releasedDrawings,
      pendingDrawings,
      forApprovalDrawings,
      fileFieldUseDrawings,
      totalProjects: projects.length,
    }
  }, [drawingsYetToReturn, drawingsYetToRelease, drawingLog, projects])

  if (!mounted || isLoading) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading file stats...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
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
              <h1 className="text-2xl font-bold text-white">Files & Drawings</h1>
              <p className="text-sm text-muted-foreground">
                Drawing status and file management overview
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
          {/* Total Projects */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.totalProjects}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Projects
              </CardDescription>
            </div>
          </Card>

          {/* Total Drawings */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.totalDrawings}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Drawings
              </CardDescription>
            </div>
          </Card>

          {/* Drawings Yet to Return */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.drawingsYetToReturnCount}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Yet to Return
              </CardDescription>
            </div>
          </Card>

          {/* Drawings Yet to Release */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.drawingsYetToReleaseCount}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Yet to Release
              </CardDescription>
            </div>
          </Card>

          {/* Released Drawings */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.releasedDrawings}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Released Drawings
              </CardDescription>
            </div>
          </Card>

          {/* Pending Drawings */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.pendingDrawings}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pending Drawings
              </CardDescription>
            </div>
          </Card>

          {/* For Approval (APP) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.forApprovalDrawings}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                For Approval (APP)
              </CardDescription>
            </div>
          </Card>

          {/* File & Field Use (FFU) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {fileStats.fileFieldUseDrawings}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                File & Field Use (FFU)
              </CardDescription>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

