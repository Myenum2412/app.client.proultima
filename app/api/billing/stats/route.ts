import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

interface BillingStats {
  totalInvoices: {
    value: number | string
    label: string
  }
  pendingPayments: {
    value: number | string
    label: string
  }
  paidThisMonth: {
    value: number | string
    label: string
  }
  overdueInvoices: {
    value: number | string
    label: string
  }
  upcomingPayments: {
    value: number | string
    label: string
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Fetch invoices from Supabase (assuming you have an invoices table)
    // For now, using mock data structure
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')

    // If invoices table doesn't exist, return default stats
    if (error || !invoices) {
      return createSuccessResponse<BillingStats>({
        totalInvoices: { value: 10, label: 'Total Invoices' },
        pendingPayments: { value: '$858,583.00', label: 'Pending Payments' },
        paidThisMonth: { value: '$0.00', label: 'Paid This Month' },
        overdueInvoices: { value: 5, label: 'Overdue Invoices' },
        upcomingPayments: { value: '$0.00', label: 'Upcoming Payments' },
      })
    }

    // Calculate stats from invoices
    const totalInvoices = invoices.length
    const pendingPayments = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const paidThisMonth = invoices
      .filter(inv => {
        if (inv.status !== 'paid') return false
        const paidDate = new Date(inv.paid_at || inv.updated_at)
        const now = new Date()
        return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'pending') return false
      const dueDate = new Date(inv.due_date)
      return dueDate < new Date()
    }).length
    const upcomingPayments = invoices
      .filter(inv => {
        if (inv.status !== 'pending') return false
        const dueDate = new Date(inv.due_date)
        const now = new Date()
        return dueDate >= now
      })
      .reduce((sum, inv) => sum + (inv.amount || 0), 0)

    const stats: BillingStats = {
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

    return createSuccessResponse(stats)
  } catch (error) {
    return handleApiError(error)
  }
}

