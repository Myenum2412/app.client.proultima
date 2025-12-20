"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Package,
  CreditCard,
  FileText,
  ClipboardList,
  TrendingUp,
} from "lucide-react"
import { useDashboardStats } from "@/hooks/use-dashboard"
import { useBillingStats } from "@/hooks/use-billing"
import { useSubmissions } from "@/hooks/use-submissions"
import { useFiles } from "@/hooks/use-files"
import { useMaterials } from "@/hooks/use-material"
import { useMaterialRequests } from "@/hooks/use-material-requests"
import { useMaterialAllocations } from "@/hooks/use-material-allocations"
import { useInvoices } from "@/hooks/use-invoices"
import { useProjects } from "@/hooks/use-projects"
import { useEvaluations } from "@/hooks/use-evaluation-log"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"

interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  href?: string
}

function SectionCard({ title, description, children, className, icon, href }: SectionCardProps) {
  const content = (
    <>
      <div className="absolute inset-0 bg-background/30 dark:bg-background/50 rounded-xl z-0"></div>
      <div className="relative z-10 flex flex-col w-full h-full">
        <div className="flex items-start justify-between mb-5 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && <div className="text-white/90 shrink-0">{icon}</div>}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white leading-tight truncate">{title}</h2>
              {description && (
                <p className="text-sm text-white/80 mt-1.5 truncate">{description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
          {children}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "w-full flex flex-col px-6 lg:px-7 py-6 relative bg-cover bg-center bg-no-repeat rounded-xl shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]",
          className
        )}
        style={{
          backgroundImage: "url('/image/dashboard-bg.png')",
        }}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col px-6 lg:px-7 py-6 relative bg-cover bg-center bg-no-repeat rounded-xl shadow-md overflow-hidden",
        className
      )}
      style={{
        backgroundImage: "url('/image/dashboard-bg.png')",
      }}
    >
      {content}
    </div>
  )
}

function CompactTable({ 
  header, 
  body, 
  className 
}: { 
  header: React.ReactNode
  body: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("w-full border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col min-h-[250px] max-h-[500px]", className)}>
      <div className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10 border-b shadow-sm">
              {header}
            </TableHeader>
            <TableBody>
              {body}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export function UnifiedDashboard() {
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useDashboardStats()
  const { data: billingStats, isLoading: isLoadingBilling } = useBillingStats()
  const { data: submissions = [], isLoading: isLoadingSubmissions } = useSubmissions()
  const { data: files = [], isLoading: isLoadingFiles } = useFiles()
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials()
  const { data: materialRequests = [], isLoading: isLoadingMaterialRequests } = useMaterialRequests()
  const { data: materialAllocations = [], isLoading: isLoadingMaterialAllocations } = useMaterialAllocations()
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects()
  const { data: evaluations = [], isLoading: isLoadingEvaluations } = useEvaluations()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const submissionStats = {
      total: submissions.length,
      pending: submissions.filter((s: any) => s.status === "pending" || s.status === "Pending").length,
      approved: submissions.filter((s: any) => s.status === "approved" || s.status === "Approved").length,
    }

    const materialRequestStats = {
      total: materialRequests.length,
      pending: materialRequests.filter((r: any) => r.status === "pending").length,
      approved: materialRequests.filter((r: any) => r.status === "approved").length,
      fulfilled: materialRequests.filter((r: any) => r.status === "fulfilled").length,
    }

    const materialAllocationStats = {
      total: materialAllocations.length,
      allocated: materialAllocations.filter((a: any) => a.status === "allocated").length,
      inTransit: materialAllocations.filter((a: any) => a.status === "in-transit").length,
      delivered: materialAllocations.filter((a: any) => a.status === "delivered").length,
    }

    const invoiceStats = {
      total: invoices.length,
      paid: invoices.filter((i: any) => i.status === "Paid").length,
      unpaid: invoices.filter((i: any) => i.status === "Unpaid").length,
      totalAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmountBilled || 0), 0),
    }

    return {
      submissions: submissionStats,
      materialRequests: materialRequestStats,
      materialAllocations: materialAllocationStats,
      invoices: invoiceStats,
      files: { total: files.length },
      projects: { total: projects.length },
      evaluations: { total: evaluations.length },
    }
  }, [submissions, materialRequests, materialAllocations, invoices, files, projects, evaluations])

  // Get recent/pending items
  const recentSubmissions = submissions.slice(0, 5)
  const recentInvoices = invoices.slice(0, 5)
  const pendingMaterialRequests = materialRequests.filter((r: any) => r.status === "pending").slice(0, 5)
  const recentMaterialAllocations = materialAllocations.slice(0, 5)
  const recentFiles = files.slice(0, 5)
  const recentEvaluations = evaluations.slice(0, 5)

  const isLoading =
    isLoadingDashboard ||
    isLoadingBilling ||
    isLoadingSubmissions ||
    isLoadingFiles ||
    isLoadingMaterials ||
    isLoadingMaterialRequests ||
    isLoadingMaterialAllocations ||
    isLoadingInvoices ||
    isLoadingProjects ||
    isLoadingEvaluations

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    if (statusLower.includes("pending") || statusLower.includes("unpaid")) {
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          {status}
        </Badge>
      )
    }
    if (statusLower.includes("approved") || statusLower.includes("paid") || statusLower.includes("completed") || statusLower.includes("delivered") || statusLower.includes("fulfilled")) {
      return (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700">
          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
          {status}
        </Badge>
      )
    }
    if (statusLower.includes("rejected") || statusLower.includes("cancelled")) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          {status}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
        {status}
      </Badge>
    )
  }

  return (
    <div className="w-full min-h-screen p-6 bg-muted/20">
      <div className="w-full max-w-[1920px] mx-auto grid grid-cols-12 gap-6 auto-rows-auto">
        {/* Top Stats Bar - Row 1 */}
        <div className="col-span-12">
          <SectionCard
            title="Dashboard Overview"
            description="Real-time system status and key metrics"
            icon={<TrendingUp className="h-5 w-5" />}
            className="min-h-[200px]"
          >
            {isLoadingDashboard ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            ) : dashboardStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-md *:data-[slot=card]:border *:data-[slot=card]:border-border/50">
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {dashboardStats.totalActiveProjects.value}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      {dashboardStats.totalActiveProjects.label}
                    </CardDescription>
                  </div>
                </Card>
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {dashboardStats.detailingInProcess.value}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      {dashboardStats.detailingInProcess.label}
                    </CardDescription>
                  </div>
                </Card>
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {dashboardStats.releasedJobs.value}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      {dashboardStats.releasedJobs.label}
                    </CardDescription>
                  </div>
                </Card>
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {dashboardStats.revisionInProcess.value}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      {dashboardStats.revisionInProcess.label}
                    </CardDescription>
                  </div>
                </Card>
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {dashboardStats.yetToBeDetailed.value}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      {dashboardStats.yetToBeDetailed.label}
                    </CardDescription>
                  </div>
                </Card>
                <Card className="@container/card h-28 flex items-center hover:shadow-lg transition-shadow">
                  <div className="w-full px-5 text-left">
                    <CardTitle className="text-2xl font-bold mb-1.5 tabular-nums text-foreground">
                      {stats.projects.total}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-tight">
                      Total Projects
                    </CardDescription>
                  </div>
                </Card>
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* Bottom Row - Two equal sections */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-6">
          {/* Submissions Section */}
          <div className="w-full min-h-[400px]">
            <SectionCard
              title="Submissions"
              description={`${stats.submissions.total} total • ${stats.submissions.pending} pending`}
              icon={<Upload className="h-4 w-4" />}
              href="/submissions"
            >
              <div className="space-y-4 w-full flex flex-col">
                <div className="grid grid-cols-3 gap-4 shrink-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-md *:data-[slot=card]:border *:data-[slot=card]:border-border/50">
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums">{stats.submissions.total}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Total</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-yellow-600 dark:text-yellow-400">{stats.submissions.pending}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Pending</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">{stats.submissions.approved}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Approved</CardDescription>
                    </div>
                  </Card>
                </div>
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">ID</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Status</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Date</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingSubmissions ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : recentSubmissions.length > 0 ? (
                        recentSubmissions.map((sub: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium">#{sub.id || idx + 1}</TableCell>
                            <TableCell className="text-xs py-2">{getStatusBadge(sub.status || "Pending")}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {sub.date ? format(new Date(sub.date), "MMM dd") : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">
                            No submissions found
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Material Requests Section */}
          <div className="w-full min-h-[400px]">
            <SectionCard
              title="Material Requests"
              description={`${stats.materialRequests.total} total • ${stats.materialRequests.pending} pending`}
              icon={<Package className="h-4 w-4" />}
              href="/material-management/material-requests"
            >
              <div className="space-y-4 w-full flex flex-col">
                <div className="grid grid-cols-3 gap-4 shrink-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-md *:data-[slot=card]:border *:data-[slot=card]:border-border/50">
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums">{stats.materialRequests.total}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Total</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-yellow-600 dark:text-yellow-400">{stats.materialRequests.pending}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Pending</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">{stats.materialRequests.fulfilled}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Fulfilled</CardDescription>
                    </div>
                  </Card>
                </div>
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Request ID</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Status</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Priority</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingMaterialRequests ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : pendingMaterialRequests.length > 0 ? (
                        pendingMaterialRequests.map((req: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium">{req.id || `REQ-${idx + 1}`}</TableCell>
                            <TableCell className="text-xs py-2">{getStatusBadge(req.status || "pending")}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">{req.priority || "medium"}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">
                            No pending requests
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Right Column - Two equal sections */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-6">
          {/* Invoices Section */}
          <div className="w-full min-h-[400px]">
            <SectionCard
              title="Invoices"
              description={`${stats.invoices.total} total • $${(stats.invoices.totalAmount / 1000).toFixed(1)}k`}
              icon={<CreditCard className="h-4 w-4" />}
              href="/billing"
            >
              <div className="space-y-4 w-full flex flex-col">
                <div className="grid grid-cols-3 gap-4 shrink-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-md *:data-[slot=card]:border *:data-[slot=card]:border-border/50">
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums">{stats.invoices.total}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Total</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">{stats.invoices.paid}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Paid</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-4 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{stats.invoices.unpaid}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Unpaid</CardDescription>
                    </div>
                  </Card>
                </div>
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Invoice ID</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Status</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Amount</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingInvoices ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : recentInvoices.length > 0 ? (
                        recentInvoices.map((inv: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium">{inv.invoiceId || `INV-${idx + 1}`}</TableCell>
                            <TableCell className="text-xs py-2">{getStatusBadge(inv.status || "Pending")}</TableCell>
                            <TableCell className="text-xs py-2 font-medium text-foreground">
                              ${(inv.totalAmountBilled || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Material Allocations Section */}
          <div className="w-full min-h-[400px]">
            <SectionCard
              title="Material Allocations"
              description={`${stats.materialAllocations.total} total • ${stats.materialAllocations.allocated} allocated`}
              icon={<Package className="h-4 w-4" />}
              href="/material-management/material-allocations"
            >
              <div className="space-y-4 w-full flex flex-col">
                <div className="grid grid-cols-4 gap-4 shrink-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-md *:data-[slot=card]:border *:data-[slot=card]:border-border/50">
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-3 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums">{stats.materialAllocations.total}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Total</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-3 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">{stats.materialAllocations.allocated}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Allocated</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-3 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-yellow-600 dark:text-yellow-400">{stats.materialAllocations.inTransit}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">In Transit</CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-20 flex items-center hover:shadow-lg transition-shadow">
                    <div className="w-full px-3 text-center">
                      <CardTitle className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">{stats.materialAllocations.delivered}</CardTitle>
                      <CardDescription className="text-xs mt-1.5">Delivered</CardDescription>
                    </div>
                  </Card>
                </div>
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Allocation ID</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Material</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Status</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Date</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingMaterialAllocations ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : recentMaterialAllocations.length > 0 ? (
                        recentMaterialAllocations.map((alloc: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium">{alloc.id || `ALLOC-${idx + 1}`}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">{alloc.materialId || "-"}</TableCell>
                            <TableCell className="text-xs py-2">{getStatusBadge(alloc.status || "allocated")}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {alloc.allocatedDate ? format(new Date(alloc.allocatedDate), "MMM dd") : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-xs text-center text-muted-foreground py-4">
                            No allocations found
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Bottom Row - Files and Evaluations */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-6">
          {/* Projects Section */}
          <div className="w-full min-h-[350px]">
            <SectionCard
              title="Recent Projects"
              description={`${stats.files.total} total projects`}
              icon={<FileText className="h-4 w-4" />}
              href="/projects"
            >
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">File Name</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Project</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Date</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingFiles ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : recentFiles.length > 0 ? (
                        recentFiles.map((file: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium truncate max-w-[180px]" title={file.name || file.fileName || `File ${idx + 1}`}>
                              {file.name || file.fileName || `File ${idx + 1}`}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground truncate max-w-[120px]">
                              {file.project || "-"}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {file.date ? format(new Date(file.date), "MMM dd") : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">
                            No files found
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 flex flex-col gap-6">
          {/* Evaluations Section */}
          <div className="w-full min-h-[350px]">
            <SectionCard
              title="Evaluation Log"
              description={`${stats.evaluations.total} total evaluations`}
              icon={<ClipboardList className="h-4 w-4" />}
              href="/evaluation-log"
            >
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 w-full">
                  <CompactTable
                    header={
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-foreground">ID</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Status</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-foreground">Date</TableHead>
                      </TableRow>
                    }
                    body={
                      isLoadingEvaluations ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-3">
                            <div className="flex items-center justify-center">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : recentEvaluations.length > 0 ? (
                        recentEvaluations.map((evaluation: any, idx: number) => (
                          <TableRow key={idx} className="h-8 hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs py-2 font-medium">#{evaluation.id || idx + 1}</TableCell>
                            <TableCell className="text-xs py-2">{getStatusBadge(evaluation.status || "Active")}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {evaluation.date ? format(new Date(evaluation.date), "MMM dd") : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">
                            No evaluations found
                          </TableCell>
                        </TableRow>
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
