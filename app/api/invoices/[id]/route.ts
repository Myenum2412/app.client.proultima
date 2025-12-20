import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'
import { Invoice } from '@/lib/types/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return createSuccessResponse<Invoice | null>(null)
    }

    const transformedInvoice: Invoice = {
      id: invoice.id,
      invoiceId: invoice.invoice_id || invoice.invoiceId,
      projectNumber: invoice.project_number || invoice.projectNumber,
      projectName: invoice.project_name || invoice.projectName,
      billedTonnage: invoice.billed_tonnage || invoice.billedTonnage || 0,
      unitPriceLumpSum: invoice.unit_price_lump_sum || invoice.unitPriceLumpSum || 0,
      tonsBilledAmount: invoice.tons_billed_amount || invoice.tonsBilledAmount || 0,
      billedHoursCO: invoice.billed_hours_co || invoice.billedHoursCO || 0,
      coPrice: invoice.co_price || invoice.coPrice || 0,
      coBilledAmount: invoice.co_billed_amount || invoice.coBilledAmount || 0,
      totalAmountBilled: invoice.total_amount_billed || invoice.totalAmountBilled || 0,
      status: invoice.status || 'Draft',
      paidDate: invoice.paid_date || invoice.paidDate || null,
      issueDate: invoice.issue_date || invoice.issueDate || new Date().toISOString(),
      createdAt: invoice.created_at || invoice.createdAt,
      updatedAt: invoice.updated_at || invoice.updatedAt,
    }

    return createSuccessResponse(transformedInvoice)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()

    const body = await request.json()
    const updates: Partial<Invoice> = body

    const updateData: any = {}
    if (updates.invoiceId !== undefined) updateData.invoice_id = updates.invoiceId
    if (updates.projectNumber !== undefined) updateData.project_number = updates.projectNumber
    if (updates.projectName !== undefined) updateData.project_name = updates.projectName
    if (updates.billedTonnage !== undefined) updateData.billed_tonnage = updates.billedTonnage
    if (updates.unitPriceLumpSum !== undefined) updateData.unit_price_lump_sum = updates.unitPriceLumpSum
    if (updates.tonsBilledAmount !== undefined) updateData.tons_billed_amount = updates.tonsBilledAmount
    if (updates.billedHoursCO !== undefined) updateData.billed_hours_co = updates.billedHoursCO
    if (updates.coPrice !== undefined) updateData.co_price = updates.coPrice
    if (updates.coBilledAmount !== undefined) updateData.co_billed_amount = updates.coBilledAmount
    if (updates.totalAmountBilled !== undefined) updateData.total_amount_billed = updates.totalAmountBilled
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate
    if (updates.issueDate !== undefined) updateData.issue_date = updates.issueDate

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return createSuccessResponse(null, 'Failed to update invoice')
    }

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      return createSuccessResponse(null, 'Failed to delete invoice')
    }

    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

