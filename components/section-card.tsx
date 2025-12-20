"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProjectAllocationForm } from "@/components/project-allocation-form"
import { useDashboardStats } from "@/hooks/use-dashboard"

export function SectionCards() {
  const { data: stats, isLoading, isError } = useDashboardStats()
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [prefilledDate, setPrefilledDate] = useState<Date>()
  const [jobAvailability, setJobAvailability] = useState<string>("immediate / reach out to vel")
  const [mounted, setMounted] = useState(false)

  const jobAvailabilityOptions = [
    "immediate / reach out to vel",
    "Available",
    "Not Available",
    "Pending",
  ]

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard stats...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-destructive">Failed to load dashboard stats</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg my-4 "
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
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-black border-white hover:bg-white/90"
              onClick={() => setIsProjectFormOpen(true)}
            >
              Project Allocation
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Project Overview and Statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">

          {/* Total Active Projects */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.totalActiveProjects.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.totalActiveProjects.label}
              </CardDescription>
            </div>
          </Card>

          {/* Detailing in Process */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.detailingInProcess.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.detailingInProcess.label}
              </CardDescription>
            </div>
          </Card>

          {/* Revision in Process */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.revisionInProcess.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.revisionInProcess.label}
              </CardDescription>
            </div>
          </Card>

                    {/* Released Jobs */}
                    <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.releasedJobs.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.releasedJobs.label}
              </CardDescription>
            </div>
          </Card>

          {/* Yet to be Detailed Tons */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.yetToBeDetailed.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.yetToBeDetailed.label}
              </CardDescription>
            </div>
          </Card>

          {/* Job Availability (Selectable) */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <div className="mb-2">
                <Select value={jobAvailability} onValueChange={setJobAvailability}>
                  <SelectTrigger className="h-auto p-0 border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 text-base font-semibold tabular-nums w-full justify-start">
                    <SelectValue>
                      <span className="text-base font-semibold">{jobAvailability}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {jobAvailabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.jobAvailability.label}
              </CardDescription>
            </div>
          </Card>
        </div>
      </div>

      {/* Project Allocation Modal */}
      <ProjectAllocationForm
        open={isProjectFormOpen}
        onOpenChange={(open: boolean) => {
          setIsProjectFormOpen(open)
          if (!open) setPrefilledDate(undefined)
        }}
        prefilledDate={prefilledDate}
      />
    </div>
  )
}
