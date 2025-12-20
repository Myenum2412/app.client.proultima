"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { MaterialDetail } from "@/components/material-detail-view"
import { format } from "date-fns"

interface MaterialSectionCardProps {
  materials?: MaterialDetail[]
}

export function MaterialSectionCard({ materials = [] }: MaterialSectionCardProps) {
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  // Calculate material stats
  const materialStats = useMemo(() => {
    const totalMaterials = materials.length
    const releasedMaterials = materials.filter(m => m.status === "released").length
    const inProgressMaterials = materials.filter(m => m.status === "in-progress").length
    const pendingMaterials = materials.filter(m => m.status === "pending").length
    const highPriorityMaterials = materials.filter(m => m.priority === "high").length
    const totalWeightLbs = materials.reduce((sum, m) => sum + (m.weightLbs || 0), 0)
    const totalWeightTons = totalWeightLbs / 2000

    return {
      totalMaterials,
      releasedMaterials,
      inProgressMaterials,
      pendingMaterials,
      highPriorityMaterials,
      totalWeightLbs,
      totalWeightTons,
    }
  }, [materials])

  if (!mounted) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading material stats...</p>
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
              <h1 className="text-2xl font-bold text-white">Material Management</h1>
              <p className="text-sm text-muted-foreground">
                Track and manage all project materials, quantities, and status
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
          {/* Total Materials */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.totalMaterials}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Materials
              </CardDescription>
            </div>
          </Card>

          {/* Released Materials */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.releasedMaterials}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Released Materials
              </CardDescription>
            </div>
          </Card>

          {/* In Progress Materials */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.inProgressMaterials}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                In Progress
              </CardDescription>
            </div>
          </Card>

          {/* Pending Materials */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.pendingMaterials}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pending Materials
              </CardDescription>
            </div>
          </Card>

          {/* High Priority Materials */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.highPriorityMaterials}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                High Priority
              </CardDescription>
            </div>
          </Card>

          {/* Total Weight (LBS) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.totalWeightLbs.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Weight (LBS)
              </CardDescription>
            </div>
          </Card>

          {/* Total Weight (Tons) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {materialStats.totalWeightTons.toFixed(1)}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Total Weight (Tons)
              </CardDescription>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

