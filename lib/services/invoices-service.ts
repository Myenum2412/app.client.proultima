/**
 * Invoices Service
 * Business logic layer for invoice operations
 */

import { db } from './database'
import { Validator } from '@/lib/utils/validation'
import { Invoice } from '@/lib/types/invoice'

export class InvoicesService {
  /**
   * Get invoices with filters
   */
  async getInvoices(filters?: any): Promise<{ data: Invoice[] | null; error: string | null }> {
    const dbFilters: Record<string, any> = {}

    if (filters?.invoiceId) {
      dbFilters.invoice_id = { eq: filters.invoiceId }
    }
    if (filters?.projectNumber) {
      dbFilters.project_number = { eq: filters.projectNumber }
    }
    if (filters?.projectName) {
      dbFilters.project_name = { eq: filters.projectName }
    }
    if (filters?.status) {
      dbFilters.status = { eq: filters.status }
    }

    // Range filters
    if (filters?.billedTonnage?.min !== undefined) {
      dbFilters.billed_tonnage = { gte: filters.billedTonnage.min }
    }
    if (filters?.billedTonnage?.max !== undefined) {
      dbFilters.billed_tonnage = { ...dbFilters.billed_tonnage, lte: filters.billedTonnage.max }
    }

    if (filters?.billedHoursCO?.min !== undefined) {
      dbFilters.billed_hours_co = { gte: filters.billedHoursCO.min }
    }
    if (filters?.billedHoursCO?.max !== undefined) {
      dbFilters.billed_hours_co = { ...dbFilters.billed_hours_co, lte: filters.billedHoursCO.max }
    }

    if (filters?.coPrice?.min !== undefined) {
      dbFilters.co_price = { gte: filters.coPrice.min }
    }
    if (filters?.coPrice?.max !== undefined) {
      dbFilters.co_price = { ...dbFilters.co_price, lte: filters.coPrice.max }
    }

    if (filters?.issueDate?.from) {
      dbFilters.issue_date = { gte: filters.issueDate.from }
    }
    if (filters?.issueDate?.to) {
      dbFilters.issue_date = { ...dbFilters.issue_date, lte: filters.issueDate.to }
    }

    const { data, error } = await db.select<any>('invoices', {
      filters: dbFilters,
      orderBy: { column: 'issue_date', ascending: false },
    })

    if (error) {
      return { data: null, error: error.message }
    }

    // Transform database format to application format
    const invoices: Invoice[] = (data || []).map((inv: any) => ({
      id: inv.id,
      invoiceId: inv.invoice_id,
      projectNumber: inv.project_number,
      projectName: inv.project_name,
      billedTonnage: Number(inv.billed_tonnage),
      unitPriceLumpSum: Number(inv.unit_price_lump_sum),
      tonsBilledAmount: Number(inv.tons_billed_amount),
      billedHoursCO: Number(inv.billed_hours_co),
      coPrice: Number(inv.co_price),
      coBilledAmount: Number(inv.co_billed_amount),
      totalAmountBilled: Number(inv.total_amount_billed),
      status: inv.status,
      paidDate: inv.paid_date,
      issueDate: inv.issue_date,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }))

    return { data: invoices, error: null }
  }

  /**
   * Get single invoice
   */
  async getInvoice(id: string): Promise<{ data: Invoice | null; error: string | null }> {
    const { data, error } = await db.select<any>('invoices', {
      filters: { id: { eq: id } },
    })

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: null, error: 'Invoice not found' }
    }

    const inv = data[0]
    const invoice: Invoice = {
      id: inv.id,
      invoiceId: inv.invoice_id,
      projectNumber: inv.project_number,
      projectName: inv.project_name,
      billedTonnage: Number(inv.billed_tonnage),
      unitPriceLumpSum: Number(inv.unit_price_lump_sum),
      tonsBilledAmount: Number(inv.tons_billed_amount),
      billedHoursCO: Number(inv.billed_hours_co),
      coPrice: Number(inv.co_price),
      coBilledAmount: Number(inv.co_billed_amount),
      totalAmountBilled: Number(inv.total_amount_billed),
      status: inv.status,
      paidDate: inv.paid_date,
      issueDate: inv.issue_date,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }

    return { data: invoice, error: null }
  }

  /**
   * Create invoice
   */
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Invoice | null; error: string | null }> {
    // Validate
    const validation = Validator.validateInvoice(invoice)
    if (!validation.valid) {
      return { data: null, error: validation.errors.join(', ') }
    }

    // Transform to database format
    const dbInvoice = {
      invoice_id: invoice.invoiceId,
      project_number: invoice.projectNumber,
      project_name: invoice.projectName,
      billed_tonnage: invoice.billedTonnage,
      unit_price_lump_sum: invoice.unitPriceLumpSum,
      tons_billed_amount: invoice.tonsBilledAmount,
      billed_hours_co: invoice.billedHoursCO,
      co_price: invoice.coPrice,
      co_billed_amount: invoice.coBilledAmount,
      total_amount_billed: invoice.totalAmountBilled,
      status: invoice.status,
      paid_date: invoice.paidDate,
      issue_date: invoice.issueDate,
    }

    const { data, error } = await db.insert('invoices', dbInvoice)

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: null, error: 'Failed to create invoice' }
    }

    // Transform back to application format
    const inv = data[0] as any
    const createdInvoice: Invoice = {
      id: inv.id,
      invoiceId: inv.invoice_id,
      projectNumber: inv.project_number,
      projectName: inv.project_name,
      billedTonnage: Number(inv.billed_tonnage),
      unitPriceLumpSum: Number(inv.unit_price_lump_sum),
      tonsBilledAmount: Number(inv.tons_billed_amount),
      billedHoursCO: Number(inv.billed_hours_co),
      coPrice: Number(inv.co_price),
      coBilledAmount: Number(inv.co_billed_amount),
      totalAmountBilled: Number(inv.total_amount_billed),
      status: inv.status,
      paidDate: inv.paid_date,
      issueDate: inv.issue_date,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }

    return { data: createdInvoice, error: null }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<{ data: Invoice | null; error: string | null }> {
    // Transform updates to database format
    const dbUpdates: any = {}

    if (updates.invoiceId !== undefined) dbUpdates.invoice_id = updates.invoiceId
    if (updates.projectNumber !== undefined) dbUpdates.project_number = updates.projectNumber
    if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName
    if (updates.billedTonnage !== undefined) dbUpdates.billed_tonnage = updates.billedTonnage
    if (updates.unitPriceLumpSum !== undefined) dbUpdates.unit_price_lump_sum = updates.unitPriceLumpSum
    if (updates.tonsBilledAmount !== undefined) dbUpdates.tons_billed_amount = updates.tonsBilledAmount
    if (updates.billedHoursCO !== undefined) dbUpdates.billed_hours_co = updates.billedHoursCO
    if (updates.coPrice !== undefined) dbUpdates.co_price = updates.coPrice
    if (updates.coBilledAmount !== undefined) dbUpdates.co_billed_amount = updates.coBilledAmount
    if (updates.totalAmountBilled !== undefined) dbUpdates.total_amount_billed = updates.totalAmountBilled
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.paidDate !== undefined) dbUpdates.paid_date = updates.paidDate
    if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate

    const { data, error } = await db.update('invoices', id, dbUpdates)

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: 'Invoice not found' }
    }

    // Transform back to application format
    const inv = data as any
    const updatedInvoice: Invoice = {
      id: inv.id,
      invoiceId: inv.invoice_id,
      projectNumber: inv.project_number,
      projectName: inv.project_name,
      billedTonnage: Number(inv.billed_tonnage),
      unitPriceLumpSum: Number(inv.unit_price_lump_sum),
      tonsBilledAmount: Number(inv.tons_billed_amount),
      billedHoursCO: Number(inv.billed_hours_co),
      coPrice: Number(inv.co_price),
      coBilledAmount: Number(inv.co_billed_amount),
      totalAmountBilled: Number(inv.total_amount_billed),
      status: inv.status,
      paidDate: inv.paid_date,
      issueDate: inv.issue_date,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }

    return { data: updatedInvoice, error: null }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<{ error: string | null }> {
    const { error } = await db.delete('invoices', id)
    return { error: error?.message || null }
  }
}

export const invoicesService = new InvoicesService()

