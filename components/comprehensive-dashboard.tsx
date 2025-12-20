"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Home,
  Folder,
  Upload,
  ClipboardList,
  Package,
  FileText,
  CreditCard,
  MessageCircle,
  Activity,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  MoreVertical,
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

// Lazy load heavy components
const InvoiceTable = lazy(() => import("@/components/invoice-table").then(m => ({ default: m.InvoiceTable })))

interface ModuleCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  onClick?: () => void
  badge?: { label: string; variant: "default" | "secondary" | "destructive" }
  className?: string
}

function ModuleCard({ title, value, description, icon, onClick, badge, className }: ModuleCardProps) {
  return (
    <Card
      className={cn(
        "@container/card h-20 flex items-center cursor-pointer hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="w-full px-3 flex items-center gap-3">
        <div className="text-muted-foreground shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-sm font-semibold tabular-nums truncate">
              {value}
            </CardTitle>
            {badge && (
              <Badge variant={badge.variant} className="text-[10px] px-1.5 h-4">
                {badge.label}
              </Badge>
            )}
          </div>
          <CardDescription className="text-[10px] text-muted-foreground truncate">
            {description}
          </CardDescription>
        </div>
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="@container/card h-20 flex items-center">
      <div className="w-full px-3 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  )
}

export function ComprehensiveDashboard() {
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
  const [activeTab, setActiveTab] = useState("overview")
  const [openSheets, setOpenSheets] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recentActivity: false,
    pendingItems: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Tab navigation: Ctrl/Cmd + 1-8 for tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "8") {
        e.preventDefault()
        const tabs = ["overview", "files", "submissions", "materials", "billing", "evaluation", "status", "settings"]
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex])
        }
      }
      // Escape to close sheets
      if (e.key === "Escape") {
        setOpenSheets({})
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const toggleSheet = useCallback((sheetId: string) => {
    setOpenSheets(prev => ({ ...prev, [sheetId]: !prev[sheetId] }))
  }, [])

  // Calculate comprehensive stats
  const moduleStats = useMemo(() => {
    const submissionStats = {
      total: submissions.length,
      pending: submissions.filter((s: any) => s.status === "pending" || s.status === "Pending").length,
      approved: submissions.filter((s: any) => s.status === "approved" || s.status === "Approved").length,
      rejected: submissions.filter((s: any) => s.status === "rejected" || s.status === "Rejected").length,
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
      completed: materialAllocations.filter((a: any) => a.status === "completed").length,
    }

    const invoiceStats = {
      total: invoices.length,
      paid: invoices.filter((i: any) => i.status === "Paid").length,
      unpaid: invoices.filter((i: any) => i.status === "Unpaid").length,
      pending: invoices.filter((i: any) => i.status === "Pending" || i.status === "Due Date Expected").length,
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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

  // Recent data for previews
  const recentProjects = projects.slice(0, 3)
  const recentFiles = files.slice(0, 3)
  const pendingSubmissions = submissions.filter((s: any) => s.status === "pending" || s.status === "Pending").slice(0, 3)
  const recentInvoices = invoices.slice(0, 3)
  const pendingMaterialRequests = materialRequests.filter((r: any) => r.status === "pending").slice(0, 3)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main Stats Section - Section Card Design */}
      {dashboardStats && (
        <div
          className="px-4 lg:px-6 py-4 relative bg-cover bg-center bg-no-repeat rounded-lg mx-4 mt-4 shrink-0"
          style={{
            backgroundImage: "url('/image/dashboard-bg.png')",
            minHeight: "140px",
          }}
        >
          <div className="absolute inset-0 bg-background/30 dark:bg-background/50 rounded-lg z-0"></div>
          <div className="relative z-10">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-black border-white hover:bg-white/90 h-7 text-xs"
                  onClick={() => toggleSheet("quickActions")}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Quick Actions
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time system status and key metrics
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
              {isLoadingDashboard ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {dashboardStats.totalActiveProjects.value}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        Active Projects
                      </CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {dashboardStats.detailingInProcess.value}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        Detailing
                      </CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {dashboardStats.releasedJobs.value}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        Released Jobs
                      </CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {dashboardStats.revisionInProcess.value}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        In Revision
                      </CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {dashboardStats.yetToBeDetailed.value}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        Pending Detail
                      </CardDescription>
                    </div>
                  </Card>
                  <Card className="@container/card h-16 flex items-center">
                    <div className="w-full px-3 text-left">
                      <CardTitle className="text-sm font-semibold mb-1 tabular-nums">
                        {format(new Date(), "d MMM")}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground">
                        Today
                      </CardDescription>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Module Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 px-4 mt-2">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 shrink-0 h-9 mb-2">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs">Submissions</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs">Materials</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
          <TabsTrigger value="evaluation" className="text-xs">Evaluation</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
            <Sheet open={openSheets.files} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, files: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Files"
                    value={moduleStats.files.total}
                    description="Total Files"
                    icon={<Folder className="h-4 w-4" />}
                    onClick={() => toggleSheet("files")}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Files</SheetTitle>
                  <SheetDescription>Manage and view all files</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  {isLoadingFiles ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : recentFiles.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentFiles.map((file: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{file.name || `File ${idx + 1}`}</TableCell>
                              <TableCell>{file.type || "N/A"}</TableCell>
                              <TableCell>{file.size || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No files found</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.submissions} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, submissions: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Submissions"
                    value={moduleStats.submissions.total}
                    description="Total Submissions"
                    icon={<Upload className="h-4 w-4" />}
                    onClick={() => toggleSheet("submissions")}
                    badge={moduleStats.submissions.pending > 0 ? { label: `${moduleStats.submissions.pending} P`, variant: "secondary" } : undefined}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Submissions</SheetTitle>
                  <SheetDescription>View and manage submissions</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  {isLoadingSubmissions ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : pendingSubmissions.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingSubmissions.map((sub: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">#{sub.id || idx + 1}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {sub.status || "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {sub.date ? format(new Date(sub.date), "MMM dd, yyyy") : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending submissions</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.materials} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, materials: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Material Requests"
                    value={moduleStats.materialRequests.total}
                    description="Material Requests"
                    icon={<Package className="h-4 w-4" />}
                    onClick={() => toggleSheet("materials")}
                    badge={moduleStats.materialRequests.pending > 0 ? { label: `${moduleStats.materialRequests.pending} P`, variant: "secondary" } : undefined}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Material Management</SheetTitle>
                  <SheetDescription>View material requests and allocations</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Requests</h3>
                    {pendingMaterialRequests.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Request ID</TableHead>
                              <TableHead>Material</TableHead>
                              <TableHead>Priority</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingMaterialRequests.map((req: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{req.id || `REQ-${idx + 1}`}</TableCell>
                                <TableCell>{req.materialId || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant={req.priority === "urgent" ? "destructive" : "secondary"} className="text-xs">
                                    {req.priority || "medium"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No pending requests</p>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.billing} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, billing: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Billing"
                    value={billingStats?.totalInvoices.value || 0}
                    description="Total Invoices"
                    icon={<CreditCard className="h-4 w-4" />}
                    onClick={() => toggleSheet("billing")}
                    badge={billingStats && parseInt(billingStats.overdueInvoices.value.toString()) > 0 ? { label: `${billingStats.overdueInvoices.value} O`, variant: "destructive" } : undefined}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Billing & Invoices</SheetTitle>
                  <SheetDescription>View invoices and billing information</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  {billingStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      <Card className="p-3">
                        <div className="text-sm font-semibold">{billingStats.totalInvoices.value}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm font-semibold text-yellow-600">{billingStats.pendingPayments.value}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm font-semibold text-green-600">{billingStats.paidThisMonth.value}</div>
                        <div className="text-xs text-muted-foreground">Paid</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm font-semibold text-red-600">{billingStats.overdueInvoices.value}</div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </Card>
                    </div>
                  )}
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <InvoiceTable showTitle={false} />
                  </Suspense>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.evaluation} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, evaluation: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Evaluation"
                    value={moduleStats.evaluations.total}
                    description="Evaluation Log"
                    icon={<ClipboardList className="h-4 w-4" />}
                    onClick={() => toggleSheet("evaluation")}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Evaluation Log</SheetTitle>
                  <SheetDescription>View evaluation logs and requests</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  {isLoadingEvaluations ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : evaluations.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evaluations.slice(0, 10).map((evaluation: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">#{evaluation.id || idx + 1}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {evaluation.status || "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {evaluation.date ? format(new Date(evaluation.date), "MMM dd, yyyy") : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No evaluations found</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.changeOrders} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, changeOrders: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Change Orders"
                    value="0"
                    description="Change Orders"
                    icon={<FileText className="h-4 w-4" />}
                    onClick={() => toggleSheet("changeOrders")}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Change Orders</SheetTitle>
                  <SheetDescription>View and manage change orders</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">No change orders available</p>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.chat} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, chat: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Chat"
                    value="0"
                    description="Messages"
                    icon={<MessageCircle className="h-4 w-4" />}
                    onClick={() => toggleSheet("chat")}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Chat</SheetTitle>
                  <SheetDescription>Messages and conversations</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">No messages available</p>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={openSheets.status} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, status: open }))}>
              <SheetTrigger asChild>
                <div>
                  <ModuleCard
                    title="Status"
                    value="Online"
                    description="System Status"
                    icon={<Activity className="h-4 w-4" />}
                    onClick={() => toggleSheet("status")}
                    badge={{ label: "OK", variant: "default" }}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>System Status</SheetTitle>
                  <SheetDescription>Monitor system health and status</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">API Status</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Database</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">System Load</span>
                    </div>
                    <Badge variant="default">Normal</Badge>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Collapsible Recent Activity */}
          <Collapsible
            open={expandedSections.recentActivity}
            onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, recentActivity: open }))}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    {expandedSections.recentActivity ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {recentProjects.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-1">Recent Projects</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="h-8">
                                <TableHead className="text-[10px] h-8">Project</TableHead>
                                <TableHead className="text-[10px] h-8">Job Number</TableHead>
                                <TableHead className="text-[10px] h-8">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentProjects.map((project: any) => (
                                <TableRow key={project.id || project.jobNumber} className="h-8">
                                  <TableCell className="text-[10px] font-medium">
                                    {project.projectName || project.jobNumber || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-[10px]">{project.jobNumber || "-"}</TableCell>
                                  <TableCell className="text-[10px]">
                                    <Badge variant="default" className="text-[9px] px-1">
                                      {project.status || "Active"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        {/* Other Tabs - Placeholder content */}
        <TabsContent value="files" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Files Module</CardTitle>
              <CardDescription>Access files and projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Files content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Submissions Module</CardTitle>
              <CardDescription>Manage submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Submissions content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Materials Module</CardTitle>
              <CardDescription>Material management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Materials content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Billing Module</CardTitle>
              <CardDescription>Billing and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Billing content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Module</CardTitle>
              <CardDescription>Evaluation logs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Evaluation content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Status Module</CardTitle>
              <CardDescription>System status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Status content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Settings Module</CardTitle>
              <CardDescription>Application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Settings content will be loaded here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Sheet */}
      <Sheet open={openSheets.quickActions} onOpenChange={(open) => setOpenSheets(prev => ({ ...prev, quickActions: open }))}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
            <SheetDescription>Access frequently used functions</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => toggleSheet("quickActions")}>
              <Plus className="mr-2 h-4 w-4" />
              New Submission
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toggleSheet("quickActions")}>
              <Package className="mr-2 h-4 w-4" />
              Material Request
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toggleSheet("quickActions")}>
              <FileText className="mr-2 h-4 w-4" />
              Change Order
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toggleSheet("quickActions")}>
              <Folder className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
