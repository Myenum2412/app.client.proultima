import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let query = supabase.from('change_orders').select('*')

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: changeOrders, error } = await query.order('date', { ascending: false })

    if (error) {
      console.error('Error fetching change orders:', error)
      return createSuccessResponse([])
    }

    // Transform the data to match our interface
    const transformedChangeOrders = (changeOrders || []).map((co: any) => ({
      id: co.id || co.change_order_id || '',
      description: co.description || '',
      amount: co.amount || 0,
      date: co.date || co.created_at || '',
      status: co.status || 'Pending',
      weightChanges: co.weight_changes || co.weightChanges || 0,
      totalHours: co.total_hours || co.totalHours || 0,
      pdfPath: co.pdf_path || co.pdfPath || '',
    }))

    return createSuccessResponse(transformedChangeOrders)
  } catch (error) {
    return handleApiError(error)
  }
}

