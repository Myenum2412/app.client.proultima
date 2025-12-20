"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useProjects } from "@/hooks/use-projects"
import { useSubmissions } from "@/hooks/use-submissions"
import { useMaterialAllocations } from "@/hooks/use-material-allocations"
import { useFiles } from "@/hooks/use-files"
import { useBillingStats } from "@/hooks/use-billing"
import { useDashboardStats } from "@/hooks/use-dashboard"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"

interface OverviewMetric {
  module: string
  label: string
  value: number | string
  status?: string
  url: string
}

export function UnifiedOverviewTable() {
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects()
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useSubmissions()
  const { data: allocations = [], isLoading: allocationsLoading, error: allocationsError } = useMaterialAllocations()
  const { data: files = [], isLoading: filesLoading, error: filesError } = useFiles()
  const { data: billingStats, isLoading: billingLoading, error: billingError } = useBillingStats()
  const { data: dashboardStats, isLoading: dashboardLoading, error: dashboardError } = useDashboardStats()

  const isLoading = projectsLoading || submissionsLoading || allocationsLoading || filesLoading || billingLoading || dashboardLoading
  const hasError = projectsError || submissionsError || allocationsError || filesError || billingError || dashboardError

  // Aggregate metrics from all modules
  const metrics: OverviewMetric[] = [
    {
      module: "Projects",
      label: "Total Active Projects",
      value: dashboardStats?.totalActiveProjects.value || projects.length || 0,
      status: "active",
      url: "/dashboard",
    },
    {
      module: "Projects",
      label: "Detailing in Process",
      value: dashboardStats?.detailingInProcess.value || 0,
      status: "in-progress",
      url: "/dashboard",
    },
    {
      module: "Projects",
      label: "Released Jobs",
      value: dashboardStats?.releasedJobs.value || 0,
      status: "released",
      url: "/dashboard",
    },
    {
      module: "Projects",
      label: "Revision in Process",
      value: dashboardStats?.revisionInProcess.value || 0,
      status: "revision",
      url: "/dashboard",
    },
    {
      module: "Allocations",
      label: "Material Allocations",
      value: allocations.length || 0,
      status: "allocated",
      url: "/material-management/material-allocations",
    },
    {
      module: "Projects",
      label: "Total Projects",
      value: Array.isArray(files) ? files.length : 0,
      status: "active",
      url: "/projects",
    },
    {
      module: "Submissions",
      label: "Total Submissions",
      value: submissions.length || 0,
      status: "active",
      url: "/submissions",
    },
    {
      module: "Submissions",
      label: "Pending Submissions",
      value: (submissions as any[]).filter((s: any) => s.releaseStatus === "PENDING" || !s.releaseStatus).length || 0,
      status: "pending",
      url: "/submissions",
    },
    {
      module: "Billing",
      label: "Total Invoices",
      value: billingStats?.totalInvoices.value || 0,
      status: "active",
      url: "/billing",
    },
    {
      module: "Billing",
      label: "Pending Payments",
      value: billingStats?.pendingPayments.value || 0,
      status: "pending",
      url: "/billing",
    },
    {
      module: "Billing",
      label: "Overdue Invoices",
      value: billingStats?.overdueInvoices.value || 0,
      status: "overdue",
      url: "/billing",
    },
  ]

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusConfig: Record<string, { label: string; className: string }> = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      "in-progress": {
        label: "In Progress",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      released: {
        label: "Released",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      revision: {
        label: "Revision",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      },
      allocated: {
        label: "Allocated",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      overdue: {
        label: "Overdue",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    }

    const config = statusConfig[status]
    if (!config) return null

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unified Overview</CardTitle>
          <CardDescription>Key metrics across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    )
  }

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unified Overview</CardTitle>
          <CardDescription>Key metrics across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorState message="Failed to load overview metrics" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Overview</CardTitle>
        <CardDescription>Key metrics aggregated from all modules</CardDescription>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No metrics available</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric, index) => (
                  <TableRow key={`${metric.module}-${metric.label}-${index}`}>
                    <TableCell className="font-medium">{metric.module}</TableCell>
                    <TableCell>{metric.label}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(metric.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={metric.url}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                          <ArrowRight className="h-3 w-3 ml-2" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

