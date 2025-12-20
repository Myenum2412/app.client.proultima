import { createServerClient } from './server'
import { Invoice } from '@/lib/types/invoice'

export interface ServerInvoice {
  id: string
  invoice_id: string
  project_number: string
  project_name: string
  billed_tonnage: number
  unit_price_lump_sum: number
  tons_billed_amount: number
  billed_hours_co: number
  co_price: number
  co_billed_amount: number
  total_amount_billed: number
  status: string
  paid_date: string | null
  issue_date: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all invoices from Supabase (server-side)
 * @returns Array of invoices or empty array on error
 */
export async function getInvoicesServer(): Promise<ServerInvoice[]> {
  try {
    const supabase = createServerClient()
    
    // Optionally check for authenticated user
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return []
    // }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices from server:', error)
      return []
    }

    return invoices || []
  } catch (error) {
    console.error('Error in getInvoicesServer:', error)
    return []
  }
}

/**
 * Transform server invoice data to match the Invoice interface format
 * This matches the camelCase format used by the API route transformation
 */
export function transformServerInvoice(invoice: ServerInvoice): Invoice {
  return {
    id: invoice.id,
    invoiceId: invoice.invoice_id || '',
    projectNumber: invoice.project_number || '',
    projectName: invoice.project_name || '',
    billedTonnage: Number(invoice.billed_tonnage) || 0,
    unitPriceLumpSum: Number(invoice.unit_price_lump_sum) || 0,
    tonsBilledAmount: Number(invoice.tons_billed_amount) || 0,
    billedHoursCO: Number(invoice.billed_hours_co) || 0,
    coPrice: Number(invoice.co_price) || 0,
    coBilledAmount: Number(invoice.co_billed_amount) || 0,
    totalAmountBilled: Number(invoice.total_amount_billed) || 0,
    status: (invoice.status as Invoice['status']) || 'Unpaid',
    paidDate: invoice.paid_date || null,
    issueDate: invoice.issue_date || new Date().toISOString(),
    createdAt: invoice.created_at || '',
    updatedAt: invoice.updated_at || '',
  }
}

