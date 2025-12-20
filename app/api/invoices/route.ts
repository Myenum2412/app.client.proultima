import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'
import { Invoice, InvoiceFilters } from '@/lib/types/invoice'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const filters: InvoiceFilters = {}

    // Parse filters from query params
    if (searchParams.get('invoiceId')) filters.invoiceId = searchParams.get('invoiceId') || undefined
    if (searchParams.get('projectNumber')) filters.projectNumber = searchParams.get('projectNumber') || undefined
    if (searchParams.get('projectName')) filters.projectName = searchParams.get('projectName') || undefined
    if (searchParams.get('status')) filters.status = searchParams.get('status') as Invoice['status'] || undefined
    
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

    // Build query
    let query = supabase
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false })

    // Apply filters
    if (filters.invoiceId) {
      query = query.ilike('invoice_id', `%${filters.invoiceId}%`)
    }
    if (filters.projectNumber) {
      query = query.ilike('project_number', `%${filters.projectNumber}%`)
    }
    if (filters.projectName) {
      query = query.ilike('project_name', `%${filters.projectName}%`)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.billedTonnage?.min !== undefined) {
      query = query.gte('billed_tonnage', filters.billedTonnage.min)
    }
    if (filters.billedTonnage?.max !== undefined) {
      query = query.lte('billed_tonnage', filters.billedTonnage.max)
    }
    if (filters.billedHoursCO?.min !== undefined) {
      query = query.gte('billed_hours_co', filters.billedHoursCO.min)
    }
    if (filters.billedHoursCO?.max !== undefined) {
      query = query.lte('billed_hours_co', filters.billedHoursCO.max)
    }
    if (filters.coPrice?.min !== undefined) {
      query = query.gte('co_price', filters.coPrice.min)
    }
    if (filters.coPrice?.max !== undefined) {
      query = query.lte('co_price', filters.coPrice.max)
    }
    if (filters.issueDate?.from) {
      query = query.gte('issue_date', filters.issueDate.from)
    }
    if (filters.issueDate?.to) {
      query = query.lte('issue_date', filters.issueDate.to)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices from Supabase:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // If RLS error, provide helpful message
      if (error.code === 'PGRST116' || error.message.includes('permission denied') || error.message.includes('RLS')) {
        console.error('RLS Policy Error: Row Level Security is blocking access.')
        console.error('Solution: Either authenticate the user or temporarily disable RLS for testing.')
        return createSuccessResponse<Invoice[]>([])
      }
      
      // Return empty array instead of error to prevent UI crash
      // But log the error for debugging
      return createSuccessResponse<Invoice[]>([])
    }
    
    console.log(`Successfully fetched ${invoices?.length || 0} invoices from Supabase`)

    // Fetch all projects to match with invoices
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_name, project_number, job_number')
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
    }

    // Create a map of project_number to project data for quick lookup
    const projectMap = new Map<string, any>()
    if (projects) {
      projects.forEach((project: any) => {
        const projNum = project.project_number || project.job_number || ''
        if (projNum) {
          projectMap.set(projNum, project)
          // Also map by job_number if different
          if (project.job_number && project.job_number !== projNum) {
            projectMap.set(project.job_number, project)
          }
        }
      })
    }

    // Transform data to match Invoice interface, using real project data when available
    const transformedInvoices: Invoice[] = (invoices || []).map((inv: any) => {
      // Get project number from invoice
      const invoiceProjectNumber = inv.project_number || inv.projectNumber || ''
      
      // Find matching project from projects table
      const project = projectMap.get(invoiceProjectNumber)
      
      // Use real project data if available, otherwise fall back to invoice data
      const projectNumber = project?.project_number || project?.job_number || invoiceProjectNumber
      const projectName = project?.project_name || inv.project_name || inv.projectName || ''
      
      return {
        id: inv.id,
        invoiceId: inv.invoice_id || inv.invoiceId,
        projectNumber: projectNumber,
        projectName: projectName,
        billedTonnage: inv.billed_tonnage || inv.billedTonnage || 0,
        unitPriceLumpSum: inv.unit_price_lump_sum || inv.unitPriceLumpSum || 0,
        tonsBilledAmount: inv.tons_billed_amount || inv.tonsBilledAmount || 0,
        billedHoursCO: inv.billed_hours_co || inv.billedHoursCO || 0,
        coPrice: inv.co_price || inv.coPrice || 0,
        coBilledAmount: inv.co_billed_amount || inv.coBilledAmount || 0,
        totalAmountBilled: inv.total_amount_billed || inv.totalAmountBilled || 0,
        status: inv.status || 'Draft',
        paidDate: inv.paid_date || inv.paidDate || null,
        issueDate: inv.issue_date || inv.issueDate || new Date().toISOString(),
        createdAt: inv.created_at || inv.createdAt,
        updatedAt: inv.updated_at || inv.updatedAt,
      }
    })

    return createSuccessResponse(transformedInvoices)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()
    const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = body

    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
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
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return createSuccessResponse(null, 'Failed to create invoice')
    }

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

