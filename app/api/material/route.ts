import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching materials:', error)
      return createSuccessResponse([])
    }

    return createSuccessResponse(materials || [])
  } catch (error) {
    return handleApiError(error)
  }
}

