import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let query = supabase
      .from('material_requests')
      .select('*')
      .order('requested_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching material requests:', error)
      return createSuccessResponse([])
    }

    return createSuccessResponse(requests || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()

    const { data: newRequest, error } = await supabase
      .from('material_requests')
      .insert({
        material_id: body.materialId,
        material_title: body.materialTitle,
        quantity: body.quantity,
        priority: body.priority,
        status: 'pending',
        requested_by: body.requestedBy || '',
        project: body.project,
        requested_date: body.requestedDate || new Date().toISOString(),
        required_date: body.requiredDate,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material request:', error)
      return handleApiError(error)
    }

    return createSuccessResponse(newRequest, 'Material request created successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return handleApiError(new Error('Request ID is required'))
    }

    const updateData: any = { ...updates }
    
    if (updates.status === 'approved') {
      updateData.approved_by = updates.approvedBy || ''
      updateData.approved_date = new Date().toISOString()
    }

    const { data: updatedRequest, error } = await supabase
      .from('material_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating material request:', error)
      return handleApiError(error)
    }

    return createSuccessResponse(updatedRequest, 'Material request updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
