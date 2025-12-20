"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useInvoices } from "@/hooks/use-invoices-optimized"
import { Invoice, InvoiceFilters } from "@/lib/types/invoice"
import { format } from "date-fns"

interface BillingSectionCardProps {
  filters?: InvoiceFilters
  initialInvoices?: Invoice[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function BillingSectionCard({ filters, initialInvoices }: BillingSectionCardProps) {
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices || [])
  
  // Fetch invoices from Supabase (client-side fallback if initialInvoices not provided)
  const { data: supabaseInvoices = [], isLoading, isError } = useInvoices(filters)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  // Create stable filter key to detect filter changes
  const filtersKey = useMemo(() => {
    if (!filters) return ''
    return JSON.stringify({
      status: filters.status,
      issueDate: filters.issueDate,
    })
  }, [filters?.status, filters?.issueDate?.from, filters?.issueDate?.to])
  
  // Update invoices when data or filters change
  useEffect(() => {
    const hasFilters = filters && Object.keys(filters).length > 0
    
    // If filters are applied, always use filtered data from API
    if (hasFilters) {
      setInvoices(supabaseInvoices)
      return
    }
    
    // If no filters and we have initial data, use it
    if (initialInvoices && initialInvoices.length > 0) {
      setInvoices(initialInvoices)
      return
    }
    
    // Otherwise use Supabase data (when no initial data)
    if (supabaseInvoices.length > 0) {
      setInvoices(supabaseInvoices)
    }
  }, [supabaseInvoices, initialInvoices, filtersKey]) // Use filtersKey instead of filters object

  // Calculate stats from invoice data
  const stats = useMemo(() => {
    const totalInvoices = invoices.length
    
    const pendingInvoices = invoices.filter(inv => 
      inv.status === 'Unpaid' || inv.status === 'Due Date Expected'
    )
    const pendingPayments = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmountBilled || 0), 
      0
    )

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const paidThisMonth = invoices
      .filter(inv => {
        if (inv.status !== 'Paid' || !inv.paidDate) return false
        const paidDate = new Date(inv.paidDate)
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
      })
      .reduce((sum, inv) => sum + (inv.totalAmountBilled || 0), 0)

    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'Unpaid' && inv.status !== 'Due Date Expected') return false
      // Check if there's a due date and it's in the past
      // For now, we'll use issueDate + some days as due date if no explicit due date
      return false // Can be enhanced with actual due date logic
    }).length

    const upcomingPayments = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmountBilled || 0), 
      0
    )

    return {
      totalInvoices: {
        value: totalInvoices,
        label: 'Total Invoices',
      },
      pendingPayments: {
        value: formatCurrency(pendingPayments),
        label: 'Pending Payments',
      },
      paidThisMonth: {
        value: formatCurrency(paidThisMonth),
        label: 'Paid This Month',
      },
      overdueInvoices: {
        value: overdueInvoices,
        label: 'Overdue Invoices',
      },
      upcomingPayments: {
        value: formatCurrency(upcomingPayments),
        label: 'Upcoming Payments',
      },
    }
  }, [invoices])

  // Show loading state only if no initial data and still loading from client
  if (!mounted || (!initialInvoices && isLoading && invoices.length === 0)) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading billing stats...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state only if no initial data and there's an error
  if (!initialInvoices && isError) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-destructive">Failed to load billing stats</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg"
      style={{
        backgroundImage: "url('/image/dashboard-bg.png')",
        minHeight: "200px",
      }}
    >
      <div className="absolute inset-0 bg-background/10  rounded-lg z-0"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Billing & Invoices</h1>
              <p className="text-sm text-black">
                Financial Overview and Payment Statistics
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
          {/* Total Invoices */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.totalInvoices.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.totalInvoices.label}
              </CardDescription>
            </div>
          </Card>

          {/* Pending Payments */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.pendingPayments.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.pendingPayments.label}
              </CardDescription>
            </div>
          </Card>

          {/* Paid This Month */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.paidThisMonth.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.paidThisMonth.label}
              </CardDescription>
            </div>
          </Card>

          {/* Overdue Invoices */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.overdueInvoices.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.overdueInvoices.label}
              </CardDescription>
            </div>
          </Card>

          {/* Upcoming Payments */}
          <Card className="@container/card h-24 flex items-center">
            <div className="w-full px-4 text-left">
              <CardTitle className="text-base font-semibold mb-2 tabular-nums">
                {stats.upcomingPayments.value}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {stats.upcomingPayments.label}
              </CardDescription>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

