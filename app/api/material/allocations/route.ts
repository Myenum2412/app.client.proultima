import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const project = searchParams.get('project')

    let query = supabase
      .from('material_allocations')
      .select('*')
      .order('allocated_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (project) {
      query = query.eq('project', project)
    }

    const { data: allocations, error } = await query

    if (error) {
      console.error('Error fetching material allocations:', error)
      return createSuccessResponse([])
    }

    return createSuccessResponse(allocations || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()

    const { data: newAllocation, error } = await supabase
      .from('material_allocations')
      .insert({
        material_id: body.materialId,
        material_title: body.materialTitle,
        request_id: body.requestId,
        allocated_quantity: body.allocatedQuantity,
        status: 'allocated',
        allocated_to: body.allocatedTo,
        project: body.project,
        allocated_date: body.allocatedDate || new Date().toISOString(),
        expected_delivery_date: body.expectedDeliveryDate,
        location: body.location,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material allocation:', error)
      return handleApiError(error)
    }

    return createSuccessResponse(newAllocation, 'Material allocation created successfully')
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
      return handleApiError(new Error('Allocation ID is required'))
    }

    const { data: updatedAllocation, error } = await supabase
      .from('material_allocations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating material allocation:', error)
      return handleApiError(error)
    }

    return createSuccessResponse(updatedAllocation, 'Material allocation updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
