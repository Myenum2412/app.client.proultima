import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()
    const { invoiceIds, format = 'csv' } = body

    if (!invoiceIds || invoiceIds.length === 0) {
      return createSuccessResponse(null, 'No invoices selected for export.')
    }

    // Fetch invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices for export:', error)
      return createSuccessResponse(null, `Error fetching invoices: ${error.message}`)
    }

    if (!invoices || invoices.length === 0) {
      return createSuccessResponse(null, 'No invoices found to export.')
    }

    // Transform data for export
    const exportData = invoices.map((inv: any) => ({
      'Invoice ID': inv.invoice_id,
      'Project Number': inv.project_number,
      'Project Name': inv.project_name,
      'Billed Tonnage': inv.billed_tonnage,
      'Unit Price': inv.unit_price_lump_sum,
      'Tons Billed Amount': inv.tons_billed_amount,
      'Billed Hours CO': inv.billed_hours_co,
      'CO Price': inv.co_price,
      'CO Billed Amount': inv.co_billed_amount,
      'Total Amount Billed': inv.total_amount_billed,
      'Status': inv.status,
      'Issue Date': inv.issue_date,
      'Paid Date': inv.paid_date || '',
    }))

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0]).join(',')
      const rows = exportData.map((row) =>
        Object.values(row).map((val) => `"${val}"`).join(',')
      )
      const csv = [headers, ...rows].join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Return JSON for other formats
    return createSuccessResponse(exportData, 'Invoices exported successfully.')
  } catch (error) {
    return handleApiError(error)
  }
}

