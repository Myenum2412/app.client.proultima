/**
 * Optimized Invoices API Route
 * Uses service layer, validation, and proper error handling
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import { requireAuth } from '@/lib/middleware/auth-middleware'
import { invoicesService } from '@/lib/services/invoices-service'
import { invoiceSchema, invoiceFiltersSchema } from '@/lib/validation/schemas'
import { validate, createValidationErrorResponse } from '@/lib/validation/validator'
import { InvoiceFilters } from '@/lib/types/invoice'

/**
 * GET /api/invoices
 * Fetch invoices with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Optional auth - allow unauthenticated access for now
    // const authResult = await requireAuth(request)
    // if (authResult.error) {
    //   return authResult.error
    // }

    const { searchParams } = new URL(request.url)
    const filters: InvoiceFilters = {}

    // Parse filters from query params
    if (searchParams.get('invoiceId')) {
      filters.invoiceId = searchParams.get('invoiceId') || undefined
    }
    if (searchParams.get('projectNumber')) {
      filters.projectNumber = searchParams.get('projectNumber') || undefined
    }
    if (searchParams.get('projectName')) {
      filters.projectName = searchParams.get('projectName') || undefined
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as InvoiceFilters['status'] || undefined
    }
    
    // Parse range filters
    if (searchParams.get('billedTonnageMin') || searchParams.get('billedTonnageMax')) {
      filters.billedTonnage = {
        min: searchParams.get('billedTonnageMin') ? Number(searchParams.get('billedTonnageMin')) : undefined,
        max: searchParams.get('billedTonnageMax') ? Number(searchParams.get('billedTonnageMax')) : undefined,
      }
    }
    if (searchParams.get('billedHoursCOMin') || searchParams.get('billedHoursCOMax')) {
      filters.billedHoursCO = {
        min: searchParams.get('billedHoursCOMin') ? Number(searchParams.get('billedHoursCOMin')) : undefined,
        max: searchParams.get('billedHoursCOMax') ? Number(searchParams.get('billedHoursCOMax')) : undefined,
      }
    }
    if (searchParams.get('coPriceMin') || searchParams.get('coPriceMax')) {
      filters.coPrice = {
        min: searchParams.get('coPriceMin') ? Number(searchParams.get('coPriceMin')) : undefined,
        max: searchParams.get('coPriceMax') ? Number(searchParams.get('coPriceMax')) : undefined,
      }
    }
    if (searchParams.get('issueDateFrom') || searchParams.get('issueDateTo')) {
      filters.issueDate = {
        from: searchParams.get('issueDateFrom') || undefined,
        to: searchParams.get('issueDateTo') || undefined,
      }
    }

    // Validate filters (optional validation for filters)
    // Use service layer
    const { data, error } = await invoicesService.getInvoices(filters)

    if (error) {
      return createErrorResponse(error, 500)
    }

    return createSuccessResponse(data || [])
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()

    // Validate request body
    const validation = validate(invoiceSchema, body)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    // Normalize paidDate: convert undefined to null to match Invoice type
    const invoiceData = {
      ...validation.data,
      paidDate: validation.data.paidDate ?? null,
    }

    // Use service layer
    const { data, error } = await invoicesService.createInvoice(invoiceData)

    if (error) {
      return createErrorResponse(error, 400)
    }

    if (!data) {
      return createErrorResponse('Failed to create invoice', 500)
    }

    return createSuccessResponse(data, 'Invoice created successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

