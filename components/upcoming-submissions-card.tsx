"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useDrawingsYetToReturn, useDrawingsYetToRelease } from "@/hooks/use-assets"
import { format } from "date-fns"

interface UpcomingSubmissionsStats {
  totalUpcoming: number
  pending: number
  forApproval: number
  fileFieldUse: number
}

export function UpcomingSubmissionsCard() {
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch drawings data to calculate stats
  const { data: drawingsYetToReturn = [], isLoading: isLoadingReturn } = useDrawingsYetToReturn()
  const { data: drawingsYetToRelease = [], isLoading: isLoadingRelease } = useDrawingsYetToRelease()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  // Calculate stats from drawings data
  const stats: UpcomingSubmissionsStats = {
    totalUpcoming: drawingsYetToReturn.length + drawingsYetToRelease.length,
    pending: drawingsYetToReturn.filter(d => d.status === "R&R" || d.status === "PENDING").length,
    forApproval: drawingsYetToReturn.filter(d => d.status === "APP").length,
    fileFieldUse: drawingsYetToRelease.filter(d => d.status === "FFU").length,
  }

  if (!mounted || isLoadingReturn || isLoadingRelease) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading submissions stats...</p>
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
              <h1 className="text-2xl font-bold text-white">Upcoming Submissions</h1>
              <p className="text-sm text-muted-foreground">
                Track all upcoming project submissions and deliverables
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
          {/* Total Upcoming Submissions */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.totalUpcoming}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Upcoming Submissions
              </CardDescription>
            </div>
          </Card>

          {/* Pending Submissions */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.pending}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pending Submissions
              </CardDescription>
            </div>
          </Card>

          {/* For Approval (APP) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.forApproval}
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
                {stats.fileFieldUse}
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

